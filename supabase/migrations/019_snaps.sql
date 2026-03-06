-- ============================================================
-- T1008: Snaps + Snap Schedule Tables
-- Creates snaps and snap_schedule tables for BeReal-style
-- daily random photo trigger.
--
-- DAILY: A random time is scheduled each day (9:00–21:00 Cairo).
-- When the time hits, both users get a push notification
-- to take their snap. Each user can submit one snap per day.
--
-- This is migration 019. Requires 001 (profiles + set_updated_at).
-- ============================================================


-- ── 1. SNAPS TABLE ─────────────────────────────────────────────
-- One row per user per day. Stores the photo, caption, and reaction.

create table public.snaps (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  snap_date     date        not null default (now() at time zone 'Africa/Cairo')::date,
  photo_url     text,
  caption       text,
  reaction_emoji text,
  window_opened_at timestamptz,
  created_at    timestamptz not null default now(),

  unique (user_id, snap_date)
);

create index snaps_user_id_idx on public.snaps (user_id);
create index snaps_snap_date_idx on public.snaps (snap_date desc);

comment on table public.snaps is
  'BeReal-style daily photo snaps. UNIQUE(user_id, snap_date) prevents double-posting.';


-- ── 2. SNAP_SCHEDULE TABLE ─────────────────────────────────────
-- One row per day. Stores the trigger time for that day.

create table public.snap_schedule (
  id            uuid        primary key default gen_random_uuid(),
  schedule_date date        not null unique,
  trigger_time  time        not null,
  created_at    timestamptz not null default now()
);

create index snap_schedule_date_idx on public.snap_schedule (schedule_date desc);

comment on table public.snap_schedule is
  'Daily snap trigger schedule. One row per day with random trigger time (9:00–21:00 Cairo).';


-- ── 3. GENERATE SNAP SCHEDULE FUNCTION ─────────────────────────
-- Generates a snap schedule entry for tomorrow with a random time
-- between 09:00 and 21:00 Cairo time.

create or replace function public.generate_snap_schedule()
returns void
language plpgsql
security definer
as $$
declare
  tomorrow date;
  random_hour integer;
  random_minute integer;
  trigger_t time;
begin
  tomorrow := (now() at time zone 'Africa/Cairo')::date + interval '1 day';

  -- Random hour between 9 and 20 (inclusive), so time is 09:00–20:59
  random_hour := 9 + floor(random() * 12)::integer;
  random_minute := floor(random() * 60)::integer;

  trigger_t := make_time(random_hour, random_minute, 0);

  insert into public.snap_schedule (schedule_date, trigger_time)
  values (tomorrow, trigger_t)
  on conflict (schedule_date) do nothing;
end;
$$;

comment on function public.generate_snap_schedule() is
  'Generates a random snap trigger time for tomorrow (09:00–21:00 Cairo). Idempotent.';


-- ── 4. ROW LEVEL SECURITY — SNAPS ─────────────────────────────
-- Own + partner select. Own insert + update. No delete.

alter table public.snaps enable row level security;

-- User can read own snaps
create policy "snaps: user select own"
  on public.snaps for select
  to authenticated
  using (auth.uid() = user_id);

-- User can read partner's snaps
create policy "snaps: partner select"
  on public.snaps for select
  to authenticated
  using (
    user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

-- User can insert own snaps
create policy "snaps: user insert"
  on public.snaps for insert
  to authenticated
  with check (auth.uid() = user_id);

-- User can update own snaps (add photo/caption/reaction after initial insert)
create policy "snaps: user update"
  on public.snaps for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy — snaps are permanent


-- ── 5. ROW LEVEL SECURITY — SNAP_SCHEDULE ─────────────────────
-- All authenticated users can read. No insert/update/delete from client.

alter table public.snap_schedule enable row level security;

create policy "snap_schedule: authenticated select"
  on public.snap_schedule for select
  to authenticated
  using (true);

-- No insert/update/delete policies — managed by server-side function/cron only


-- ── 6. STORAGE BUCKET — SNAP PHOTOS ──────────────────────────
-- For snap photos. Max 5MB. Partner can read.

insert into storage.buckets (id, name, public, file_size_limit)
values ('snap-photos', 'snap-photos', true, 5242880)
on conflict (id) do nothing;


-- ── 7. ENABLE REALTIME ────────────────────────────────────────

alter publication supabase_realtime add table public.snaps;
