-- ============================================================
-- Migration 089: Fix column-level GRANT for quota overrides
--
-- Problem:
--   Migration 088 revoked SELECT ON profiles FROM authenticated
--   and granted only specific columns, but omitted the
--   quota_override_* columns. These columns are used in RLS
--   policies (migration 078) as subqueries:
--
--     (SELECT quota_override_posts FROM profiles WHERE id = auth.uid())
--
--   Without column-level SELECT, the RLS policy evaluation
--   fails with "permission denied for table profiles" on
--   INSERT into posts, produits, and messages.
--
--   The is_paid() function is SECURITY DEFINER so it
--   bypasses the restriction; the direct subqueries in
--   RLS policies are not.
--
-- Fix:
--   Grant SELECT on quota_override_posts, quota_override_vitrine,
--   and quota_override_messages to the authenticated role.
--   These are simple integers and do not expose PII.
-- ============================================================

GRANT SELECT (
  quota_override_posts,
  quota_override_vitrine,
  quota_override_messages
) ON public.profiles TO authenticated;

COMMENT ON COLUMN public.profiles.quota_override_posts IS
  'Surcharge individuelle du nombre max de publications (NULL = utiliser platform_config). Accessible via column-level GRANT pour les RLS policies.';

COMMENT ON COLUMN public.profiles.quota_override_vitrine IS
  'Surcharge individuelle du nombre max d''offres vitrine (NULL = utiliser platform_config). Accessible via column-level GRANT pour les RLS policies.';

COMMENT ON COLUMN public.profiles.quota_override_messages IS
  'Surcharge individuelle des limites de messages quotidiens/totaux (NULL = utiliser platform_config). Accessible via column-level GRANT pour les RLS policies.';
