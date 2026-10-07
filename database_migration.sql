-- ========================================================
-- SRINIVASAM PLATFORM — FULL SCHEMA MIGRATION
-- Migrates existing schema to target 11-table architecture
-- Run this in Supabase SQL Editor
-- ========================================================

-- --------------------------------------------------------
-- 0. HELPER: function to check if a user is an admin
-- --------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- --------------------------------------------------------
-- 1. PROFILES — alter existing table
-- --------------------------------------------------------
update public.profiles set role = 'orphanage' where role = 'orphanage_admin';
update public.profiles set role = 'admin' where role = 'platform_admin';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('donor', 'volunteer', 'orphanage', 'admin'));

alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('active', 'suspended', 'blocked'));

update public.profiles set full_name = coalesce(full_name, email, 'Unknown') where full_name is null;
alter table public.profiles alter column full_name set not null;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

drop policy if exists "Public profiles read" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

-- --------------------------------------------------------
-- 2. ORPHANAGES — alter existing table
-- --------------------------------------------------------
do $$
begin
  -- Case 1: admin_id exists but profile_id does NOT → simple rename
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orphanages' and column_name = 'admin_id'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'orphanages' and column_name = 'profile_id'
    ) then
      alter table public.orphanages rename column admin_id to profile_id;

    else
      -- Case 2: BOTH admin_id and profile_id exist.
      -- Drop all old RLS policies that reference admin_id before dropping the column.
      drop policy if exists "Orphanage admins manage own updates" on public.orphanage_updates;
      drop policy if exists "Orphanage admins create impact updates" on public.impact_updates;
      drop policy if exists "Orphanage admins update impact updates" on public.impact_updates;
      drop policy if exists "Members can view membership" on public.orphanage_members;
      drop policy if exists "Orphanage admins manage members" on public.orphanage_members;
      drop policy if exists "Orphanage admins update documents" on public.orphanage_documents;
      drop policy if exists "Orphanage admins upload documents" on public.orphanage_documents;
      drop policy if exists "Orphanage admins view own documents" on public.orphanage_documents;
      drop policy if exists "Orphanage admins manage fulfillments" on public.fulfillments;
      drop policy if exists "Users view related fulfillments" on public.fulfillments;
      drop policy if exists "Orphanage admins create opportunities" on public.volunteer_opportunities;
      drop policy if exists "Orphanage admins delete opportunities" on public.volunteer_opportunities;
      drop policy if exists "Orphanage admins update opportunities" on public.volunteer_opportunities;
      drop policy if exists "Orphanage admins update applications" on public.volunteer_applications;
      drop policy if exists "Users view relevant applications" on public.volunteer_applications;
      drop policy if exists "Orphanage admins manage activities" on public.volunteer_activities;
      drop policy if exists "Users view relevant activities" on public.volunteer_activities;
      drop policy if exists "Orphanage admins manage occasions" on public.special_occasions;
      -- Now safe to drop the stale admin_id column
      alter table public.orphanages drop column if exists admin_id;
    end if;
  end if;
end $$;

alter table public.orphanages add column if not exists email text;
alter table public.orphanages add column if not exists phone text;
alter table public.orphanages add column if not exists address text;
alter table public.orphanages add column if not exists reviewed_by uuid references public.profiles(id);
alter table public.orphanages add column if not exists reviewed_at timestamptz;
alter table public.orphanages add column if not exists rejection_reason text;
alter table public.orphanages add column if not exists updated_at timestamptz not null default now();
alter table public.orphanages add column if not exists logo_url text;
alter table public.orphanages add column if not exists website text;

update public.orphanages set verification_status = 'approved' where verification_status = 'verified';

alter table public.orphanages drop constraint if exists orphanages_verification_status_check;
alter table public.orphanages add constraint orphanages_verification_status_check
  check (verification_status in ('pending', 'approved', 'rejected', 'suspended'));

drop policy if exists "Verified orphanages public read" on public.orphanages;
drop policy if exists "Admins can update own orphanage" on public.orphanages;
drop policy if exists "Admins can insert own orphanage" on public.orphanages;
drop policy if exists "orphanages_select_public" on public.orphanages;
drop policy if exists "orphanages_insert_own" on public.orphanages;
drop policy if exists "orphanages_update" on public.orphanages;

create policy "orphanages_select_public"
  on public.orphanages for select to anon, authenticated
  using (
    verification_status = 'approved'
    or (select auth.uid()) = profile_id
    or public.is_admin()
  );

create policy "orphanages_insert_own"
  on public.orphanages for insert to authenticated
  with check ((select auth.uid()) = profile_id);

