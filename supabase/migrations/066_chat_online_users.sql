-- 066: Table de présence en ligne pour les utilisateurs du chat
-- Permet d'afficher un indicateur vert quand l'interlocuteur est en ligne

CREATE TABLE IF NOT EXISTS public.online_users (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'offline'
    CHECK (status IN ('online', 'away', 'offline'))
);

-- RLS : lecture pour tous les utilisateurs authentifiés
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "online_users_select" ON public.online_users;
CREATE POLICY "online_users_select" ON public.online_users
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS : seuls les utilisateurs peuvent upsert leur propre présence
DROP POLICY IF EXISTS "online_users_upsert" ON public.online_users;
CREATE POLICY "online_users_upsert" ON public.online_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "online_users_update_own" ON public.online_users;
CREATE POLICY "online_users_update_own" ON public.online_users
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index pour requêtes "qui est en ligne ?"
CREATE INDEX IF NOT EXISTS idx_online_users_status ON public.online_users(status)
  WHERE status = 'online';

-- Fonction RPC : heartbeat de présence (appelée côté client toutes les 30s)
CREATE OR REPLACE FUNCTION public.upsert_online_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.online_users (user_id, last_seen, status)
  VALUES (p_user_id, now(), 'online')
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_seen = now(),
    status = 'online'
  WHERE online_users.user_id = p_user_id;
END;
$$;

-- Fonction RPC : marquer comme hors-ligne (appelée au blur/close)
CREATE OR REPLACE FUNCTION public.set_user_offline(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.online_users
  SET status = 'offline', last_seen = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Trigger pour nettoyer les utilisateurs inactifs (> 2 min)
CREATE OR REPLACE FUNCTION public.cleanup_stale_online_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.online_users
  SET status = 'offline'
  WHERE status = 'online' AND last_seen < now() - interval '2 minutes';
END;
$$;

-- Activer la réplication sur online_users pour Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_users;
