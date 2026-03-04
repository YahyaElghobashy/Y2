-- ============================================================
-- T701: Shared Calendar Migration
-- Creates events table with RLS for the shared calendar.
-- Both partners can see shared events; only creator can modify.
--
-- Depends on: 001_auth_profiles.sql (profiles table)
-- ============================================================


-- ── 1. EVENTS TABLE ──────────────────────────────────────────

create table public.events (
  id                        uuid        primary key default gen_random_uuid(),
  creator_id                uuid        not null references public.profiles (id) on delete restrict,
  title                     text        not null,
  description               text,
  event_date                date        not null,
  event_time                time,
  end_time                  time,
  recurrence                text        not null default 'none'
    check (recurrence in ('none', 'weekly', 'monthly', 'annual')),
  category                  text        not null default 'other'
    check (category in ('date_night', 'milestone', 'reminder', 'other')),
  color                     text,
  google_calendar_event_id  text,
  is_shared                 boolean     not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index events_event_date_idx on public.events (event_date);
create index events_creator_id_idx on public.events (creator_id);

comment on table public.events is
  'Calendar events for the shared calendar. Shared events are visible to both partners.';
comment on column public.events.recurrence is
  'Recurrence pattern: none (one-time), weekly, monthly, or annual.';
comment on column public.events.category is
  'Event category: date_night, milestone, reminder, or other.';
comment on column public.events.color is
  'Optional override color hex. Null uses the category default color.';
comment on column public.events.google_calendar_event_id is
  'External Google Calendar event ID for future sync integration.';
comment on column public.events.is_shared is
  'When true, both partners can see this event. When false, only the creator can see it.';


-- ── 2. UPDATED_AT TRIGGER ────────────────────────────────────
-- Reuses set_updated_at() created in 001_auth_profiles.sql

create trigger events_set_updated_at
  before update on public.events
  for each row
  execute function public.set_updated_at();


-- ── 3. ROW LEVEL SECURITY ────────────────────────────────────

alter table public.events enable row level security;

-- Users can see their own events + shared events from their partner
create policy "events: read own and partner shared"
  on public.events
  for select
  to authenticated
  using (
    creator_id = auth.uid()
    or (is_shared = true)
  );

-- Only the creator can insert events (must set themselves as creator)
create policy "events: creator insert"
  on public.events
  for insert
  to authenticated
  with check (creator_id = auth.uid());

-- Only the creator can update their own events
create policy "events: creator update"
  on public.events
  for update
  to authenticated
  using (creator_id = auth.uid());

-- Only the creator can delete their own events
create policy "events: creator delete"
  on public.events
  for delete
  to authenticated
  using (creator_id = auth.uid());


-- ── 4. REALTIME ──────────────────────────────────────────────

alter publication supabase_realtime add table public.events;


-- ── 5. SEED DATA (placeholder) ───────────────────────────────
-- Anniversary date is a placeholder — update with actual date.

insert into public.events (creator_id, title, event_date, category, recurrence)
select
  id,
  'Anniversary',
  '2026-06-15'::date,
  'milestone',
  'annual'
from public.profiles
limit 1;
