-- ============================================================
-- Migration 060: Ajout email1/email2 sur exposants pour
-- création automatique de comptes auth
-- CdC §Admin — Stockage séparé pour identifier auth + envoi
-- des credentials aux deux adresses
-- ============================================================

ALTER TABLE public.exposants
  ADD COLUMN IF NOT EXISTS email1 text,
  ADD COLUMN IF NOT EXISTS email2 text;

CREATE INDEX IF NOT EXISTS idx_exposants_email1 ON public.exposants(email1);
CREATE INDEX IF NOT EXISTS idx_exposants_email2 ON public.exposants(email2);

COMMENT ON COLUMN public.exposants.email1 IS 'Email principal — utilisé comme identifiant de connexion auth';
COMMENT ON COLUMN public.exposants.email2 IS 'Email secondaire — reçoit une copie des credentials';
