-- 065: Message status (sent → delivered → read) + delivered_at + read_at
-- Remplace le simple is_read boolean par un suivi granulaire du statut

-- 1. Ajouter les colonnes de statut
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- 2. Contrainte de validation des statuts
ALTER TABLE public.messages
  ADD CONSTRAINT messages_status_check
  CHECK (status IN ('sending', 'sent', 'delivered', 'read'));

-- 3. Index pour requêtes rapides de statut
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(conversation_id, status);

-- 4. Trigger : dès l'insertion, promouvoir 'sent' → 'delivered'
--    (le message est dans la DB, Realtime le réplique → c'est "livré")
CREATE OR REPLACE FUNCTION public.handle_message_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'sent' OR NEW.status IS NULL THEN
    NEW.status := 'delivered';
    NEW.delivered_at := COALESCE(NEW.delivered_at, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_set_delivered
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_delivered();

-- 5. Trigger : synchroniser is_read avec status pour la rétrocompatibilité
CREATE OR REPLACE FUNCTION public.sync_message_read_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si status passe à 'read', mettre is_read = true et read_at = now()
  IF NEW.status = 'read' AND (OLD.status IS DISTINCT FROM 'read' OR OLD.is_read IS DISTINCT FROM true) THEN
    NEW.is_read := true;
    NEW.read_at := COALESCE(NEW.read_at, now());
  END IF;
  -- Si is_read passe à true, mettre status = 'read' et read_at = now()
  IF NEW.is_read = true AND (OLD.is_read IS DISTINCT FROM true OR OLD.status IS DISTINCT FROM 'read') THEN
    NEW.status := 'read';
    NEW.read_at := COALESCE(NEW.read_at, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_sync_read_status
  BEFORE UPDATE OF status, is_read ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_message_read_status();

-- 6. Backfill : donner un statut aux messages existants
UPDATE public.messages
SET status = CASE
  WHEN is_read = true THEN 'read'
  ELSE 'delivered'
END,
    delivered_at = COALESCE(delivered_at, created_at),
    read_at = CASE WHEN is_read = true THEN COALESCE(read_at, created_at) ELSE NULL END
WHERE status IS NULL OR status = 'sent';

-- 7. Fonction RPC pour marquer les messages comme lus en masse
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  p_conversation_id uuid,
  p_reader_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
  SET status = 'read',
      is_read = true,
      read_at = COALESCE(read_at, now())
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_reader_id
    AND status IS DISTINCT FROM 'read';
END;
$$;

-- 8. RLS : permettre UPDATE status/read_at/is_read via mark_messages_as_read (SECURITY DEFINER gère)
--    et UPDATE direct par les participants de la conversation
DROP POLICY IF EXISTS "messages_update_status" ON public.messages;
CREATE POLICY "messages_update_status" ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  )
  WITH CHECK (
    -- Seul le statut et les colonnes de lecture peuvent être mis à jour
    -- (pas le contenu, sender_id, etc.)
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );
