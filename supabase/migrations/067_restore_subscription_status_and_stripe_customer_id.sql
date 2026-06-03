-- ============================================================
-- Migration 067: Restaurer subscription_status et stripe_customer_id
-- Ces colonnes ont été supprimées dans la migration 020 mais
-- sont toujours référencées par le webhook Stripe, le middleware,
-- les quotas, et la création de comptes exposant.
-- ============================================================

-- 1. Restaurer subscription_status sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active';

-- Les profils existants reçoivent la valeur par défaut 'active'
-- Le webhook Stripe mettra à jour ces valeurs lors des prochains événements

COMMENT ON COLUMN public.profiles.subscription_status
  IS 'Statut Stripe: active, past_due, canceled, incomplete_expired, unpaid';

-- 2. Restaurer stripe_customer_id sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

COMMENT ON COLUMN public.profiles.stripe_customer_id
  IS 'Identifiant Stripe Customer — utilisé pour retrouver le profil lors des webhooks Stripe';

-- 3. Restaurer l'index sur subscription_status (existait dans migration 005)
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
  ON public.profiles(subscription_status);

-- 4. Restaurer l'index sur stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id);

-- 5. Re-créer la fonction is_paid() qui manquait dans les migrations précédentes
-- (créée dans migration 039, vérifier qu'elle existe)
CREATE OR REPLACE FUNCTION public.is_paid()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND subscription_tier = 'paid'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
