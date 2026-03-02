-- ============================================================
-- T501: Cycle Tracker Migration
-- Creates cycle_config and cycle_logs tables for hormonal
-- pill cycle tracking.
--
-- PRIVACY CRITICAL: These tables are OWNER-ONLY.
-- No partner access. No anon access. No exceptions.
-- Yara must never see this data under any circumstance.
--
-- This is migration 004. Requires 001 (profiles) to exist.
-- ============================================================


-- ── 1. CYCLE_CONFIG TABLE ─────────────────────────────────────
-- One row per owner. Stores the pill cycle configuration.
-- Yahya creates this once on first use and updates it when
-- a new pack starts (pill_start_date resets each cycle).

create table public.cycle_config (
  id                uuid        primary key default gen_random_uuid(),
  owner_id          uuid        not null unique references public.profiles (id) on delete cascade,
  pill_start_date   date        not null,
  active_days       integer     not null default 21,
  break_days        integer     not null default 7,
  pms_warning_days  integer     not null default 3,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Index: owner_id is UNIQUE so Postgres creates an index automatically.
-- No additional index needed — this table will always have at most one row.

comment on table public.cycle_config is
  'PRIVATE — Yahya only. Stores the hormonal pill cycle configuration for tracking purposes. '
  'Yara must never have access to this table. RLS enforces owner_id = auth.uid() with no exceptions.';
comment on column public.cycle_config.owner_id is
  'Always Yahya''s UUID. UNIQUE constraint guarantees one config per owner.';
comment on column public.cycle_config.pill_start_date is
  'The date the current pill pack was started. Reset each time a new pack begins.';
comment on column public.cycle_config.active_days is
  'Number of days Yara takes active pills. Default 21 for a standard combined pill pack.';
comment on column public.cycle_config.break_days is
  'Number of pill-free (break) days. Period typically begins during this window. Default 7.';
comment on column public.cycle_config.pms_warning_days is
  'Days before the break starts to surface a PMS awareness reminder. Default 3.';


-- ── 2. CYCLE_LOGS TABLE ───────────────────────────────────────
-- One row per (owner_id, date). Yahya logs mood observations
-- and notes. This is a private journal, not a medical record.
-- Entries are optional — most days will have no log entry.

create table public.cycle_logs (
  id          uuid        primary key default gen_random_uuid(),
  owner_id    uuid        not null references public.profiles (id) on delete cascade,
  date        date        not null,
  mood        text        check (mood in ('good', 'neutral', 'sensitive', 'difficult')),
  symptoms    text[],
  notes       text,
  created_at  timestamptz not null default now(),

  unique (owner_id, date)
);

-- Index for efficient range queries (e.g., last 30 days of logs)
create index cycle_logs_owner_date_idx on public.cycle_logs (owner_id, date desc);

comment on table public.cycle_logs is
  'PRIVATE — Yahya only. Daily observation log for cycle awareness. '
  'One row per (owner_id, date). Yara must never have access to this table.';
comment on column public.cycle_logs.mood is
  'Optional mood tag observed for the day. '
  'Allowed values: good, neutral, sensitive, difficult. NULL if not logged.';
comment on column public.cycle_logs.symptoms is
  'Optional array of symptom tags (e.g., {''cramps'', ''fatigue'', ''headache''}). '
  'Free-form text array — no enum constraint, as observations vary.';


-- ── 3. UPDATED_AT TRIGGER FOR CYCLE_CONFIG ───────────────────
-- Re-uses the set_updated_at() function created in T201.
-- cycle_logs does not have updated_at — entries are insert-only
-- or replaced via upsert on (owner_id, date).

create trigger cycle_config_set_updated_at
  before update on public.cycle_config
  for each row
  execute function public.set_updated_at();


-- ── 4. ROW LEVEL SECURITY — CYCLE_CONFIG ─────────────────────
-- STRICT OWNER-ONLY. No partner access. No anon access.
-- auth.uid() = owner_id is the ONLY condition that grants access.
-- Yara's auth.uid() will never equal owner_id (which is Yahya's UUID),
-- so she receives empty results from every query — silently.

alter table public.cycle_config enable row level security;

-- Policy: owner can read their own config
create policy "cycle_config: owner select"
  on public.cycle_config
  for select
  using (auth.uid() = owner_id);

-- Policy: owner can insert their own config (first-time setup)
create policy "cycle_config: owner insert"
  on public.cycle_config
  for insert
  with check (auth.uid() = owner_id);

-- Policy: owner can update their own config (e.g., new pack start date)
create policy "cycle_config: owner update"
  on public.cycle_config
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- No DELETE policy on cycle_config — config rows should persist.
-- No SELECT/INSERT/UPDATE policy for any other user — partner access
-- is explicitly and intentionally absent. This is the only table
-- in the entire app that blocks partner reads.


-- ── 5. ROW LEVEL SECURITY — CYCLE_LOGS ───────────────────────
-- Same strict owner-only enforcement. All four operations (SELECT,
-- INSERT, UPDATE, DELETE) are permitted for the owner.
-- DELETE is included so Yahya can remove an incorrect log entry.
-- No operation is permitted for any other user.

alter table public.cycle_logs enable row level security;

-- Policy: owner can read their own logs
create policy "cycle_logs: owner select"
  on public.cycle_logs
  for select
  using (auth.uid() = owner_id);

-- Policy: owner can insert new log entries
create policy "cycle_logs: owner insert"
  on public.cycle_logs
  for insert
  with check (auth.uid() = owner_id);

-- Policy: owner can update existing log entries
create policy "cycle_logs: owner update"
  on public.cycle_logs
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Policy: owner can delete a log entry (e.g., entered wrong date)
create policy "cycle_logs: owner delete"
  on public.cycle_logs
  for delete
  using (auth.uid() = owner_id);

-- No policies for any other user. Partner access does not exist.
-- Yara querying either table receives 0 rows and no error.


-- ── 6. NO SEED DATA ───────────────────────────────────────────
-- cycle_config is populated by Yahya on first use via the app UI.
-- No default rows are inserted here. The app must handle the
-- "not configured yet" state gracefully (empty state screen in T502).
