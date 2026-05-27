-- ============================================================
-- Migration 039: Système de tiers d'abonnement PAID/Free Trial
-- CdC PROMOTE-CONNECT v1.1 — Section 1
-- ============================================================

-- 1. Ajouter subscription_tier sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free_trial'
    CHECK (subscription_tier IN ('free_trial', 'paid'));

-- 2. Ajouter les dates de trial/abonnement
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- 3. Ajouter account_status (remplace is_active + distingue suspended vs blocked)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'blocked'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked_reason text;

-- 4. Migrer is_active → account_status
-- Les comptes inactifs (is_active=false) deviennent "suspended"
UPDATE public.profiles
  SET account_status = 'suspended'
  WHERE is_active = false AND account_status = 'active';

-- 5. Migrer access_level → subscription_tier
-- Les comptes 'premium' deviennent 'paid', les 'classic' restent 'free_trial'
UPDATE public.profiles
  SET subscription_tier = 'paid'
  WHERE access_level = 'premium';

-- Les admins sont toujours 'paid'
UPDATE public.profiles
  SET subscription_tier = 'paid'
  WHERE role = 'admin';

-- 6. Ajouter initiated_by sur conversations pour la logique asymétrique
-- CdC §2.1 — "Le système vérifie toujours qui a ouvert la conversation en premier"
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS initiated_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS initiated_by_tier text;

-- Peupler initiated_by pour les conversations existantes (participant_a comme initiateur par défaut)
UPDATE public.conversations
  SET initiated_by = participant_a
  WHERE initiated_by IS NULL;

-- 7. Fonction helper pour vérifier si un user est 'paid'
CREATE OR REPLACE FUNCTION public.is_paid()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND subscription_tier = 'paid'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 8. Fonction helper pour vérifier si un compte est actif (account_status)
CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND account_status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 9. Trigger pour lever automatiquement les suspensions expirées
CREATE OR REPLACE FUNCTION public.auto_lift_suspension()
RETURNS trigger AS $$
BEGIN
  -- Si la suspension a une date de fin définie et qu'elle est passée, lever la suspension
  IF NEW.account_status = 'suspended'
     AND NEW.suspended_until IS NOT NULL
     AND NEW.suspended_until <= now()
  THEN
    NEW.account_status := 'active';
    NEW.suspended_until := NULL;
    NEW.suspended_at := NULL;
    NEW.suspended_reason := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_lift_suspension
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_lift_suspension();

-- 10. Fonction pour lever automatiquement les suspensions (appelable par cron ou API)
CREATE OR REPLACE FUNCTION public.process_expired_suspensions()
RETURNS integer AS $$
DECLARE
  lifted_count integer;
BEGIN
  UPDATE public.profiles
  SET
    account_status = 'active',
    suspended_until = NULL,
    suspended_at = NULL,
    suspended_reason = NULL
  WHERE
    account_status = 'suspended'
    AND suspended_until IS NOT NULL
    AND suspended_until <= now();

  GET DIAGNOSTICS lifted_count = ROW_COUNT;
  RETURN lifted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Mise à jour du trigger handle_new_user pour inclure subscription_tier
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    company,
    role,
    sector,
    country,
    pavillon,
    access_level,
    subscription_tier,
    account_status
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'company',
    COALESCE(NEW.raw_user_meta_data->>'role', 'visiteur'),
    NEW.raw_user_meta_data->>'sector',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'pavillon',
    COALESCE(NEW.raw_user_meta_data->>'access_level', 'classic'),
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'free_trial'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    company = EXCLUDED.company,
    role = EXCLUDED.role,
    sector = EXCLUDED.sector,
    country = EXCLUDED.country,
    pavillon = EXCLUDED.pavillon,
    access_level = EXCLUDED.access_level,
    subscription_tier = EXCLUDED.subscription_tier;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.profiles (id, role, access_level, subscription_tier, account_status)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'visiteur'), 'classic', 'free_trial', 'active')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore to not block auth.users insert
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Commentaires
COMMENT ON COLUMN profiles.subscription_tier IS 'Tier d''abonnement: free_trial (limité) ou paid (illimité — 100 000 F CFA/an)';
COMMENT ON COLUMN profiles.trial_ends_at IS 'Date de fin de la période d''essai gratuit';
COMMENT ON COLUMN profiles.account_status IS 'Statut du compte: active, suspended (temporaire), blocked (permanent)';
COMMENT ON COLUMN profiles.suspended_until IS 'Date de levée automatique de la suspension (NULL = indéfini)';
COMMENT ON COLUMN profiles.blocked_at IS 'Date de blocage définitif du compte';
COMMENT ON COLUMN profiles.blocked_reason IS 'Raison du blocage (usage interne admin uniquement)';
COMMENT ON COLUMN conversations.initiated_by IS 'UUID du profil qui a ouvert la conversation (logique asymétrique messagerie CdC §2.1)';
COMMENT ON COLUMN conversations.initiated_by_tier IS 'Snapshot du tier de l''initiateur au moment de la création';
