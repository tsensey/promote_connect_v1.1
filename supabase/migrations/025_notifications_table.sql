-- ============================================================
-- Migration 025: Notifications Table
-- ============================================================

-- 1. Création de la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Le destinataire
  sender_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- L'expéditeur
  type          text NOT NULL, -- e.g., 'mention_post', 'mention_comment', 'like', 'comment'
  data          jsonb NOT NULL DEFAULT '{}'::jsonb, -- e.g., { post_id, comment_id, message }
  is_read       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Index pour la performance
CREATE INDEX IF NOT EXISTS notifications_profile_id_idx ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Lecture: l'utilisateur peut lire ses propres notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (profile_id = auth.uid());

-- Mise à jour: l'utilisateur peut marquer ses propres notifications comme lues
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Insertion: les notifications peuvent être insérées par n'importe quel utilisateur authentifié
-- (pour simplifier le déclenchement côté client, sinon on utiliserait un trigger or RPC)
CREATE POLICY "notifications_insert_all" ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Suppression: l'utilisateur peut supprimer ses propres notifications
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE
  USING (profile_id = auth.uid());

-- Les admins peuvent tout voir
CREATE POLICY "notifications_admin_all" ON public.notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Publication en temps réel
-- Note: Assurez-vous que la réplication de la table notifications est activée dans Supabase Dashboard
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
