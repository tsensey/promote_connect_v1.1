-- Migration 030: Audit logs table and admin password reset support

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) NOT NULL,
  actor_email text,
  actor_role text NOT NULL DEFAULT 'unknown',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_role ON audit_logs(actor_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING gin(metadata);

-- 2. Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS: admins can read all logs, others see only their own
CREATE POLICY "Admins can read all audit logs"
  ON audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  USING (actor_id = auth.uid());

-- 4. Function to log admin actions automatically
CREATE OR REPLACE FUNCTION public.log_admin_action()
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
  -- Get the current user
  v_actor_id := auth.uid();

  -- Get actor info from profiles
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

  -- Only log for admin actors
  IF v_actor_role = 'admin' THEN
    INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, v_actor_email, v_actor_role, v_action, v_entity_type, v_entity_id, v_metadata);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Function to log user actions (non-admin)
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
  v_actor_id := auth.uid();
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

-- 6. Admin triggers on key management tables
CREATE TRIGGER trg_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER trg_audit_exposants AFTER INSERT OR UPDATE OR DELETE ON exposants
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER trg_audit_espaces AFTER INSERT OR UPDATE OR DELETE ON espaces
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER trg_audit_evenements AFTER INSERT OR UPDATE OR DELETE ON evenements
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER trg_audit_support_tickets AFTER INSERT OR UPDATE OR DELETE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- 7. User action triggers (for non-admin actions like login, messaging)
CREATE TRIGGER trg_audit_user_messages AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION log_user_action();

CREATE TRIGGER trg_audit_user_rendez_vous AFTER INSERT OR UPDATE OR DELETE ON rendez_vous
  FOR EACH ROW EXECUTE FUNCTION log_user_action();

CREATE TRIGGER trg_audit_user_posts AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION log_user_action();
