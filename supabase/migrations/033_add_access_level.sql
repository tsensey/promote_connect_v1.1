-- Add access_level to profiles for granular permission control
-- Values: 'classic' (default) | 'premium'
alter table profiles add column if not exists access_level text
  not null default 'classic'
  check (access_level in ('classic', 'premium'));

-- Add exchange tracking for classic exhibitors
alter table profiles add column if not exists daily_exchange_count integer
  not null default 0;
alter table profiles add column if not exists last_exchange_reset timestamptz;

-- Helper function to check if a user is premium
create or replace function public.is_premium()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and access_level = 'premium'
  );
end;
$$ language plpgsql stable security definer;

-- Update handle_new_user to set access_level from metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, company, role, sector, country, pavillon, access_level)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company',
    coalesce(new.raw_user_meta_data->>'role', 'visiteur'),
    new.raw_user_meta_data->>'sector',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'pavillon',
    coalesce(new.raw_user_meta_data->>'access_level', 'classic')
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company = coalesce(excluded.company, public.profiles.company),
    role = coalesce(excluded.role, public.profiles.role),
    sector = coalesce(excluded.sector, public.profiles.sector),
    country = coalesce(excluded.country, public.profiles.country),
    pavillon = coalesce(excluded.pavillon, public.profiles.pavillon),
    access_level = coalesce(excluded.access_level, public.profiles.access_level);
  return new;
end;
$$ language plpgsql security definer;

-- RLS: Only admin can update access_level and exchange tracking fields
create policy "Only admins can update access level and exchange tracking"
  on profiles for update
  using (true)
  with check (
    (current_setting('role') = 'service_role') or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') or
    auth.uid() = id
  );

-- Policy to restrict sensitive field updates to admins only
-- This fires BEFORE update to prevent non-admin users from changing access_level/daily_exchange_count
create or replace function public.check_access_level_update()
returns trigger as $$
begin
  if old.access_level is distinct from new.access_level
     or old.daily_exchange_count is distinct from new.daily_exchange_count
     or old.last_exchange_reset is distinct from new.last_exchange_reset
  then
    -- Allow when running via service_role, migrations, or as superuser
    if current_setting('role', true) = 'service_role' then
      return new;
    end if;
    -- Allow when no authenticated user (migration / backend context)
    if auth.uid() is null then
      return new;
    end if;
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) then
      raise exception 'Seuls les administrateurs peuvent modifier le niveau d''accès';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_check_access_level_update
  before update on public.profiles
  for each row
  execute function public.check_access_level_update();

-- Update existing profiles: set admin users to premium
update profiles set access_level = 'premium' where role = 'admin';

comment on column profiles.access_level is 'Niveau d''accès: classic (limitÃ©) ou premium (illimitÃ©)';
comment on column profiles.daily_exchange_count is 'Nombre d''échanges aujourd''hui (pour quota classic)';
comment on column profiles.last_exchange_reset is 'Dernière remise à zéro du compteur d''échanges';
