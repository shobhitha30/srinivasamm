-- ========================================================
-- SRINIVASAM — AUTH / ROLE PIPELINE MIGRATION
-- Run in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Problem: orphanage / volunteer signups were stored as role='donor'.
--   1. No server-side profile creation on auth.users insert.
--   2. Unknown BEFORE UPDATE trigger(s) on public.profiles swallowed role writes.
--   3. Existing rows were never repaired.
-- ========================================================

-- --------------------------------------------------------
-- 1. Role parser (single source of truth: auth metadata -> profiles.role)
-- --------------------------------------------------------
create or replace function public.role_from_metadata(meta jsonb)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when coalesce(meta ->> 'role', '') in ('orphanage', 'orphanage_admin') then 'orphanage'
    when coalesce(meta ->> 'role', '') = 'volunteer' then 'volunteer'
    when coalesce(meta ->> 'role', '') in ('admin', 'platform_admin') then 'admin'
    else 'donor'
  end;
$$;

-- --------------------------------------------------------
-- 2. Create the profile at sign-up time (authoritative)
--    'admin' is never assigned here: admins are provisioned
--    by admin scripts using the service role key.
-- --------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := public.role_from_metadata(new.raw_user_meta_data);
  if v_role = 'admin' then
    v_role := 'donor';
  end if;

  insert into public.profiles (id, email, full_name, role, updated_at)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'User'
    ),
    v_role,
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------
-- 3. Remove unknown triggers that silently block profile writes
-- --------------------------------------------------------
do $$
declare t record;
begin
  for t in
    select c.tgname
    from pg_trigger c
    join pg_class tbl on tbl.oid = c.tgrelid
    join pg_namespace n on n.oid = tbl.relnamespace
    where n.nspname = 'public'
      and tbl.relname = 'profiles'
      and not c.tgisinternal
      and (c.tgtype & 2) = 2
      and (((c.tgtype & 16) = 16) or ((c.tgtype & 4) = 4))
      and c.tgname not in ('set_updated_at', 'profiles_role_guard')
  loop
    raise notice 'Dropping blocking trigger on public.profiles: %', t.tgname;
    execute format('drop trigger %I on public.profiles', t.tgname);
  end loop;
end $$;

-- --------------------------------------------------------
-- 4. Guard: no self-promotion to admin from the browser
-- --------------------------------------------------------
create or replace function public.profiles_role_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jwt_role text;
begin
  begin
    v_jwt_role := coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
      ''
    );
  exception when others then
    v_jwt_role := '';
  end;

  if v_jwt_role = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' and new.role = 'admin' then
    raise exception 'Admin accounts are provisioned by platform administrators only';
  end if;

  if tg_op = 'UPDATE'
     and new.role is distinct from old.role
     and (new.role = 'admin' or old.role = 'admin') then
    raise exception 'Admin role changes must be made by a platform administrator';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before insert or update on public.profiles
  for each row execute function public.profiles_role_guard();

-- --------------------------------------------------------
-- 5. Backfill: repair existing wrong roles (donor -> real role only)
-- --------------------------------------------------------
update public.profiles p
set role = public.role_from_metadata(u.raw_user_meta_data),
    updated_at = now()
from auth.users u
where u.id = p.id
  and p.role = 'donor'
  and public.role_from_metadata(u.raw_user_meta_data) not in ('donor', 'admin');

update public.profiles p
set role = 'orphanage',
    updated_at = now()
from public.orphanages o
where o.profile_id = p.id
  and p.role = 'donor';

update public.profiles p
set role = 'volunteer',
    updated_at = now()
from public.volunteers v
where v.profile_id = p.id
  and p.role = 'donor';

insert into public.profiles (id, email, full_name, role, updated_at)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'User'
  ),
  case when public.role_from_metadata(u.raw_user_meta_data) = 'admin'
       then 'donor'
       else public.role_from_metadata(u.raw_user_meta_data) end,
  now()
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
