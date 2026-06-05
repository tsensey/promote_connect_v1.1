-- ============================================================
-- Migration 079: Ensure correct quota values in platform_config
-- and profiles to prevent RLS blocks on posts/messages/vitrine.
--
-- Problems reported:
-- 1. Post creation fails with RLS violation despite having
--    only 1 post and max_posts_free_trial = 2.
-- 2. Daily message counter doesn't match admin config.
-- 3. quota_override_posts = 0 can lock user out (0 < N is false).
-- ============================================================

-- 1. Force toutes les valeurs numériques à être de vrais nombres JSON
--    (et non des chaînes comme "2" au lieu de 2)
UPDATE public.platform_config
SET value = to_jsonb(
    (value #>> '{}')::numeric
)
WHERE key IN (
    'daily_message_limit',
    'total_message_limit',
    'max_posts_free_trial',
    'max_vitrine_offers_free_trial',
    'trial_duration_days',
    'sponsored_weight_ratio',
    'sponsored_top_count',
    'discover_mode_refresh_interval_minutes',
    'auto_suspend_report_threshold',
    'subscription_price_xof'
);

-- 2. S'assurer que max_posts_free_trial est au moins 2
UPDATE public.platform_config
SET value = '2'::jsonb
WHERE key = 'max_posts_free_trial'
  AND (value #>> '{}')::int < 2;

-- 3. S'assurer que daily_message_limit est au moins 1
UPDATE public.platform_config
SET value = '10'::jsonb
WHERE key = 'daily_message_limit'
  AND (value #>> '{}')::int < 1;

-- 4. S'assurer que total_message_limit est au moins 10
UPDATE public.platform_config
SET value = '100'::jsonb
WHERE key = 'total_message_limit'
  AND (value #>> '{}')::int < 10;

-- 5. S'assurer que max_vitrine_offers_free_trial est au moins 1
UPDATE public.platform_config
SET value = '2'::jsonb
WHERE key = 'max_vitrine_offers_free_trial'
  AND (value #>> '{}')::int < 1;

-- 6. Reset quota_override_posts = 0 → NULL (0 rend tout insert RLS impossible)
--    car COUNT(*) < 0 n'est jamais vrai
UPDATE public.profiles
SET quota_override_posts = NULL
WHERE quota_override_posts IS NOT NULL
  AND quota_override_posts <= 0;

-- 7. Reset quota_override_vitrine = 0 → NULL (même problème)
UPDATE public.profiles
SET quota_override_vitrine = NULL
WHERE quota_override_vitrine IS NOT NULL
  AND quota_override_vitrine <= 0;

-- 8. Reset quota_override_messages = 0 → NULL
UPDATE public.profiles
SET quota_override_messages = NULL
WHERE quota_override_messages IS NOT NULL
  AND quota_override_messages <= 0;

-- 9. Fonction utilitaire pour diagnostiquer les quotas d'un utilisateur
--    Usage: SELECT * FROM public.diagnose_user_quota('user-uuid-here');
CREATE OR REPLACE FUNCTION public.diagnose_user_quota(p_user_id uuid)
RETURNS TABLE (
  check_name text,
  status text,
  detail text
) LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Post count vs limit
  RETURN QUERY
  SELECT
    'post_quota'::text,
    CASE WHEN cnt < lim THEN 'OK' ELSE 'BLOCKED' END,
    format('Posts: %s / %s (override: %s)', cnt, lim, COALESCE(override::text, 'aucun'))
  FROM (
    SELECT
      (SELECT COUNT(*) FROM public.posts WHERE author_id = p_user_id) AS cnt,
      COALESCE(
        (SELECT quota_override_posts FROM public.profiles WHERE id = p_user_id),
        (SELECT (value #>> '{}')::int FROM public.platform_config WHERE key = 'max_posts_free_trial'),
        2
      ) AS lim,
      (SELECT quota_override_posts FROM public.profiles WHERE id = p_user_id) AS override
  ) s;

  -- Daily message count
  RETURN QUERY
  SELECT
    'daily_message_quota'::text,
    CASE WHEN cnt < lim THEN 'OK' ELSE 'BLOCKED' END,
    format('Messages today: %s / %s (override: %s)', cnt, lim, COALESCE(override::text, 'aucun'))
  FROM (
    SELECT
      public.get_user_message_count(p_user_id, true) AS cnt,
      COALESCE(
        (SELECT quota_override_messages FROM public.profiles WHERE id = p_user_id),
        (SELECT (value #>> '{}')::int FROM public.platform_config WHERE key = 'daily_message_limit'),
        10
      ) AS lim,
      (SELECT quota_override_messages FROM public.profiles WHERE id = p_user_id) AS override
  ) s;

  -- Total message count
  RETURN QUERY
  SELECT
    'total_message_quota'::text,
    CASE WHEN cnt < lim THEN 'OK' ELSE 'BLOCKED' END,
    format('Messages total: %s / %s', cnt, lim)
  FROM (
    SELECT
      public.get_user_message_count(p_user_id, false) AS cnt,
      COALESCE(
        (SELECT (value #>> '{}')::int FROM public.platform_config WHERE key = 'total_message_limit'),
        100
      ) AS lim
  ) s;

  -- Vitrine count vs limit
  RETURN QUERY
  SELECT
    'vitrine_quota'::text,
    CASE WHEN cnt < lim THEN 'OK' ELSE 'BLOCKED' END,
    format('Produits: %s / %s (override: %s)', cnt, lim, COALESCE(override::text, 'aucun'))
  FROM (
    SELECT
      (SELECT COUNT(*) FROM public.produits WHERE exposant_id IN (SELECT id FROM public.exposants WHERE profile_id = p_user_id)) AS cnt,
      COALESCE(
        (SELECT quota_override_vitrine FROM public.profiles WHERE id = p_user_id),
        (SELECT (value #>> '{}')::int FROM public.platform_config WHERE key = 'max_vitrine_offers_free_trial'),
        2
      ) AS lim,
      (SELECT quota_override_vitrine FROM public.profiles WHERE id = p_user_id) AS override
  ) s;

  -- Account status
  RETURN QUERY
  SELECT
    'account_status'::text,
    CASE WHEN s = 'active' THEN 'OK' ELSE 'BLOCKED' END,
    format('Statut: %s', s)
  FROM (
    SELECT COALESCE((SELECT account_status FROM public.profiles WHERE id = p_user_id), 'inconnu') AS s
  ) s2;

  -- Subscription tier
  RETURN QUERY
  SELECT
    'subscription'::text,
    CASE WHEN t = 'paid' THEN 'OK' ELSE 'FREE_TRIAL' END,
    format('Tier: %s', COALESCE(t, 'inconnu'))
  FROM (
    SELECT subscription_tier AS t FROM public.profiles WHERE id = p_user_id
  ) s3;

  -- is_paid() check
  RETURN QUERY
  SELECT
    'is_paid_function'::text,
    CASE WHEN public.is_paid() THEN 'PAID' ELSE 'FREE_TRIAL' END,
    CASE WHEN public.is_paid() THEN 'is_paid() = true' ELSE 'is_paid() = false' END;

  -- Platform config values
  RETURN QUERY
  SELECT
    'config_' || key,
    'INFO'::text,
    format('key=%s value=%s type=%s', key, value, jsonb_typeof(value))
  FROM public.platform_config
  WHERE key IN ('max_posts_free_trial', 'daily_message_limit', 'total_message_limit', 'max_vitrine_offers_free_trial');
END;
$$;

COMMENT ON FUNCTION public.diagnose_user_quota IS 'Diagnostique les quotas et restrictions pour un utilisateur. Usage: SELECT * FROM diagnose_user_quota(''uuid'');';
