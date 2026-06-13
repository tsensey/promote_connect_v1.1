-- ============================================================
-- Migration 087: Fix check_sensitive_fields_update for admins
--
-- This migration restores the service_role and auth.uid() checks
-- that were accidentally removed in migration 086, which broke
-- the ability to update user roles via the admin API.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_sensitive_fields_update()
RETURNS trigger AS $$
BEGIN
  -- Security check: only apply these checks to the profiles table
  IF TG_TABLE_NAME != 'profiles' THEN
    RETURN NEW;
  END IF;

  IF OLD.role IS DISTINCT FROM NEW.role
     OR OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier
     OR OLD.is_active IS DISTINCT FROM NEW.is_active
     OR OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    
    -- Permettre service_role (migrations, API backend utilisant admin_client)
    IF current_setting('role', true) = 'service_role' THEN
      RETURN NEW;
    END IF;

    -- Permettre sans session auth (triggers système ou backend bypassant auth)
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;

    -- Seuls les admins authentifiés peuvent modifier via UI/GraphQL
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Permission refusée: seuls les administrateurs peuvent modifier les champs sensibles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
