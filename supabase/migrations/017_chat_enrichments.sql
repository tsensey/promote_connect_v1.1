-- ============================================================
-- 017_chat_enrichments.sql
-- Enrichissement du module chat :
--   - reply_to_id  : référence au message cité (réponse)
--   - product_attachment : JSONB aperçu produit/service
--   - attachment_type : catégorie de la pièce jointe
-- ============================================================

-- 1. Réponse à un message (self-referential FK)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- 2. Produit/service attaché (carte inline)
--    Structure JSON attendue : { id, nom, image_url, prix_indicatif, exposant_nom, exposant_id }
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS product_attachment jsonb;

-- 3. Type de pièce jointe
--    Valeurs : 'image' | 'document' | 'product' | NULL
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_type text;

-- 4. Index pour retrouver les réponses à un message
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id
  ON public.messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;

-- 5. Agrandir la limite du bucket chat_media à 10MB
UPDATE storage.buckets
  SET file_size_limit = 10485760,
      allowed_mime_types = ARRAY[
        'image/png', 'image/jpeg', 'image/jpg',
        'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
  WHERE id = 'chat_media';
