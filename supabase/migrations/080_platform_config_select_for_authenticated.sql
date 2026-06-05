-- ============================================================
-- Migration 080: Allow all authenticated users to read platform_config
--
-- The previous RLS only allowed admins (public.is_admin())
-- to SELECT from platform_config. This blocked non-admin users
-- from reading config values like conversion_message, quota limits,
-- etc., returning empty arrays [] silently.
--
-- Now: admins can still manage (ALL), service_role can still do ALL,
--       and all authenticated users can SELECT (read-only).
-- ============================================================

-- 1. Allow all authenticated users to read platform config values
CREATE POLICY "Authenticated users can read platform config"
  ON public.platform_config FOR SELECT
  USING (auth.role() = 'authenticated');
