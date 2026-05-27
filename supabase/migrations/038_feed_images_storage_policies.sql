-- Add missing storage RLS policies for feed-images bucket
-- The bucket was created in 009_feed_shares.sql but without policies

create policy "Feed images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'feed-images');

create policy "Authenticated users can upload feed images"
  on storage.objects for insert
  with check (bucket_id = 'feed-images' and auth.role() = 'authenticated');

create policy "Users can update their own feed images"
  on storage.objects for update
  using (bucket_id = 'feed-images' and auth.uid() = owner);

create policy "Users can delete their own feed images"
  on storage.objects for delete
  using (bucket_id = 'feed-images' and auth.uid() = owner);

-- Set file size limit and allowed MIME types
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'feed-images';
