-- Add missing RLS policies for exposants table (INSERT, UPDATE, DELETE)
-- Exposants can manage their own profile record

create policy "Exposants can create their own exposant record"
  on exposants for insert
  with check (auth.uid() = profile_id);

create policy "Exposants can update their own exposant record"
  on exposants for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "Exposants can delete their own exposant record"
  on exposants for delete
  using (auth.uid() = profile_id);
