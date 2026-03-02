-- ============================================================
-- T201: Auth Profiles Migration
-- Creates the profiles table, RLS policies, trigger, and seed
-- Run once on a fresh Supabase project before anything else
-- ============================================================


-- ── 1. PROFILES TABLE ────────────────────────────────────────

create table public.profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  display_name  text        not null,
  email         text        not null,
  avatar_url    text,
  partner_id    uuid        references public.profiles (id) on delete set null,
  role          text        not null default 'user',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index on partner_id for fast partner lookups
create index profiles_partner_id_idx on public.profiles (partner_id);

comment on table public.profiles is
  'One row per auth user. Extends auth.users with display name, avatar, and partner link.';
comment on column public.profiles.partner_id is
  'UUID of the other user. Self-referential. Exactly one pair exists in this app.';


-- ── 2. UPDATED_AT TRIGGER ────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();


-- ── 3. AUTO-CREATE PROFILE ON AUTH SIGNUP ────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ── 4. ROW LEVEL SECURITY ────────────────────────────────────

alter table public.profiles enable row level security;

-- Policy: users can read their own profile
create policy "profiles: own read"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Policy: users can read their partner's profile
create policy "profiles: partner read"
  on public.profiles
  for select
  using (
    id = (
      select partner_id
      from public.profiles
      where id = auth.uid()
    )
  );

-- Policy: users can update only their own profile
create policy "profiles: own update"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No INSERT policy from client — inserts are handled by trigger only
-- No DELETE policy — profiles are permanent


-- ── 5. SEED DATA ─────────────────────────────────────────────
-- Replace the UUIDs below with the real UUIDs from your Supabase
-- Auth dashboard after creating the two users manually.
--
-- Steps:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. "Invite user" for yahya@example.com (set password after)
--   3. "Invite user" for yara@example.com  (set password after)
--   4. Copy each user's UUID into the variables below
--   5. Run this seed block

do $$
declare
  yahya_id uuid := '00000000-0000-0000-0000-000000000001'; -- REPLACE with real UUID
  yara_id  uuid := '00000000-0000-0000-0000-000000000002'; -- REPLACE with real UUID
begin
  -- Update display names (trigger already created the rows)
  update public.profiles
  set display_name = 'Yahya'
  where id = yahya_id;

  update public.profiles
  set display_name = 'Yara'
  where id = yara_id;

  -- Link partners (bidirectional)
  update public.profiles set partner_id = yara_id  where id = yahya_id;
  update public.profiles set partner_id = yahya_id where id = yara_id;
end;
$$;
