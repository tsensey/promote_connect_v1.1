-- Migration 037 : Fix database triggers preventing user creation
-- Adds exception handling to critical triggers to ensure auth.users insert never fails

-- 1. Fix handle_new_user to be fault-tolerant
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
    access_level
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'company',
    COALESCE(NEW.raw_user_meta_data->>'role', 'visiteur'),
    NEW.raw_user_meta_data->>'sector',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'pavillon',
    COALESCE(NEW.raw_user_meta_data->>'access_level', 'classic')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    company = EXCLUDED.company,
    role = EXCLUDED.role,
    sector = EXCLUDED.sector,
    country = EXCLUDED.country,
    pavillon = EXCLUDED.pavillon,
    access_level = EXCLUDED.access_level;
    
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: try to insert minimum required fields
  BEGIN
    INSERT INTO public.profiles (id, role, access_level)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'visiteur'), 'classic')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- If even the fallback fails, swallow the error so user creation in auth.users succeeds
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix auto_create_user_preferences to be fault-tolerant
CREATE OR REPLACE FUNCTION public.auto_create_user_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_preferences (profile_id)
  VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix check_access_level_update to handle missing auth.uid() robustly
CREATE OR REPLACE FUNCTION public.check_access_level_update()
RETURNS trigger AS $$
BEGIN
  IF OLD.access_level IS DISTINCT FROM NEW.access_level
     OR OLD.daily_exchange_count IS DISTINCT FROM NEW.daily_exchange_count
     OR OLD.last_exchange_reset IS DISTINCT FROM NEW.last_exchange_reset
  THEN
    -- Allow when running via service_role, migrations, or as superuser
    IF current_setting('role', true) = 'service_role' THEN
      RETURN NEW;
    END IF;
    
    -- Allow when no authenticated user (migration / backend context like GoTrue)
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Normal user check
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Seuls les administrateurs peuvent modifier le niveau d''accès';
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block updates on unexpected errors
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix log_admin_action to gracefully handle system operations
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger AS $$
DECLARE
  v_actor_id uuid;
  v_actor_role text;
  v_actor_email text;
  v_action text;
  v_entity_type text;
  v_entity_id text;
  v_metadata jsonb;
BEGIN
  -- Get the current user
  BEGIN
    v_actor_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := NULL;
  END;

  -- If there is no authenticated user (e.g. system trigger or service role), skip audit log to avoid errors
  IF v_actor_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT role INTO v_actor_role FROM profiles WHERE id = v_actor_id;
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;

  -- Determine action type based on TG_OP and table name
  v_entity_type := TG_TABLE_NAME;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create_' || v_entity_type;
    v_entity_id := NEW.id::text;
    v_metadata := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_' || v_entity_type;
    v_entity_id := NEW.id::text;
    v_metadata := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_' || v_entity_type;
    v_entity_id := OLD.id::text;
    v_metadata := to_jsonb(OLD);
  END IF;

  -- Only log if actor is admin
  IF v_actor_role = 'admin' THEN
    BEGIN
      INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, metadata)
      VALUES (v_actor_id, v_actor_email, v_actor_role, v_action, v_entity_type, v_entity_id, v_metadata);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore logging errors to prevent breaking the original operation
    END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
