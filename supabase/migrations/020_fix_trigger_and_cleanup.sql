-- Migration 020 : Correction du trigger handle_new_user et nettoyage du schema
-- 1. Corriger le trigger handle_new_user avec ON CONFLICT DO UPDATE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    company,
    role,
    sector,
    country,
    pavillon
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company',
    COALESCE(new.raw_user_meta_data->>'role', 'visiteur'),
    new.raw_user_meta_data->>'sector',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'pavillon'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(excluded.full_name, public.profiles.full_name),
    company = COALESCE(excluded.company, public.profiles.company),
    role = COALESCE(excluded.role, public.profiles.role),
    sector = COALESCE(excluded.sector, public.profiles.sector),
    country = COALESCE(excluded.country, public.profiles.country),
    pavillon = COALESCE(excluded.pavillon, public.profiles.pavillon);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Nettoyage : supprimer la colonne stripe_customer_id de profiles (plus utilisee)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;

-- 3. Nettoyage : supprimer les colonnes abonnement de profiles (systeme desactive)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_ends_at;

-- 4. Nettoyage : supprimer la table subscriptions (systeme d'abonnement desactive)
DROP TABLE IF EXISTS public.subscriptions CASCADE;
