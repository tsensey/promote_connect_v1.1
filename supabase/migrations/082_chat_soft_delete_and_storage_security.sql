-- Migration 082: Chat Soft Delete and Storage Security

-- 1. Add is_deleted to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- 2. Allow users to update their own messages (only for soft delete realistically, but we can restrict fields if we want, or rely on application logic + general update policy)
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- 3. Storage Security for chat_media bucket
-- Update bucket to be private
UPDATE storage.buckets SET public = false WHERE id = 'chat_media';

-- 4. RLS for storage.objects on chat_media
-- RLS is already enabled by default on storage.objects in Supabase.

-- Allow authenticated users to upload files to chat_media
DROP POLICY IF EXISTS "chat_media_insert_policy" ON storage.objects;
CREATE POLICY "chat_media_insert_policy" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat_media');

-- Allow users to read files if they are participants in the conversation
-- Path format: conversation_id/...
DROP POLICY IF EXISTS "chat_media_select_policy" ON storage.objects;
CREATE POLICY "chat_media_select_policy" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat_media' AND
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id::text = split_part(name, '/', 1)
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
  )
);
