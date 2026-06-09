-- Migration pour gérer le statut de création de compte des exposants (batching)
ALTER TABLE exposants 
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'none';

-- On initialise le statut pour les exposants existants
UPDATE exposants 
SET account_status = 'created' 
WHERE profile_id IS NOT NULL;

UPDATE exposants 
SET account_status = 'none' 
WHERE profile_id IS NULL AND (email1 IS NULL AND email2 IS NULL);

UPDATE exposants 
SET account_status = 'pending' 
WHERE profile_id IS NULL AND (email1 IS NOT NULL OR email2 IS NOT NULL);
