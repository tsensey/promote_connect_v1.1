-- ============================================================
-- Migration 081: Auto-set trial_ends_at from admin-configured
-- trial_duration_days on new user signup.
--
-- Avant : handle_new_user() ne définissait pas trial_ends_at.
--         Le champ restait NULL, aucun compte n'avait de fin
--         de période d'essai.
--
-- Après : trial_ends_at est calculé automatiquement à partir
--         de la valeur configurée dans platform_config
--         (clé 'trial_duration_days', défaut 30 jours).
--         L'admin peut modifier la durée dans le panneau
--         de configuration, et les nouveaux inscrits
--         bénéficieront de la durée à jour.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_trial_days int;
BEGIN
  -- Lire la durée configurée par l'admin (fallback 30 jours)
  BEGIN
    SELECT COALESCE((value #>> '{}')::int, 30) INTO v_trial_days
    FROM public.platform_config
    WHERE key = 'trial_duration_days';
  EXCEPTION WHEN OTHERS THEN
    v_trial_days := 30;
  END;

  INSERT INTO public.profiles (
    id,
    full_name,
    company,
    role,
    sector,
    country,
    pavillon,
    subscription_tier,
    account_status,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'company',
    COALESCE(NEW.raw_user_meta_data->>'role', 'visiteur'),
    NEW.raw_user_meta_data->>'sector',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'pavillon',
    COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'free_trial'),
    'active',
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'subscription_tier', 'free_trial') = 'paid' THEN NULL
      ELSE now() + (v_trial_days || ' days')::interval
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    company = EXCLUDED.company,
    role = EXCLUDED.role,
    sector = EXCLUDED.sector,
    country = EXCLUDED.country,
    pavillon = EXCLUDED.pavillon,
    subscription_tier = EXCLUDED.subscription_tier,
    trial_ends_at = CASE
      WHEN EXCLUDED.subscription_tier = 'paid' THEN EXCLUDED.trial_ends_at
      WHEN EXCLUDED.trial_ends_at IS NOT NULL THEN EXCLUDED.trial_ends_at
      ELSE profiles.trial_ends_at
    END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.profiles (id, role, subscription_tier, account_status)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'visiteur'), 'free_trial', 'active')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore to not block auth.users insert
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
