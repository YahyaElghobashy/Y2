-- ============================================================
-- T614: Spiritual Practice Tables
-- Creates prayer_log, quran_log, and azkar_sessions tables
-- for personal spiritual practice tracking.
--
-- PERSONAL DATA: Each user sees only their own records.
-- Both Yahya and Yara can track independently.
--
-- This is migration 016. Requires 001 (profiles + set_updated_at).
-- ============================================================


-- ── 1. PRAYER_LOG TABLE ────────────────────────────────────────
-- One row per (user_id, date). Tracks 5 daily prayers as booleans.
-- Upserted on first interaction each day.

create table public.prayer_log (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  date        date        not null,
  fajr        boolean     not null default false,
  dhuhr       boolean     not null default false,
  asr         boolean     not null default false,
  maghrib     boolean     not null default false,
  isha        boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (user_id, date)
);

create index prayer_log_user_date_idx on public.prayer_log (user_id, date desc);

comment on table public.prayer_log is
  'Daily prayer completion tracker. One row per user per day. '
  'Each boolean represents whether that prayer was completed.';


-- ── 2. QURAN_LOG TABLE ─────────────────────────────────────────
-- One row per (user_id, date). Tracks pages read and daily goal.

create table public.quran_log (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  date        date        not null,
  pages_read  integer     not null default 0,
  daily_goal  integer     not null default 2,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (user_id, date)
);

create index quran_log_user_date_idx on public.quran_log (user_id, date desc);

comment on table public.quran_log is
  'Daily Quran reading tracker. pages_read / daily_goal per day.';


-- ── 3. AZKAR_SESSIONS TABLE ────────────────────────────────────
-- One row per (user_id, date, session_type). Tracks morning/evening azkar.

create table public.azkar_sessions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  date          date        not null,
  session_type  text        not null check (session_type in ('morning', 'evening')),
  count         integer     not null default 0,
  target        integer     not null default 33,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (user_id, date, session_type)
);

create index azkar_sessions_user_date_idx on public.azkar_sessions (user_id, date desc);

comment on table public.azkar_sessions is
  'Digital tasbih / azkar counter. Separate sessions for morning and evening.';


-- ── 4. UPDATED_AT TRIGGERS ─────────────────────────────────────
-- Re-uses the set_updated_at() function from migration 001.

create trigger prayer_log_set_updated_at
  before update on public.prayer_log
  for each row
  execute function public.set_updated_at();

create trigger quran_log_set_updated_at
  before update on public.quran_log
  for each row
  execute function public.set_updated_at();

create trigger azkar_sessions_set_updated_at
  before update on public.azkar_sessions
  for each row
  execute function public.set_updated_at();


-- ── 5. ROW LEVEL SECURITY — PRAYER_LOG ─────────────────────────
-- User sees and manages only their own prayer data.

alter table public.prayer_log enable row level security;

create policy "prayer_log: user select"
  on public.prayer_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "prayer_log: user insert"
  on public.prayer_log for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "prayer_log: user update"
  on public.prayer_log for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "prayer_log: user delete"
  on public.prayer_log for delete
  to authenticated
  using (auth.uid() = user_id);


-- ── 6. ROW LEVEL SECURITY — QURAN_LOG ──────────────────────────

alter table public.quran_log enable row level security;

create policy "quran_log: user select"
  on public.quran_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "quran_log: user insert"
  on public.quran_log for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "quran_log: user update"
  on public.quran_log for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "quran_log: user delete"
  on public.quran_log for delete
  to authenticated
  using (auth.uid() = user_id);


-- ── 7. ROW LEVEL SECURITY — AZKAR_SESSIONS ─────────────────────

alter table public.azkar_sessions enable row level security;

create policy "azkar_sessions: user select"
  on public.azkar_sessions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "azkar_sessions: user insert"
  on public.azkar_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "azkar_sessions: user update"
  on public.azkar_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "azkar_sessions: user delete"
  on public.azkar_sessions for delete
  to authenticated
  using (auth.uid() = user_id);
