-- ============================================================
-- T310: Challenges Migration
-- Creates challenges table with RLS, trigger, and realtime.
--
-- Depends on: 001_auth_profiles.sql (profiles table)
--             002_coyyns.sql (coyyns for stakes)
-- ============================================================


-- ── 1. CHALLENGES TABLE ─────────────────────────────────────

create table public.challenges (
  id                uuid        primary key default gen_random_uuid(),
  creator_id        uuid        not null references public.profiles (id) on delete restrict,
  title             text        not null,
  description       text,
  emoji             text,
  stakes            integer     not null default 0 check (stakes >= 0),
  deadline          timestamptz,
  status            text        not null default 'active'
    check (status in ('active', 'pending_resolution', 'completed', 'expired', 'cancelled')),
  claimed_by        uuid        references public.profiles (id),
  winner_id         uuid        references public.profiles (id),
  actual_transfer   integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index challenges_creator_id_idx on public.challenges (creator_id);
create index challenges_status_idx     on public.challenges (status)
  where status in ('active', 'pending_resolution');

comment on table public.challenges is
  'One row per CoYYns challenge between partners. Tracks lifecycle from active → pending_resolution → completed/expired/cancelled.';
comment on column public.challenges.stakes is
  'CoYYns amount wagered on this challenge. Must be >= 0.';
comment on column public.challenges.claimed_by is
  'The user who claims they won the challenge. Moves status to pending_resolution.';
comment on column public.challenges.winner_id is
  'The confirmed winner after resolution.';
comment on column public.challenges.actual_transfer is
  'CoYYns actually transferred on resolution (may differ from stakes if balance is insufficient).';


-- ── 2. UPDATED_AT TRIGGER ───────────────────────────────────
-- Reuses set_updated_at() created in 001_auth_profiles.sql

create trigger challenges_set_updated_at
  before update on public.challenges
  for each row
  execute function public.set_updated_at();


-- ── 3. ROW LEVEL SECURITY ───────────────────────────────────

alter table public.challenges enable row level security;

-- All authenticated users can read challenges
create policy "challenges: authenticated read"
  on public.challenges
  for select
  to authenticated
  using (true);

-- Only the creator can insert (must set themselves as creator)
create policy "challenges: creator insert"
  on public.challenges
  for insert
  to authenticated
  with check (creator_id = auth.uid());

-- Any authenticated user can update (for claiming, resolution, etc.)
create policy "challenges: authenticated update"
  on public.challenges
  for update
  to authenticated
  using (true);


-- ── 4. REALTIME ─────────────────────────────────────────────

alter publication supabase_realtime add table public.challenges;
