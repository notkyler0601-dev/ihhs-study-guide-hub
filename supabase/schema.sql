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
drop policy if exists "requests insert anyone"  on public.requests;
drop policy if exists "requests read own or admin" on public.requests;
drop policy if exists "requests update admin"   on public.requests;

-- Anyone (logged in or not) can submit a request.
create policy "requests insert anyone"
  on public.requests for insert
  with check (true);

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
-- 5. Bootstrap your first admin
-- ============================================================
-- After running this script AND signing up your own account via the site,
-- come back here and run this ONE line, replacing the username:
--
--   update public.profiles set is_admin = true where username = 'YOUR-USERNAME';
--
-- That's it. You'll now see /admin/requests.
