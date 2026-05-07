create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can update support tickets" on support_tickets;
drop policy if exists "Admins can send messages on any ticket" on support_messages;

create policy "Admins can view all support tickets"
  on support_tickets for select
  using (public.is_admin());

create policy "Admins can update all support tickets"
  on support_tickets for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view all support messages"
  on support_messages for select
  using (public.is_admin());

create policy "Admins can send messages on any ticket"
  on support_messages for insert
  with check (public.is_admin());

create policy "Admins can view all subscriptions"
  on subscriptions for select
  using (public.is_admin());

create policy "Admins can view all newsletter subscriptions"
  on newsletter_subscriptions for select
  using (public.is_admin());

create policy "Admins can view all rendez-vous"
  on rendez_vous for select
  using (public.is_admin());

create unique index if not exists idx_exposants_profile_unique
  on exposants(profile_id)
  where profile_id is not null;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    full_name,
    company,
    role,
    sector,
    country,
    pavillon,
    subscription_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'company',
    coalesce(new.raw_user_meta_data->>'role', 'visiteur'),
    new.raw_user_meta_data->>'sector',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'pavillon',
    'expired'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    company = coalesce(excluded.company, public.profiles.company),
    role = coalesce(excluded.role, public.profiles.role),
    sector = coalesce(excluded.sector, public.profiles.sector),
    country = coalesce(excluded.country, public.profiles.country),
    pavillon = coalesce(excluded.pavillon, public.profiles.pavillon);

  return new;
end;
$$ language plpgsql security definer;
