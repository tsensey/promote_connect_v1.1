-- ============================================================
-- Migration 042: Améliorations blocage entre entreprises
-- CdC PROMOTE-CONNECT v1.1 — Section 3.2
-- Ajoute block_type + restreint aux abonnés PAID
-- ============================================================

-- 1. Ajouter block_type à blocked_users
ALTER TABLE public.blocked_users
  ADD COLUMN IF NOT EXISTS block_type text NOT NULL DEFAULT 'complete'
    CHECK (block_type IN ('messages', 'rdv', 'complete'));

-- 2. Ajouter reason (optionnel, usage interne)
ALTER TABLE public.blocked_users
  ADD COLUMN IF NOT EXISTS user_note text;

-- 3. Corriger la politique RLS INSERT — réserver aux abonnés PAID (SEC-04)
-- CdC §3.2 : "Les entreprises en free trial ne peuvent pas utiliser cette fonctionnalité"
DROP POLICY IF EXISTS "Users can create their own blocks" ON public.blocked_users;

CREATE POLICY "Paid users can create their own blocks"
  ON public.blocked_users FOR INSERT
  WITH CHECK (
    blocker_id = auth.uid()
    AND (
      -- Permettre aux admins
      public.is_admin()
      -- Permettre uniquement aux utilisateurs PAID
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND subscription_tier = 'paid'
          AND account_status = 'active'
      )
    )
  );

-- 4. Commentaires
COMMENT ON COLUMN public.blocked_users.block_type IS 'Type de blocage: messages (messagerie uniquement), rdv (rendez-vous uniquement), complete (blocage total + visibilité)';
COMMENT ON COLUMN public.blocked_users.user_note IS 'Note privée de l''utilisateur sur le blocage (non visible par la cible)';