create policy "orphanages_update"
  on public.orphanages for update to authenticated
  using ((select auth.uid()) = profile_id or public.is_admin())
  with check ((select auth.uid()) = profile_id or public.is_admin());

-- --------------------------------------------------------
-- 3. CAMPAIGNS — alter existing table
-- --------------------------------------------------------
alter table public.campaigns add column if not exists reviewed_by uuid references public.profiles(id);
alter table public.campaigns add column if not exists reviewed_at timestamptz;
alter table public.campaigns add column if not exists rejection_reason text;
alter table public.campaigns add column if not exists updated_at timestamptz not null default now();
alter table public.campaigns alter column goal_amount type numeric(12,2);
alter table public.campaigns alter column raised_amount type numeric(12,2);
alter table public.campaigns alter column currency set default 'INR';

update public.campaigns set status = 'closed' where status = 'completed';
update public.campaigns set status = 'pending' where status = 'paused';

alter table public.campaigns drop constraint if exists campaigns_status_check;
alter table public.campaigns add constraint campaigns_status_check
  check (status in ('pending', 'approved', 'rejected', 'active', 'closed'));
alter table public.campaigns alter column status set default 'pending';

drop policy if exists "Campaigns public read" on public.campaigns;
drop policy if exists "campaigns_select_public" on public.campaigns;
drop policy if exists "campaigns_insert_orphanage" on public.campaigns;
drop policy if exists "campaigns_update" on public.campaigns;

create policy "campaigns_select_public"
  on public.campaigns for select to anon, authenticated
  using (
    status in ('approved', 'active')
    or exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  );

create policy "campaigns_insert_orphanage"
  on public.campaigns for insert to authenticated
  with check (
    exists (
      select 1 from public.orphanages o
      where o.id = orphanage_id
        and o.profile_id = (select auth.uid())
        and o.verification_status = 'approved'
    )
  );

create policy "campaigns_update"
  on public.campaigns for update to authenticated
  using (
    exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  );

-- --------------------------------------------------------
-- 4. NEEDS — alter existing table (PRIVATE by default)
-- --------------------------------------------------------
alter table public.needs add column if not exists description text;
alter table public.needs add column if not exists target_amount numeric(12,2);
alter table public.needs add column if not exists fulfilled_amount numeric(12,2) default 0;
alter table public.needs add column if not exists reviewed_by uuid references public.profiles(id);
alter table public.needs add column if not exists reviewed_at timestamptz;
alter table public.needs add column if not exists rejection_reason text;
alter table public.needs add column if not exists updated_at timestamptz not null default now();

update public.needs set status = 'pending' where status = 'active';

alter table public.needs drop constraint if exists needs_status_check;
alter table public.needs add constraint needs_status_check
  check (status in ('pending', 'approved', 'rejected', 'fulfilled', 'closed'));
alter table public.needs alter column status set default 'pending';

drop policy if exists "Needs public read" on public.needs;
drop policy if exists "needs_select_private" on public.needs;
drop policy if exists "needs_insert_orphanage" on public.needs;
drop policy if exists "needs_update" on public.needs;

create policy "needs_select_private"
  on public.needs for select to authenticated
  using (
    exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  );

create policy "needs_insert_orphanage"
  on public.needs for insert to authenticated
  with check (
    exists (
      select 1 from public.orphanages o
      where o.id = orphanage_id
        and o.profile_id = (select auth.uid())
        and o.verification_status = 'approved'
    )
  );

create policy "needs_update"
  on public.needs for update to authenticated
  using (
    exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  );

-- --------------------------------------------------------
-- 5. DONATIONS — alter existing table
-- --------------------------------------------------------
alter table public.donations add column if not exists donation_type text not null default 'one_time';
alter table public.donations drop constraint if exists donations_donation_type_check;
alter table public.donations add constraint donations_donation_type_check
  check (donation_type in ('one_time', 'recurring'));

alter table public.donations add column if not exists is_anonymous boolean not null default false;
alter table public.donations add column if not exists updated_at timestamptz not null default now();

update public.donations set donation_type = 'recurring' where is_recurring = true;

alter table public.donations alter column amount type numeric(12,2);
alter table public.donations alter column currency set default 'INR';
alter table public.donations alter column status set default 'pending';

alter table public.donations drop constraint if exists donations_status_check;
alter table public.donations add constraint donations_status_check
  check (status in ('pending', 'completed', 'failed', 'refunded'));

drop policy if exists "Donors read own donations" on public.donations;
drop policy if exists "Authenticated insert donations" on public.donations;
drop policy if exists "donations_select" on public.donations;
drop policy if exists "donations_insert" on public.donations;
drop policy if exists "donations_insert_anon" on public.donations;
drop policy if exists "donations_update_admin" on public.donations;

