-- ============================================================
-- Migration 058: is_featured réservé aux abonnés PAID
-- CdC §8.1 : "Les entreprises en free trial ne peuvent jamais
-- apparaître comme sponsorisées, même si l'admin active ce
-- champ par erreur."
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_is_featured_paid_only()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_featured = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = NEW.profile_id
      AND subscription_tier = 'paid'
      AND account_status = 'active'
    ) THEN
      NEW.is_featured = false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_exposants_enforce_is_featured
  BEFORE INSERT OR UPDATE OF is_featured
  ON public.exposants
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_is_featured_paid_only();

COMMENT ON FUNCTION public.enforce_is_featured_paid_only IS 'CdC §8.1 : is_featured ne peut être true que si le profil est PAID actif';
