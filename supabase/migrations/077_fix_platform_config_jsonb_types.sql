-- ============================================================
-- Migration 077: Fix platform_config values stored as JSON strings
--
-- The admin config page (handleSaveQuota in configuration/page.tsx)
-- was using value.toString() which stores numbers as JSON strings
-- (e.g. "2" instead of 2). This causes ::text::int to fail in RLS
-- policies for conversations, messages, posts, and produits INSERT.
--
-- Fix: convert all numeric JSON strings back to JSON numbers.
-- ============================================================

UPDATE public.platform_config
SET value = to_jsonb((value #>> '{}')::numeric)
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
  )
  AND jsonb_typeof(value) = 'string';
