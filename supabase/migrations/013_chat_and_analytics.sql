-- Table for analytics: Exposant Views
CREATE TABLE IF NOT EXISTS public.exposant_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exposant_id uuid REFERENCES public.exposants(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exposant_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exposants can view their own analytics" 
  ON public.exposant_views FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.exposants e 
      WHERE e.id = exposant_views.exposant_id AND e.profile_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert a view" 
  ON public.exposant_views FOR INSERT 
  WITH CHECK (true);

-- Chat attachments
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url text;

-- Chat Media Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'chat_media', 
  'chat_media', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for chat_media
CREATE POLICY "Public Access for chat_media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat_media' );

CREATE POLICY "Authenticated users can upload to chat_media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_media' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own chat_media uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chat_media' AND auth.uid() = owner
);

CREATE POLICY "Users can delete their own chat_media uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat_media' AND auth.uid() = owner
);
