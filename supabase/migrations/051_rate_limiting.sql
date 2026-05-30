-- Migration 051: Scalable Rate Limiting via UNLOGGED table and RPC

CREATE UNLOGGED TABLE IF NOT EXISTS public.rate_limits (
  ip_key text PRIMARY KEY,
  request_count integer DEFAULT 1,
  reset_at timestamptz NOT NULL
);

REVOKE ALL ON public.rate_limits FROM PUBLIC, authenticated, anon;
GRANT ALL ON public.rate_limits TO service_role;

CREATE OR REPLACE FUNCTION check_rate_limit(p_ip_key text, p_max_requests integer, p_window_ms integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_reset_at timestamptz;
  v_now timestamptz := now();
  v_window interval := (p_window_ms || ' milliseconds')::interval;
BEGIN
  -- Nettoyage de l'entrée périmée au passage
  DELETE FROM public.rate_limits WHERE reset_at < v_now AND ip_key = p_ip_key;

  INSERT INTO public.rate_limits (ip_key, request_count, reset_at)
  VALUES (p_ip_key, 1, v_now + v_window)
  ON CONFLICT (ip_key) DO UPDATE
  SET request_count = rate_limits.request_count + 1
  RETURNING request_count, reset_at INTO v_count, v_reset_at;

  IF v_count > p_max_requests THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'resetAt', extract(epoch from v_reset_at) * 1000);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - v_count, 'resetAt', extract(epoch from v_reset_at) * 1000);
END;
$$;

-- Accorder l'exécution uniquement au rôle de service
REVOKE ALL ON FUNCTION check_rate_limit FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