create policy "donations_select"
  on public.donations for select to authenticated
  using ((select auth.uid()) = donor_id or public.is_admin());

create policy "donations_insert"
  on public.donations for insert to authenticated
  with check (true);

create policy "donations_insert_anon"
  on public.donations for insert to anon
  with check (donation_type = 'one_time');

create policy "donations_update_admin"
  on public.donations for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- --------------------------------------------------------
-- 6. VOLUNTEERS — drop and recreate
-- --------------------------------------------------------
create table if not exists public._volunteers_backup as select * from public.volunteers;
drop policy if exists "volunteers_select" on public.volunteers;
drop table if exists public.volunteers cascade;

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  location text,
  skills text[],
  interests text[],
  availability text,
  status text not null default 'pending'
    check (status in ('pending', 'available', 'busy', 'unavailable', 'rejected', 'suspended')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.volunteers enable row level security;

create policy "volunteers_select" on public.volunteers for select to authenticated
  using ((select auth.uid()) = profile_id or public.is_admin());
create policy "volunteers_insert_own" on public.volunteers for insert to authenticated
  with check ((select auth.uid()) = profile_id);
create policy "volunteers_update" on public.volunteers for update to authenticated
  using ((select auth.uid()) = profile_id or public.is_admin())
  with check ((select auth.uid()) = profile_id or public.is_admin());

create index if not exists idx_volunteers_profile_id on public.volunteers(profile_id);
create index if not exists idx_volunteers_status on public.volunteers(status);
create index if not exists idx_volunteers_skills on public.volunteers using gin(skills);

-- --------------------------------------------------------
-- 7. VOLUNTEER REQUESTS — new table
-- --------------------------------------------------------
create table if not exists public.volunteer_requests (
  id uuid primary key default gen_random_uuid(),
  orphanage_id uuid not null references public.orphanages(id) on delete cascade,
  title text not null,
  description text,
  required_skills text[],
  required_interests text[],
  location text,
  required_date date,
  start_time time,
  end_time time,
  status text not null default 'pending'
    check (status in (
      'pending', 'approved', 'matching', 'matched',
      'assigned', 'scheduled', 'completed', 'cancelled', 'rejected'
    )),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.volunteer_requests enable row level security;

drop policy if exists "volunteer_requests_select" on public.volunteer_requests;
drop policy if exists "volunteer_requests_insert" on public.volunteer_requests;
drop policy if exists "volunteer_requests_update" on public.volunteer_requests;
create policy "volunteer_requests_select" on public.volunteer_requests for select to authenticated
  using (
    exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  );
create policy "volunteer_requests_insert" on public.volunteer_requests for insert to authenticated
  with check (
    exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()) and o.verification_status = 'approved')
  );
create policy "volunteer_requests_update" on public.volunteer_requests for update to authenticated
  using (
    exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.orphanages o where o.id = orphanage_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  );

create index if not exists idx_volunteer_requests_orphanage on public.volunteer_requests(orphanage_id);
create index if not exists idx_volunteer_requests_status on public.volunteer_requests(status);

-- --------------------------------------------------------
-- 8. VOLUNTEER ASSIGNMENTS — new table
-- --------------------------------------------------------
create table if not exists public.volunteer_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.volunteer_requests(id) on delete cascade,
  volunteer_id uuid not null references public.volunteers(id),
  match_score numeric(5,2),
  status text not null default 'assigned'
    check (status in (
      'assigned', 'accepted', 'declined', 'scheduled',
      'in_progress', 'completed', 'cancelled'
    )),
  scheduled_date date,
  start_time time,
  end_time time,
  volunteer_notes text,
  orphanage_notes text,
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.volunteer_assignments enable row level security;

drop policy if exists "volunteer_assignments_select" on public.volunteer_assignments;
drop policy if exists "volunteer_assignments_insert_admin" on public.volunteer_assignments;
drop policy if exists "volunteer_assignments_update" on public.volunteer_assignments;
create policy "volunteer_assignments_select" on public.volunteer_assignments for select to authenticated
  using (
    exists (select 1 from public.volunteers v where v.id = volunteer_id and v.profile_id = (select auth.uid()))
    or exists (select 1 from public.volunteer_requests vr join public.orphanages o on o.id = vr.orphanage_id where vr.id = request_id and o.profile_id = (select auth.uid()))
    or public.is_admin()
  );
create policy "volunteer_assignments_insert_admin" on public.volunteer_assignments for insert to authenticated
  with check (public.is_admin());
