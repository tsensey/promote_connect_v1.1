-- Disable subscription-gated access and align admin-provisioned accounts

update public.profiles
set
  subscription_status = 'active',
  subscription_ends_at = null;

update public.support_tickets
set
  subject = 'Confirmation de mon acces',
  description = 'Je souhaite verifier que mon acces a bien ete active et recevoir un rappel des modules disponibles.'
where subject = 'Activation de mon abonnement';

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
    subscription_status,
    subscription_ends_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'company',
    coalesce(new.raw_user_meta_data->>'role', 'visiteur'),
    new.raw_user_meta_data->>'sector',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'pavillon',
    'active',
    null
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    company = coalesce(excluded.company, public.profiles.company),
    role = coalesce(excluded.role, public.profiles.role),
    sector = coalesce(excluded.sector, public.profiles.sector),
    country = coalesce(excluded.country, public.profiles.country),
    pavillon = coalesce(excluded.pavillon, public.profiles.pavillon),
    subscription_status = 'active',
    subscription_ends_at = null;

  return new;
end;
$$ language plpgsql security definer;

delete from public.subscriptions;
