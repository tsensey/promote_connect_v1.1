-- ============================================================
-- Migration 040: Configuration centralisée de la plateforme
-- CdC PROMOTE-CONNECT v1.1 — Section 1.4 & 6.2
-- Permet de modifier quotas et messages sans redéploiement
-- ============================================================

-- 1. Table de configuration centralisée
CREATE TABLE IF NOT EXISTS public.platform_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_platform_config_updated_at ON public.platform_config(updated_at DESC);

-- 3. RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent lire/écrire la config
CREATE POLICY "Admins can manage platform config"
  ON public.platform_config FOR ALL
  USING (public.is_admin());

-- Service role peut tout faire
CREATE POLICY "Service role can manage platform config"
  ON public.platform_config FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- 4. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_platform_config_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_platform_config_updated_at
  BEFORE UPDATE ON public.platform_config
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_config_timestamp();

-- 5. Seed des valeurs par défaut
-- CdC §1.4 : quotas configurables sans redéploiement
INSERT INTO public.platform_config (key, value, description) VALUES

-- Quotas messagerie free trial (CdC §2)
('daily_message_limit', '10'::jsonb,
  'Nombre maximum de messages qu''une entreprise free_trial peut envoyer par jour'),

('total_message_limit', '100'::jsonb,
  'Quota total de messages pour une entreprise free_trial sur toute la durée de l''essai'),

-- Quotas publications (CdC §1.2)
('max_posts_free_trial', '2'::jsonb,
  'Nombre maximum de publications actives dans le fil d''actualité pour une entreprise free_trial'),

('max_vitrine_offers_free_trial', '2'::jsonb,
  'Nombre maximum d''offres publiées dans la vitrine pour une entreprise free_trial'),

-- Durée d''essai par défaut
('trial_duration_days', '30'::jsonb,
  'Durée par défaut de la période d''essai gratuit en jours'),

-- Fil d''actualité — pondération sponsorisés (CdC §8.2)
('sponsored_weight_ratio', '3'::jsonb,
  'Poids des publications sponsorisées par rapport aux autres dans le tri "Découvrir" (défaut: 3x)'),

('discover_mode_refresh_interval_minutes', '30'::jsonb,
  'Fréquence de régénération de l''ordre aléatoire en mode "Découvrir" (en minutes)'),

('sponsored_top_count', '3'::jsonb,
  'Nombre maximum de publications sponsorisées injectées en tête de chaque page en mode "Plus récents"'),

-- Signalements (CdC §3.3)
('auto_suspend_report_threshold', '3'::jsonb,
  'Nombre de signalements distincts sur un même compte déclenchant une alerte ou suspension préventive'),

-- Message de conversion (CdC §6.2) — entièrement configurable depuis l''admin
('conversion_message', jsonb_build_object(
  'title', 'Débloquez l''accès complet à PROMOTE-CONNECT',
  'body', 'Passez à l''abonnement PAID pour accéder à toutes les fonctionnalités : messagerie illimitée, annuaire complet, rendez-vous d''affaires, vitrine prioritaire et bien plus encore.',
  'price_display', '100 000 F CFA / an',
  'phone', '+229 XX XX XX XX',
  'email', 'contact@promote-benin.com',
  'cta_url', null,
  'cta_label', 'Contacter l''équipe PROMOTE'
), 'Message et coordonnées affichés lors du parcours de conversion free trial → PAID'),

-- Prix d''abonnement
('subscription_price_xof', '100000'::jsonb,
  'Prix de l''abonnement annuel en Francs CFA (XOF)')

ON CONFLICT (key) DO NOTHING;

-- 6. Fonction utilitaire pour récupérer une valeur de config
CREATE OR REPLACE FUNCTION public.get_platform_config(config_key text)
RETURNS jsonb AS $$
DECLARE
  config_value jsonb;
BEGIN
  SELECT value INTO config_value
  FROM public.platform_config
  WHERE key = config_key;
  RETURN config_value;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. Commentaires
COMMENT ON TABLE public.platform_config IS 'Configuration centralisée de la plateforme — modifiable sans redéploiement (CdC §1.4)';
COMMENT ON COLUMN public.platform_config.key IS 'Clé unique de la configuration';
COMMENT ON COLUMN public.platform_config.value IS 'Valeur JSON de la configuration';
COMMENT ON COLUMN public.platform_config.updated_by IS 'Admin qui a effectué la dernière modification';
