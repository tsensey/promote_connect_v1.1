-- ============================================================
-- Migration 086: Fix exposants update trigger
--
-- This migration ensures that no rogue triggers block exposants
-- from updating their profiles or vitrines. It drops any 
-- accidental triggers on the exposants table and secures the
-- check_sensitive_fields_update function.
-- ============================================================

-- 1. Drop accidental triggers on exposants if they exist
DROP TRIGGER IF EXISTS trg_check_sensitive_fields_update ON public.exposants;
DROP TRIGGER IF EXISTS trg_check_access_level_update ON public.exposants;

-- 2. Make the sensitive fields check function safer
CREATE OR REPLACE FUNCTION public.check_sensitive_fields_update()
RETURNS trigger AS $$
BEGIN
  -- Security check: only apply these checks to the profiles table
  IF TG_TABLE_NAME != 'profiles' THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_admin() THEN
    IF OLD.role IS DISTINCT FROM NEW.role
       OR OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier
       OR OLD.is_active IS DISTINCT FROM NEW.is_active
       OR OLD.account_status IS DISTINCT FROM NEW.account_status THEN
      RAISE EXCEPTION 'Permission refusée: seuls les administrateurs peuvent modifier les champs sensibles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
