-- ============================================================
-- Migration 068: Supprimer access_level (classic|premium)
-- Remplacé par subscription_tier (free_trial|paid)
-- Cf. audit complet : les deux champs avaient le même rôle
-- ============================================================

-- 1. Supprimer la fonction is_premium() (remplacée par is_paid() dans migration 039)
DROP FUNCTION IF EXISTS public.is_premium();

-- 2. Mettre à jour handle_new_user() — retirer access_level
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
    subscription_tier = EXCLUDED.subscription_tier;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.profiles (id, role, subscription_tier, account_status)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'visiteur'), 'free_trial', 'active')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore to not block auth.users insert
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Renommer check_access_level_update en check_sensitive_fields_update
-- et retirer access_level des champs surveillés (colonne supprimée)
DROP TRIGGER IF EXISTS trg_check_access_level_update ON public.profiles;
DROP FUNCTION IF EXISTS public.check_access_level_update();

CREATE OR REPLACE FUNCTION public.check_sensitive_fields_update()
RETURNS trigger AS $$
BEGIN
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier
     OR OLD.account_status IS DISTINCT FROM NEW.account_status
     OR OLD.daily_exchange_count IS DISTINCT FROM NEW.daily_exchange_count
     OR OLD.last_exchange_reset IS DISTINCT FROM NEW.last_exchange_reset
     OR OLD.blocked_at IS DISTINCT FROM NEW.blocked_at
     OR OLD.blocked_reason IS DISTINCT FROM NEW.blocked_reason
  THEN
    -- Permettre service_role (migrations, backend)
    IF current_setting('role', true) = 'service_role' THEN
      RETURN NEW;
    END IF;

    -- Permettre sans session auth (triggers système)
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    -- Seuls les admins peuvent modifier ces champs sensibles
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Permission refusée: seuls les administrateurs peuvent modifier les champs sensibles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_sensitive_fields_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_sensitive_fields_update();

-- 4. Supprimer la RLS policy obsolète liée à access_level
DROP POLICY IF EXISTS "Only admins can update access level and exchange tracking" ON public.profiles;

-- 5. Supprimer la colonne access_level
ALTER TABLE public.profiles DROP COLUMN IF EXISTS access_level;

-- 6. Mettre à jour les commentaires restants
COMMENT ON COLUMN public.profiles.daily_exchange_count
  IS 'Nombre d''échanges aujourd''hui (pour quota free_trial)';
COMMENT ON COLUMN public.profiles.last_exchange_reset
  IS 'Dernière remise à zéro du compteur d''échanges';
