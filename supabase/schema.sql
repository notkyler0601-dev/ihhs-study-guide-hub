-- IHHS Study Guide Hub: Supabase schema
-- Paste this entire file into your Supabase SQL Editor and click "Run".
-- It's idempotent: safe to run multiple times.

-- ============================================================
-- 1. Profiles (username + display name per user)
-- ============================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  username     text unique not null,
  display_name text not null,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Username constraint: 3-20 chars, lowercase letters, digits, _ . -
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username ~ '^[a-z0-9_.-]{3,20}$');

-- ============================================================
-- 2. User data (key-value store for progress, SRS, quiz history)
-- ============================================================

create table if not exists public.user_data (
  user_id    uuid references auth.users on delete cascade,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists user_data_updated_at_idx
  on public.user_data (user_id, updated_at desc);

-- ============================================================
-- 3. Guide requests
-- ============================================================

create table if not exists public.requests (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  subject    text not null,
  topic      text not null,
  urgency    text,
  goal       text not null,
  sources    text,
  name       text,
  email      text,
  user_id    uuid references auth.users on delete set null,
  status     text not null default 'open',
  -- status: 'open' | 'claimed' | 'done' | 'wontdo'
  notes      text
);

create index if not exists requests_status_idx on public.requests (status, created_at desc);

-- ============================================================
-- 4. Row-Level Security
-- ============================================================

alter table public.profiles  enable row level security;
alter table public.user_data enable row level security;
alter table public.requests  enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Profiles
drop policy if exists "profiles select own or admin"      on public.profiles;
drop policy if exists "profiles insert own"               on public.profiles;
drop policy if exists "profiles update own or admin"      on public.profiles;
drop policy if exists "profiles username readable by all" on public.profiles;

-- Usernames are public (needed for login lookup).
create policy "profiles username readable by all"
  on public.profiles for select
  using (true);

create policy "profiles insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles update own or admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- User data
drop policy if exists "user_data read own"  on public.user_data;
drop policy if exists "user_data write own" on public.user_data;

create policy "user_data read own"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "user_data write own"
  on public.user_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Requests
drop policy if exists "requests insert anyone"   on public.requests;
drop policy if exists "requests insert authed"   on public.requests;
drop policy if exists "requests read own or admin" on public.requests;
drop policy if exists "requests update admin"    on public.requests;

-- Only signed-in users can submit a request, and only with their own user_id.
-- This prevents anonymous spam and lets us follow up with the requester.
create policy "requests insert authed"
  on public.requests for insert
  with check (auth.uid() is not null and auth.uid() = user_id);

-- You can only read your own submissions. Admins can read all.
create policy "requests read own or admin"
  on public.requests for select
  using (
    (user_id is not null and auth.uid() = user_id)
    or public.is_admin()
  );

-- Only admins can update request status/notes.
create policy "requests update admin"
  on public.requests for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 5. Auto-create a profile when an auth user signs up
-- ============================================================
-- This runs with SECURITY DEFINER so it bypasses RLS.
-- Username and display name come from user metadata set at signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 6. Bootstrap your first admin
-- ============================================================
-- After running this script AND signing up your own account via the site,
-- come back here and run this ONE line, replacing the username:
--
--   update public.profiles set is_admin = true where username = 'YOUR-USERNAME';
--
-- That's it. You'll now see /admin/requests.

-- ============================================================
-- 7. Volunteer signups (read-a-guide-for-service-hours)
-- ============================================================
-- Students submit hours read against a specific guide. The guide team
-- reviews the notes and credits the hours. Schema mirrors `requests`.

create table if not exists public.volunteer_signups (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  guide_slug    text not null,
  grade         text,
  hours         numeric(4,1) not null check (hours > 0 and hours <= 40),
  notes         text not null,
  contact_email text,
  name          text,
  email         text,
  user_id       uuid references auth.users on delete set null,
  status        text not null default 'pending',
  -- status: 'pending' | 'approved' | 'rejected'
  reviewer_notes text
);

create index if not exists volunteer_signups_user_idx
  on public.volunteer_signups (user_id, created_at desc);
create index if not exists volunteer_signups_status_idx
  on public.volunteer_signups (status, created_at desc);

alter table public.volunteer_signups enable row level security;

drop policy if exists "volunteer_signups insert authed"   on public.volunteer_signups;
drop policy if exists "volunteer_signups read own or admin" on public.volunteer_signups;
drop policy if exists "volunteer_signups update admin"    on public.volunteer_signups;

create policy "volunteer_signups insert authed"
  on public.volunteer_signups for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "volunteer_signups read own or admin"
  on public.volunteer_signups for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "volunteer_signups update admin"
  on public.volunteer_signups for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ============================================================
-- 8. Guide reading time (active time per signed-in reader per visit)
-- ============================================================
-- The client (src/lib/guideTime.ts) opens one row per guide page visit for a
-- signed-in reader and keeps raising active_seconds while the tab is visible
-- and the reader is scrolling, clicking or typing. Readers can only touch
-- their own rows. Admins read everyone's on /admin/reading-time and next to
-- claimed volunteer hours in the volunteer inbox.

create table if not exists public.guide_sessions (
  id             uuid primary key,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  guide_slug     text not null,
  started_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  active_seconds integer not null default 0 check (active_seconds >= 0)
);

create index if not exists guide_sessions_user_idx
  on public.guide_sessions (user_id, last_seen_at desc);
create index if not exists guide_sessions_guide_idx
  on public.guide_sessions (guide_slug, last_seen_at desc);

-- Keep rows honest: identity columns freeze after insert, timestamps cannot
-- sit in the future, a visit cannot hold more active time than the wall clock
-- allowed (plus two minutes of slack for clock skew), and active time never
-- goes down.
create or replace function public.guide_sessions_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.user_id    := old.user_id;
    new.guide_slug := old.guide_slug;
    new.started_at := old.started_at;
  end if;
  if new.started_at > now() then new.started_at := now(); end if;
  if new.last_seen_at > now() then new.last_seen_at := now(); end if;
  if new.last_seen_at < new.started_at then new.last_seen_at := new.started_at; end if;
  new.active_seconds := least(
    new.active_seconds,
    floor(extract(epoch from (new.last_seen_at - new.started_at)))::int + 120
  );
  if tg_op = 'UPDATE' then
    new.active_seconds := greatest(new.active_seconds, old.active_seconds);
  end if;
  return new;
end;
$$;

drop trigger if exists guide_sessions_guard on public.guide_sessions;
create trigger guide_sessions_guard
  before insert or update on public.guide_sessions
  for each row execute function public.guide_sessions_guard();

alter table public.guide_sessions enable row level security;

drop policy if exists "guide_sessions write own"         on public.guide_sessions;
drop policy if exists "guide_sessions read own or admin" on public.guide_sessions;

create policy "guide_sessions write own"
  on public.guide_sessions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "guide_sessions read own or admin"
  on public.guide_sessions for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- 9. Admin adjustments to tracked reading time
-- ============================================================
-- One row per (reader, guide). delta_seconds is added to the measured total
-- (negative takes time away) and is written from the hours ledger
-- (/admin/hours) when an admin types a new tracked value. Only admins write;
-- the affected reader can read their own row.

create table if not exists public.guide_time_adjustments (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  guide_slug    text not null,
  delta_seconds integer not null default 0 check (abs(delta_seconds) <= 3600 * 1000),
  note          text,
  updated_by    uuid references public.profiles(id) on delete set null,
  updated_at    timestamptz not null default now(),
  primary key (user_id, guide_slug)
);

-- Stamp who made the change and when, whatever the client sent. Shared by
-- every admin-edited table with updated_by / updated_at columns. Runs as the
-- definer (like is_admin) so the auth schema lookup never depends on the
-- caller's grants.
create or replace function public.stamp_updated_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guide_time_adjustments_stamp on public.guide_time_adjustments;
create trigger guide_time_adjustments_stamp
  before insert or update on public.guide_time_adjustments
  for each row execute function public.stamp_updated_by();
-- An earlier revision used a table-specific copy of the stamp function.
drop function if exists public.guide_time_adjustments_stamp();

alter table public.guide_time_adjustments enable row level security;

drop policy if exists "guide_time_adjustments admin write"       on public.guide_time_adjustments;
drop policy if exists "guide_time_adjustments read own or admin" on public.guide_time_adjustments;

create policy "guide_time_adjustments admin write"
  on public.guide_time_adjustments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "guide_time_adjustments read own or admin"
  on public.guide_time_adjustments for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- 10. Reading-time aggregates
-- ============================================================
-- Plain (security invoker) functions, so row-level security still applies:
-- a student calling these sees only their own time, an admin sees everyone.
-- Pass `since` to limit to visits seen after that moment. Time ranges show
-- measured time only; admin adjustments apply to the all-time view (`since`
-- null), which is what the volunteer inbox, the hours ledger and each
-- reader's own dashboard use.
--
-- Dropped before re-creation: the return columns changed after the first
-- version shipped and Postgres refuses to alter a function's return type.

drop function if exists public.guide_time_by_reader(timestamptz);
drop function if exists public.guide_time_by_guide(timestamptz);
drop function if exists public.guide_time_pairs(timestamptz);

create function public.guide_time_pairs(since timestamptz default null)
returns table (
  user_id            uuid,
  guide_slug         text,
  sessions           bigint,
  session_seconds    bigint,
  adjustment_seconds bigint,
  active_seconds     bigint,
  first_seen_at      timestamptz,
  last_seen_at       timestamptz,
  adjusted_by        uuid,
  adjusted_at        timestamptz,
  adjustment_note    text
)
language sql
stable
set search_path = public
as $$
  with s as (
    select
      g.user_id,
      g.guide_slug,
      count(*)                           as sessions,
      coalesce(sum(g.active_seconds), 0) as secs,
      min(g.started_at)                  as first_seen,
      max(g.last_seen_at)                as last_seen
    from public.guide_sessions g
    where since is null or g.last_seen_at >= since
    group by g.user_id, g.guide_slug
  ),
  a as (
    select x.user_id, x.guide_slug, x.delta_seconds, x.note, x.updated_by, x.updated_at
    from public.guide_time_adjustments x
    where since is null
  )
  select
    coalesce(s.user_id, a.user_id),
    coalesce(s.guide_slug, a.guide_slug),
    coalesce(s.sessions, 0)::bigint,
    coalesce(s.secs, 0)::bigint,
    coalesce(a.delta_seconds, 0)::bigint,
    greatest(0, coalesce(s.secs, 0) + coalesce(a.delta_seconds, 0))::bigint,
    s.first_seen,
    s.last_seen,
    a.updated_by,
    a.updated_at,
    a.note
  from s
  full outer join a on a.user_id = s.user_id and a.guide_slug = s.guide_slug;
$$;

create function public.guide_time_by_reader(since timestamptz default null)
returns table (
  user_id            uuid,
  username           text,
  display_name       text,
  guide_slug         text,
  sessions           bigint,
  session_seconds    bigint,
  adjustment_seconds bigint,
  active_seconds     bigint,
  first_seen_at      timestamptz,
  last_seen_at       timestamptz,
  adjusted_by        text,
  adjusted_at        timestamptz,
  adjustment_note    text
)
language sql
stable
set search_path = public
as $$
  select
    t.user_id,
    p.username,
    p.display_name,
    t.guide_slug,
    t.sessions,
    t.session_seconds,
    t.adjustment_seconds,
    t.active_seconds,
    t.first_seen_at,
    t.last_seen_at,
    b.username,
    t.adjusted_at,
    t.adjustment_note
  from public.guide_time_pairs(since) t
  join public.profiles p on p.id = t.user_id
  left join public.profiles b on b.id = t.adjusted_by
  order by t.active_seconds desc;
$$;

create function public.guide_time_by_guide(since timestamptz default null)
returns table (
  guide_slug     text,
  readers        bigint,
  sessions       bigint,
  active_seconds bigint,
  last_seen_at   timestamptz
)
language sql
stable
set search_path = public
as $$
  select
    t.guide_slug,
    count(distinct t.user_id),
    coalesce(sum(t.sessions), 0)::bigint,
    coalesce(sum(t.active_seconds), 0)::bigint,
    max(t.last_seen_at)
  from public.guide_time_pairs(since) t
  group by t.guide_slug
  order by 4 desc;
$$;

-- ============================================================
-- 11. Service hours per guide (what reading a guide is worth)
-- ============================================================
-- Set on the Guides tab of /admin/hours and applied to submissions from
-- there. Readable by everyone (so the volunteer form can show it one day);
-- only admins write.

create table if not exists public.guide_hours (
  guide_slug text primary key,
  hours      numeric(4,1) not null check (hours > 0 and hours <= 40),
  note       text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

drop trigger if exists guide_hours_stamp on public.guide_hours;
create trigger guide_hours_stamp
  before insert or update on public.guide_hours
  for each row execute function public.stamp_updated_by();

alter table public.guide_hours enable row level security;

drop policy if exists "guide_hours read all"    on public.guide_hours;
drop policy if exists "guide_hours admin write" on public.guide_hours;

create policy "guide_hours read all"
  on public.guide_hours for select
  using (true);

create policy "guide_hours admin write"
  on public.guide_hours for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
