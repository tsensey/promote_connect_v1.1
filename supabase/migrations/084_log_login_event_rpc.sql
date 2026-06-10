-- Migration 084: Function to log user logins into audit_logs

CREATE OR REPLACE FUNCTION public.log_login_event(p_ip_address text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id uuid;
  v_actor_role text;
  v_actor_email text;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RETURN;
  END IF;

  SELECT role INTO v_actor_role FROM profiles WHERE id = v_actor_id;
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_actor_id;

  INSERT INTO audit_logs (
    actor_id, 
    actor_email, 
    actor_role, 
    action, 
    entity_type, 
    ip_address, 
    metadata
  )
  VALUES (
    v_actor_id, 
    v_actor_email, 
    COALESCE(v_actor_role, 'unknown'), 
    'user_login', 
    'auth', 
    p_ip_address, 
    '{"event": "login_success"}'::jsonb
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_login_event TO authenticated;
