-- ============================================================
-- 053: Travels World Map
-- "Where we've been" — a shared map of the couple's world.
--
--   country_visits : one row per VISIT INSTANCE (so hybrids like
--                    "Amsterdam: Yahya 2019 solo + 2024 together"
--                    are two rows; the per-country display status is
--                    DERIVED in app code, never stored).
--   country_pins   : aspirational countries, <= 3 per person. When
--                    both pin the same country it becomes a shared
--                    dream / "Our Next Adventure".
--
-- Both partners read each other's visits + pins (partner-read RLS),
-- mirroring 052_travels.sql. The partner may add ONLY their own
-- `partner_note` to a together-memory (column-scope trigger, mirrors
-- 047_wishlist_partner_update_scope.sql).
--
-- Depends on: 001_auth_profiles.sql (set_updated_at), 008 (get_partner_id),
--             052_travels.sql (trips), 049 (notifications type CHECK).
-- ============================================================


-- ── 1. COUNTRY VISITS ────────────────────────────────────────

create table public.country_visits (
  id             uuid        primary key default gen_random_uuid(),
  created_by     uuid        not null references auth.users (id) on delete cascade,
  traveler_id    uuid        not null references auth.users (id) on delete cascade,
  country_code   text        not null,
  is_together    boolean     not null default false,
  place          text,
  visited_year   int,
  visited_on     date,
  companions     text,
  memorable      text,
  recommendation text,
  partner_note   text,
  trip_id        uuid        references public.trips (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint country_visits_code_len check (char_length(country_code) = 2)
);

create index country_visits_country_idx on public.country_visits (country_code);
create index country_visits_owner_idx   on public.country_visits (created_by, country_code);

comment on table public.country_visits is
  'One row per visit instance. created_by = logger; traveler_id = whose visit (the logger for is_together). The per-country map status is DERIVED in app code from all visits, never stored — this models hybrids (solo + together on the same country).';
comment on column public.country_visits.country_code is
  'ISO 3166-1 alpha-2, UPPERCASE (e.g. NL). The map keys off this.';
comment on column public.country_visits.is_together is
  'true => BOTH partners were on this visit. Drives the together/shared gradient.';
comment on column public.country_visits.recommendation is
  'For solo visits: what the traveler recommends the other do when they go together.';
comment on column public.country_visits.partner_note is
  'The partner''s own perspective on a together-memory. Partner-writable ONLY (column-scope trigger).';

-- updated_at bump (reuse the shared helper from 001_auth_profiles.sql).
create trigger country_visits_set_updated_at
  before update on public.country_visits
  for each row
  execute function public.set_updated_at();


-- ── 2. RLS — COUNTRY VISITS ──────────────────────────────────
-- Mirrors 052_travels.sql trips policies. Owner full CRUD + partner
-- read. PLUS a partner UPDATE policy (scoped to partner_note by the
-- column-scope trigger in section 3).

alter table public.country_visits enable row level security;

create policy "country_visits: own read"
  on public.country_visits
  for select
  using (auth.uid() = created_by);

create policy "country_visits: partner read"
  on public.country_visits
  for select
  using (created_by = public.get_partner_id());

create policy "country_visits: own insert"
  on public.country_visits
  for insert
  with check (auth.uid() = created_by);

create policy "country_visits: own update"
  on public.country_visits
  for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Partner may UPDATE the other's visit rows (the column-scope trigger
-- then restricts the partner to changing partner_note only).
create policy "country_visits: partner update note"
  on public.country_visits
  for update
  using (created_by = public.get_partner_id())
  with check (created_by = public.get_partner_id());

create policy "country_visits: own delete"
  on public.country_visits
  for delete
  using (auth.uid() = created_by);


-- ── 3. PARTNER COLUMN-SCOPE TRIGGER (mirrors 047) ────────────
-- The owner (or service/admin with no JWT) may change anything. The
-- partner may move ONLY partner_note — every other column must be
-- unchanged or the update is rejected.

create or replace function public.enforce_country_visit_partner_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Owner (or service/admin context with no JWT) may change anything.
  if auth.uid() is null or auth.uid() = old.created_by then
    return new;
  end if;

  -- Otherwise the updater is the partner: only partner_note may move.
  if new.created_by     is distinct from old.created_by
     or new.traveler_id    is distinct from old.traveler_id
     or new.country_code   is distinct from old.country_code
     or new.is_together    is distinct from old.is_together
     or new.place          is distinct from old.place
     or new.visited_year   is distinct from old.visited_year
     or new.visited_on     is distinct from old.visited_on
     or new.companions     is distinct from old.companions
     or new.memorable      is distinct from old.memorable
     or new.recommendation is distinct from old.recommendation
     or new.trip_id        is distinct from old.trip_id then
    raise exception
      'country_visits partner may only modify partner_note';
  end if;

  return new;
end;
$$;

drop trigger if exists country_visits_partner_update_scope on public.country_visits;

create trigger country_visits_partner_update_scope
  before update on public.country_visits
  for each row
  execute function public.enforce_country_visit_partner_update_scope();


-- ── 4. COUNTRY PINS ──────────────────────────────────────────
-- Aspirational destinations. <= 3 per person (enforced below). Each
-- person sees the other's pins (partner read) to surface overlap.

create table public.country_pins (
  id            uuid        primary key default gen_random_uuid(),
  owner_id      uuid        not null references auth.users (id) on delete cascade,
  country_code  text        not null,
  note          text,
  created_at    timestamptz not null default now(),
  unique (owner_id, country_code),
  constraint country_pins_code_len check (char_length(country_code) = 2)
);

create index country_pins_owner_idx on public.country_pins (owner_id);

comment on table public.country_pins is
  'Aspirational countries (<=3 per person, enforced by a BEFORE INSERT trigger). A country pinned by BOTH partners is a shared dream / "Our Next Adventure".';

-- Hard cap of 3 pins per owner (don't trust the client).
create or replace function public.enforce_max_country_pins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.country_pins where owner_id = new.owner_id) >= 3 then
    raise exception 'You can pin at most 3 aspirational countries';
  end if;
  return new;
end;
$$;

drop trigger if exists country_pins_max_3 on public.country_pins;

create trigger country_pins_max_3
  before insert on public.country_pins
  for each row
  execute function public.enforce_max_country_pins();


-- ── 5. RLS — COUNTRY PINS ────────────────────────────────────
-- Owner full CRUD + partner read.

alter table public.country_pins enable row level security;

create policy "country_pins: own read"
  on public.country_pins
  for select
  using (auth.uid() = owner_id);

create policy "country_pins: partner read"
  on public.country_pins
  for select
  using (owner_id = public.get_partner_id());

create policy "country_pins: own insert"
  on public.country_pins
  for insert
  with check (auth.uid() = owner_id);

create policy "country_pins: own update"
  on public.country_pins
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "country_pins: own delete"
  on public.country_pins
  for delete
  using (auth.uid() = owner_id);


-- ── 6. NOTIFICATIONS — add travel_pin_match type ─────────────
-- Re-state the full CHECK from 049 plus the new type. A pin-match is
-- a system event (NOT a user "send") so it does NOT consume the send
-- quota; the app inserts it directly with this type.

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'custom',
    'coupon_approval',
    'system',
    'marketplace_effect',
    'event_reminder',
    'cycle_reminder',
    'letter',
    'snap_reaction',
    'travel_pin_match'
  ));


-- ── 7. ENABLE REALTIME ───────────────────────────────────────

alter publication supabase_realtime add table public.country_visits;
alter publication supabase_realtime add table public.country_pins;
