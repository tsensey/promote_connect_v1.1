-- Migration 014 : Automatisation Auth et Enrichissement de la table exposants

-- 1. Trigger pour la création automatique du profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company, role, subscription_status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company',
    COALESCE(new.raw_user_meta_data->>'role', 'visiteur'),
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà pour éviter les erreurs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Enrichissement de la table exposants
ALTER TABLE exposants
  ADD COLUMN IF NOT EXISTS email_contact text,
  ADD COLUMN IF NOT EXISTS phone_contact text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS brochure_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS chiffre_affaires text,
  ADD COLUMN IF NOT EXISTS annee_creation text,
  ADD COLUMN IF NOT EXISTS nombre_employes text,
  ADD COLUMN IF NOT EXISTS long_description text;
