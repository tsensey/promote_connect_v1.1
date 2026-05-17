-- Fix the trigger function: allow updates during migrations (no auth.uid())
-- The previous migration 033 ran ALTER TABLE + CREATE FUNCTION successfully,
-- but the UPDATE at the end failed because the trigger didn't handle null auth.uid().

drop trigger if exists trg_check_access_level_update on public.profiles;
drop function if exists public.check_access_level_update;

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

-- Now run the update that previously failed
update profiles set access_level = 'premium' where role = 'admin';
