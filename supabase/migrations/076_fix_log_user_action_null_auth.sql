-- Migration 076: Fix log_user_action() to gracefully handle NULL auth.uid()
-- This matches the existing fix in log_admin_action() from migration 037.
-- Without this fix, DELETE/INSERT on rendez_vous (and other user-action-triggered
-- tables) fails when the service_role key is used (e.g. during seed cleanup).

CREATE OR REPLACE FUNCTION public.log_user_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id uuid;
  v_actor_role text;
  v_actor_email text;
  v_action text;
  v_entity_type text;
  v_entity_id text;
  v_metadata jsonb;
BEGIN
  BEGIN
    v_actor_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := NULL;
  END;

  IF v_actor_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT role INTO v_actor_role FROM profiles WHERE id = v_actor_id;
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;

  v_entity_type := TG_TABLE_NAME;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create_' || v_entity_type;
    v_entity_id := NEW.id::text;
    v_metadata := jsonb_build_object('summary', substring(NEW::text, 1, 500));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_' || v_entity_type;
    v_entity_id := NEW.id::text;
    v_metadata := jsonb_build_object('summary', 'updated record');
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_' || v_entity_type;
    v_entity_id := OLD.id::text;
    v_metadata := jsonb_build_object('summary', 'deleted record');
  END IF;

  INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, metadata)
  VALUES (v_actor_id, v_actor_email, v_actor_role, v_action, v_entity_type, v_entity_id, v_metadata);

  RETURN COALESCE(NEW, OLD);
END;
$$;
