-- ============================================================
-- Migration 024: Consolidate handle_new_user() function
-- Visé à résoudre les conflits entre les migrations 006, 007 et 014
-- qui redéfinissaient toutes cette fonction avec des defaults différents.
--
-- Résultat : subscription_status = 'active', subscription_ends_at = null
-- ============================================================

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
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
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

-- S'assurer que le trigger est bien attaché
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
