-- Ajouter la colonne fcm_token à la table profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token text;