create policy "volunteer_assignments_update" on public.volunteer_assignments for update to authenticated
  using (
    exists (select 1 from public.volunteers v where v.id = volunteer_id and v.profile_id = (select auth.uid()))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.volunteers v where v.id = volunteer_id and v.profile_id = (select auth.uid()))
    or public.is_admin()
  );

create index if not exists idx_volunteer_assignments_request on public.volunteer_assignments(request_id);
create index if not exists idx_volunteer_assignments_volunteer on public.volunteer_assignments(volunteer_id);

-- --------------------------------------------------------
-- 9. PAYMENTS — new table
-- --------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  provider text,
  provider_payment_id text,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'failed', 'refunded')),
  payment_method text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "payments_select" on public.payments;
drop policy if exists "payments_update_admin" on public.payments;
create policy "payments_select" on public.payments for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.donations d where d.id = donation_id and d.donor_id = (select auth.uid()))
  );
create policy "payments_update_admin" on public.payments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create index if not exists idx_payments_donation on public.payments(donation_id);
create index if not exists idx_payments_status on public.payments(status);

-- --------------------------------------------------------
-- 10. RECEIPTS — new table
-- --------------------------------------------------------
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null unique references public.donations(id) on delete cascade,
  receipt_number text not null unique,
  donor_name text,
  donor_email text,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  receipt_url text,
  email_sent boolean not null default false,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.receipts enable row level security;

drop policy if exists "receipts_select" on public.receipts;
create policy "receipts_select" on public.receipts for select to authenticated
  using (
    exists (select 1 from public.donations d where d.id = donation_id and d.donor_id = (select auth.uid()))
    or public.is_admin()
  );

create index if not exists idx_receipts_donation on public.receipts(donation_id);

-- --------------------------------------------------------
-- 11. AUDITS — system audit log
-- --------------------------------------------------------
drop table if exists public.audits cascade;

create table public.audits (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.audits enable row level security;

create policy "audits_select_admin" on public.audits for select to authenticated
  using (public.is_admin());
create policy "audits_insert" on public.audits for insert to authenticated
  with check (public.is_admin());

create index if not exists idx_audits_entity on public.audits(entity_type, entity_id);
create index if not exists idx_audits_actor on public.audits(actor_id);
create index if not exists idx_audits_created on public.audits(created_at desc);

-- --------------------------------------------------------
-- 12. DROP DANGEROUS SECURITY DEFINER FUNCTIONS
-- --------------------------------------------------------
drop function if exists public.get_admin_pending_orphanages();
drop function if exists public.admin_verify_orphanage(uuid, text);
drop function if exists public.register_orphanage(text, text, text, text, text, text, text, int, text);

-- --------------------------------------------------------
-- 13. INDEXES on existing tables
-- --------------------------------------------------------
create index if not exists idx_orphanages_profile on public.orphanages(profile_id);
create index if not exists idx_orphanages_status on public.orphanages(verification_status);
create index if not exists idx_campaigns_orphanage on public.campaigns(orphanage_id);
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_needs_orphanage on public.needs(orphanage_id);
create index if not exists idx_needs_status on public.needs(status);
create index if not exists idx_donations_donor on public.donations(donor_id);
create index if not exists idx_donations_campaign on public.donations(campaign_id);
create index if not exists idx_donations_status on public.donations(status);

-- --------------------------------------------------------
-- 14. UPDATED_AT TRIGGER
-- --------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql security invoker as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles', 'orphanages', 'campaigns', 'needs',
    'donations', 'volunteers', 'volunteer_requests',
    'volunteer_assignments', 'payments'
  ])
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; '
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function public.handle_updated_at();',
      t, t
    );
  end loop;
end $$;

-- --------------------------------------------------------
-- 15. GRANT access
-- --------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant insert, update on public.profiles to authenticated;
grant select on public.orphanages to anon, authenticated;
grant insert, update on public.orphanages to authenticated;
grant select on public.campaigns to anon, authenticated;
grant insert, update on public.campaigns to authenticated;
grant select on public.needs to authenticated;
grant insert, update on public.needs to authenticated;
grant select on public.donations to anon, authenticated;
grant insert on public.donations to anon, authenticated;
grant update on public.donations to authenticated;
grant select on public.volunteers to authenticated;
grant insert, update on public.volunteers to authenticated;
grant select on public.volunteer_requests to authenticated;
grant insert, update on public.volunteer_requests to authenticated;
grant select on public.volunteer_assignments to authenticated;
grant insert, update on public.volunteer_assignments to authenticated;
grant select on public.payments to authenticated;
grant update on public.payments to authenticated;
grant select on public.receipts to authenticated;
grant select on public.audits to authenticated;
grant insert on public.audits to authenticated;
