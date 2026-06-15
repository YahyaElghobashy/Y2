-- ============================================================
-- T1011: Mood Log Table
-- Simple mood tracking. Each user logs one mood per day.
-- 6 moods: good, calm, meh, low, frustrated, loving.
-- Partner can read but not modify.
--
-- Also includes: snap partner-react RLS policy (T1010 prep).
--
-- This is migration 022. Requires 001 (profiles).
-- ============================================================


-- ── 1. MOOD_LOG TABLE ───────────────────────────────────────
-- One mood per user per day. Upsert-safe via UNIQUE constraint.

create table public.mood_log (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  mood        text        not null check (mood in ('good', 'calm', 'meh', 'low', 'frustrated', 'loving')),
  note        text,
  mood_date   date        not null default (now() at time zone 'Africa/Cairo')::date,
  logged_at   timestamptz not null default now(),

  unique (user_id, mood_date)
);

create index mood_log_user_date_idx on public.mood_log (user_id, mood_date desc);

comment on table public.mood_log is
  'Daily mood tracking. UNIQUE(user_id, mood_date) enforces one mood per day. Upsert to change.';


-- ── 2. ROW LEVEL SECURITY — MOOD_LOG ───────────────────────
-- Own: SELECT, INSERT, UPDATE (upsert needs update for re-picking)
-- Partner: SELECT only
-- No DELETE — moods are permanent

alter table public.mood_log enable row level security;

-- User can read own moods
create policy "mood_log: user select own"
  on public.mood_log for select
  to authenticated
  using (auth.uid() = user_id);

-- User can read partner's moods
create policy "mood_log: partner select"
  on public.mood_log for select
  to authenticated
  using (
    user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

-- User can insert own moods
create policy "mood_log: user insert"
  on public.mood_log for insert
  to authenticated
  with check (auth.uid() = user_id);

-- User can update own moods (for upsert / re-picking during the day)
create policy "mood_log: user update"
  on public.mood_log for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 3. ENABLE REALTIME ─────────────────────────────────────

alter publication supabase_realtime add table public.mood_log;


-- ── 4. SNAP PARTNER-REACT RLS POLICY ───────────────────────
-- Allows partner to update reaction_emoji on snaps (needed for T1010).
-- The existing snaps RLS only allows own-row updates.

create policy "snaps: partner react"
  on public.snaps for update
  to authenticated
  using (
    user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  )
  with check (
    user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );
