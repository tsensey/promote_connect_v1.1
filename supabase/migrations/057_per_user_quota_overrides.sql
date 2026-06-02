-- ============================================================
-- Migration 057: Per-user quota overrides
-- CdC §1.3 : L'admin peut surcharger individuellement les quotas
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quota_override_messages integer,
  ADD COLUMN IF NOT EXISTS quota_override_posts integer,
  ADD COLUMN IF NOT EXISTS quota_override_vitrine integer;

COMMENT ON COLUMN public.profiles.quota_override_messages IS 'Surcharge individuelle du nombre max de messages quotidiens (NULL = utiliser platform_config)';
COMMENT ON COLUMN public.profiles.quota_override_posts IS 'Surcharge individuelle du nombre max de publications (NULL = utiliser platform_config)';
COMMENT ON COLUMN public.profiles.quota_override_vitrine IS 'Surcharge individuelle du nombre max d''offres vitrine (NULL = utiliser platform_config)';
