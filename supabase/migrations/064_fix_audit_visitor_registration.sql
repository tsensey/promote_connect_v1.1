-- ===============================================================
-- Migration 064: Fix audit logging for visitor self-registration
-- ===============================================================
--
-- Problème : Quand un visiteur s'inscrit via le formulaire /register,
-- le trigger trg_audit_profiles ne loggeait pas dans audit_logs car
-- log_admin_action() vérifiait uniquement le rôle 'admin'.
--
-- Fix : Quand auth.uid() est NULL (trigger système ou service_role),
-- logger tout INSERT sur profiles avec l'ID et le rôle du nouveau profil.
-- Cela couvre à la fois les auto-inscriptions visiteurs ET les créations
-- par l'admin via service_role (qui étaient aussi silencieusement ignorées).
-- ===============================================================

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
  BEGIN
    v_actor_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := NULL;
  END;

  IF v_actor_id IS NULL THEN
    -- auth.uid() est NULL dans 2 cas :
    -- 1. Trigger système (handle_new_user après signup) → on logue avec l'ID du profil
    -- 2. Service_role (admin API) → idem
    -- Dans les deux cas, si c'est un INSERT sur profiles, on logue
    IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
      v_actor_id := NEW.id;
      v_actor_role := NEW.role;
      v_action := 'create_' || TG_TABLE_NAME;
      v_entity_type := TG_TABLE_NAME;
      v_entity_id := NEW.id::text;
      v_metadata := public.sanitize_for_audit(to_jsonb(NEW));
      INSERT INTO public.audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, metadata)
      VALUES (v_actor_id, NULL, v_actor_role, v_action, v_entity_type, v_entity_id, v_metadata);
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  -- Cas normal : un admin connecté fait une action
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;

  v_entity_type := TG_TABLE_NAME;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create_' || v_entity_type;
    v_entity_id := NEW.id::text;
    v_metadata := public.sanitize_for_audit(to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update_' || v_entity_type;
    v_entity_id := NEW.id::text;
    v_metadata := jsonb_build_object(
      'old', public.sanitize_for_audit(to_jsonb(OLD)),
      'new', public.sanitize_for_audit(to_jsonb(NEW))
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete_' || v_entity_type;
    v_entity_id := OLD.id::text;
    v_metadata := public.sanitize_for_audit(to_jsonb(OLD));
  END IF;

  IF v_actor_role = 'admin' THEN
    BEGIN
      INSERT INTO public.audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, metadata)
      VALUES (v_actor_id, v_actor_email, v_actor_role, v_action, v_entity_type, v_entity_id, v_metadata);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
