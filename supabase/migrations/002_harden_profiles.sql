-- Harden profiles privileges, UPDATE policy, and SECURITY DEFINER surface
-- Apply after 001_profiles.sql (SQL Editor or supabase db push)
--
-- Verify after apply (as authenticated user / via API with user JWT):
--   1. SELECT own profile row → succeeds
--   2. SELECT another user's id → empty / denied
--   3. UPDATE display_name on own row → succeeds; updated_at refreshes
--   4. UPDATE email or id on own row → privilege denied
--   5. INSERT / DELETE as authenticated → denied
--   6. Sign up a new user → profiles row still created by trigger

-- 1. Table privileges: default-deny for client roles, then grant minimally
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;

-- 2. Tighten UPDATE policy (column grants already block email/id; keep own-row check)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Lock down SECURITY DEFINER function (trigger still runs as owner)
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

-- 4. Keep updated_at honest on profile UPDATE
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- Caller must EXECUTE the BEFORE UPDATE trigger function
revoke all on function public.set_profiles_updated_at() from public;
grant execute on function public.set_profiles_updated_at() to authenticated;
