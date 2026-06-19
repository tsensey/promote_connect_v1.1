-- Create a public bucket for event PDF documents
insert into storage.buckets (id, name, public) 
values ('event-documents', 'event-documents', true)
on conflict (id) do nothing;

-- Allow public read access
create policy "Event documents are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'event-documents');

-- Allow admins to upload (service_role bypasses this, but keep for direct use)
create policy "Authenticated users can upload event documents"
  on storage.objects for insert
  with check (bucket_id = 'event-documents' and auth.role() = 'authenticated');

-- Allow admins to delete (service_role bypasses this)
create policy "Users can delete their own event documents"
  on storage.objects for delete
  using (bucket_id = 'event-documents' and auth.uid() = owner);

-- Allow update by owner
create policy "Users can update their own event documents"
  on storage.objects for update
  using (bucket_id = 'event-documents' and auth.uid() = owner);
