-- ============================================================
-- T-Fitness: Weight Logs Table
-- Real fitness / weight tracking for the Me·Body screen.
-- Each user logs their weight; history powers a trend sparkline.
--
-- PRIVACY: OWNER-ONLY. No partner access. No anon access.
-- auth.uid() = user_id is the ONLY condition that grants access —
-- matching the strict-owner pattern used by the cycle tracker (004).
-- A user's own body-weight history is private to them.
--
-- This is migration 042. Requires 001 (auth.users / profiles) to exist.
-- ============================================================


-- ── 1. WEIGHT_LOGS TABLE ─────────────────────────────────────
-- One row per (user_id, logged_at) date. The UNIQUE constraint
-- enforces one entry per day so the trend line is unambiguous;
-- logging again for the same day upserts (replaces) the value.

create table public.weight_logs (
  id          uuid          primary key default gen_random_uuid(),
  user_id     uuid          not null references auth.users (id) on delete cascade,
  weight_kg   numeric(5, 2) not null,
  logged_at   date          not null default current_date,
  note        text,
  created_at  timestamptz   not null default now(),

  unique (user_id, logged_at)
);

-- Index for efficient history range queries (e.g. last 30/90 days, newest first).
create index weight_logs_user_date_idx on public.weight_logs (user_id, logged_at desc);

comment on table public.weight_logs is
  'PRIVATE — owner only. Daily body-weight log powering the Me·Body fitness trend. '
  'UNIQUE(user_id, logged_at) enforces one entry per day (upsert to change). '
  'RLS restricts every operation to auth.uid() = user_id with no partner access.';
comment on column public.weight_logs.weight_kg is
  'Body weight in kilograms. numeric(5,2) → up to 999.99 kg, 2 decimal places.';
comment on column public.weight_logs.logged_at is
  'The calendar date this weight is recorded for. Defaults to today. '
  'UNIQUE with user_id → at most one entry per user per day.';


-- ── 2. ROW LEVEL SECURITY — WEIGHT_LOGS ──────────────────────
-- STRICT OWNER-ONLY. All four operations (SELECT, INSERT, UPDATE,
-- DELETE) permitted only for the owner. No policy exists for any
-- other user, so a partner querying this table receives 0 rows
-- and no error.

alter table public.weight_logs enable row level security;

-- Owner can read their own weight history.
create policy "weight_logs: owner select"
  on public.weight_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Owner can insert new weight entries.
create policy "weight_logs: owner insert"
  on public.weight_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Owner can update existing entries (needed for same-day upsert / correction).
create policy "weight_logs: owner update"
  on public.weight_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Owner can delete an entry (e.g. logged the wrong day).
create policy "weight_logs: owner delete"
  on public.weight_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- No policies for any other user. Partner access does not exist.


-- ── 3. TARGET WEIGHT ─────────────────────────────────────────
-- A standalone target table was considered but skipped to keep the
-- schema minimal: the Body screen derives "toward goal" progress from
-- a client-side constant (85kg, per handover) against logged history.
-- A first-class target column can be added later without touching
-- weight_logs. Documented here so the decision is explicit.
