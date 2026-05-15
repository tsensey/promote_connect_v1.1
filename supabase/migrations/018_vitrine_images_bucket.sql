-- Create a public bucket for vitrine/exposant images
insert into storage.buckets (id, name, public) 
values ('vitrine-images', 'vitrine-images', true)
on conflict (id) do nothing;

-- Create storage policy to allow public viewing
create policy "Vitrine images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'vitrine-images');

-- Create storage policy to allow authenticated users to upload
create policy "Authenticated users can upload vitrine images"
  on storage.objects for insert
  with check (bucket_id = 'vitrine-images' and auth.role() = 'authenticated');
  
-- Create storage policy to allow users to update their own uploads
create policy "Users can update their own vitrine images"
  on storage.objects for update
  using (bucket_id = 'vitrine-images' and auth.uid() = owner);

-- Create storage policy to allow users to delete their own uploads
create policy "Users can delete their own vitrine images"
  on storage.objects for delete
  using (bucket_id = 'vitrine-images' and auth.uid() = owner);

-- Add 'type' column to 'produits' to differentiate products and services
alter table produits add column if not exists type text default 'produit';
