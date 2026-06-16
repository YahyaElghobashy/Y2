-- ============================================================
-- 045: W3 — Self/Spirit realtime + garden atomic open + cycle PMS notify
--
-- Three concerns, one migration:
--   1. Realtime for personal spiritual practice (prayer/quran/azkar) so a
--      user's other tab / device updates live. RLS (auth.uid()=user_id)
--      already scopes realtime events to the user's own rows.
--   2. Atomic garden "open" via a single ON CONFLICT upsert — removes the
--      read-modify-write race where two first-opens on the same day collided
--      on garden_date's UNIQUE constraint and silently dropped one open.
--   3. Cycle PMS/period awareness notification support: a private idempotency
--      marker on cycle_config + the 'cycle_reminder' notification type.
--
-- Depends on: 016 (spiritual_practice), 026 (garden), 004 (cycle_tracker),
--             003/014 (notifications).
-- ============================================================


-- ── 1. SPIRITUAL REALTIME ──────────────────────────────────────
-- FULL replica identity makes UPDATE payloads carry the full new row so the
-- realtime RLS check and client-side state merge work reliably (matches 038).

alter table public.prayer_log     replica identity full;
alter table public.quran_log      replica identity full;
alter table public.azkar_sessions replica identity full;

-- Idempotently add each table to the supabase_realtime publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prayer_log'
  ) then
    alter publication supabase_realtime add table public.prayer_log;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quran_log'
  ) then
    alter publication supabase_realtime add table public.quran_log;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'azkar_sessions'
  ) then
    alter publication supabase_realtime add table public.azkar_sessions;
  end if;
end
$$;


-- ── 2. GARDEN ATOMIC OPEN ──────────────────────────────────────
-- One statement: INSERT the day or, on garden_date conflict, set this user's
-- column and — if the other user already opened and no flower has bloomed yet
-- — pick a random flower. Postgres locks the conflicting row, so two
-- concurrent opens both land and exactly one flower blooms. No open is lost.

create or replace function public.record_garden_open(p_user_column text)
returns public.garden_days
language plpgsql
security definer set search_path = public
as $$
declare
  v_row     public.garden_days;
  v_flowers text[] := array['🌸','🌻','🌹','🌺','🌷','🌼','💐','🌿','🍀','🌵','🪻','🪷'];
  v_today   date := (now() at time zone 'Africa/Cairo')::date;
begin
  if p_user_column not in ('yahya_opened', 'yara_opened') then
    raise exception 'invalid garden column: %', p_user_column using errcode = '22023';
  end if;

  if p_user_column = 'yahya_opened' then
    insert into public.garden_days (garden_date, yahya_opened)
    values (v_today, true)
    on conflict (garden_date) do update
      set yahya_opened = true,
          flower_type = case
            when public.garden_days.yara_opened and public.garden_days.flower_type is null
              then v_flowers[1 + floor(random() * array_length(v_flowers, 1))::int]
            else public.garden_days.flower_type
          end
    returning * into v_row;
  else
    insert into public.garden_days (garden_date, yara_opened)
    values (v_today, true)
    on conflict (garden_date) do update
      set yara_opened = true,
          flower_type = case
            when public.garden_days.yahya_opened and public.garden_days.flower_type is null
              then v_flowers[1 + floor(random() * array_length(v_flowers, 1))::int]
            else public.garden_days.flower_type
          end
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

comment on function public.record_garden_open(text) is
  'Atomically records that p_user_column (yahya_opened | yara_opened) opened the '
  'app today (Cairo date) and blooms a flower when both have opened. Replaces the '
  'client-side read-modify-write to eliminate the garden_date UNIQUE-collision race.';

grant execute on function public.record_garden_open(text) to authenticated;


-- ── 3. CYCLE PMS / PERIOD NOTIFICATION SUPPORT ─────────────────
-- Idempotency marker: stores the window-start date of the most recent
-- awareness notification so we fire at most once per PMS/period window.
-- Owner-only (cycle_config RLS) — Yara can never read or write it.

alter table public.cycle_config
  add column if not exists last_pms_notified_date date;

comment on column public.cycle_config.last_pms_notified_date is
  'PRIVATE — Yahya only. The window-start date of the most recent PMS/period '
  'awareness notification, used to send at most one notification per window. '
  'NULL until the first notification fires.';

-- Expand the notifications type CHECK to allow the cycle reminder. Also adds
-- 'event_reminder' which send-event-reminder already inserts but the live
-- constraint rejected (latent bug — those audit-log inserts were failing).
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'custom',
    'coupon_approval',
    'system',
    'marketplace_effect',
    'event_reminder',
    'cycle_reminder'
  ));
