-- ============================================================
-- Migration 029: Blocage d'utilisateurs (harcèlement)
-- 1. Crée la table blocked_users
-- 2. Ajoute les politiques RLS
-- 3. Ajoute les index
-- ============================================================

-- 1. Table de blocage
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'harassment',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- 2. RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Voir ses propres blocages
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (blocker_id = auth.uid());

-- Créer un blocage
CREATE POLICY "Users can create their own blocks"
  ON public.blocked_users FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

-- Supprimer un blocage (débloquer)
CREATE POLICY "Users can delete their own blocks"
  ON public.blocked_users FOR DELETE
  USING (blocker_id = auth.uid());

-- Administrateurs peuvent tout gérer
CREATE POLICY "Admins can manage blocked_users"
  ON public.blocked_users FOR ALL
  USING (public.is_admin());

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker
  ON public.blocked_users(blocker_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked
  ON public.blocked_users(blocked_id);

-- Publication Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'blocked_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;
  END IF;
END $$;
