-- ============================================================
-- 052: Travels Module
-- A shared travel space for the couple. Both partners see ALL
-- trips (even trips taken with other companions). Companions are
-- free-form logged people (name, relation, optional avatar) — NOT
-- Y2 accounts. Trips can be NATIVE (rendered in Y2) or HOSTED (an
-- external static trip-site linked via hosted_path, added later).
--
-- Depends on: 001_auth_profiles.sql (profiles + get_partner_id),
--             008_fix_partner_read_policy.sql (get_partner_id helper).
-- Mirrors the partner-read pattern in 002_coyyns.sql.
-- ============================================================


-- ── 1. TRIPS TABLE ───────────────────────────────────────────

create table public.trips (
  id            uuid        primary key default gen_random_uuid(),
  created_by    uuid        not null references auth.users (id) on delete cascade,
  title         text        not null,
  destination   text,
  start_date    date,
  end_date      date,
  cover_image   text,
  summary       text,
  kind          text        not null default 'native' check (kind in ('native', 'hosted')),
  hosted_path   text,
  status        text        not null default 'past' check (status in ('upcoming', 'ongoing', 'past')),
  created_at    timestamptz not null default now()
);

-- Trips are listed newest-first per creator; index supports the index page query.
create index trips_created_by_created_at_idx on public.trips (created_by, created_at desc);
create index trips_status_idx on public.trips (status);

comment on table public.trips is
  'Shared travel log. Both partners can read every trip (partner-read RLS). A trip is either kind=native (rendered in Y2) or kind=hosted (an external static trip-site linked via hosted_path, served by a later gated route).';
comment on column public.trips.created_by is
  'auth.users id of the partner who logged the trip. Used by RLS for own-write + partner-read.';
comment on column public.trips.kind is
  'native = rendered in Y2 from these columns + photos. hosted = an external static bundle; UI shows an "Open the trip" button linking to hosted_path.';
comment on column public.trips.hosted_path is
  'For kind=hosted only: the path/URL of the gated static trip site (e.g. /e/<slug> or a signed route). Null for native trips. The hosting itself is NOT built here.';
comment on column public.trips.status is
  'upcoming | ongoing | past. Drives sectioning on the index and the badge on each card.';
comment on column public.trips.cover_image is
  'Public URL of the trip cover image (trip-covers bucket). Optional — empty trips fall back to a scene.';


-- ── 2. TRIP COMPANIONS TABLE ─────────────────────────────────
-- Free-form logged people on a trip. NOT Y2 accounts — just a
-- name + relation (e.g. "Mum", "Friend") + optional avatar.

create table public.trip_companions (
  id          uuid        primary key default gen_random_uuid(),
  trip_id     uuid        not null references public.trips (id) on delete cascade,
  name        text        not null,
  relation    text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create index trip_companions_trip_id_idx on public.trip_companions (trip_id);

comment on table public.trip_companions is
  'Free-form people logged on a trip (name + relation + optional avatar). NOT linked to auth.users — companions are not Y2 accounts. Cascade-deleted with the parent trip.';
comment on column public.trip_companions.relation is
  'Human label for who they are to the couple, e.g. "Mum", "Friend", "Brother". Optional, free text.';


-- ── 3. ROW LEVEL SECURITY — TRIPS ────────────────────────────
-- SELECT: creator OR their partner (mirror 002_coyyns partner-read).
-- INSERT/UPDATE/DELETE: creator only.

alter table public.trips enable row level security;

-- Read: the creator can read their own trips.
create policy "trips: own read"
  on public.trips
  for select
  using (auth.uid() = created_by);

-- Read: a partner can read the other's trips (travels are shared).
-- Uses the SECURITY DEFINER get_partner_id() helper (008) to avoid
-- recursive RLS evaluation on profiles.
create policy "trips: partner read"
  on public.trips
  for select
  using (created_by = public.get_partner_id());

-- Insert: users create trips for themselves only.
create policy "trips: own insert"
  on public.trips
  for insert
  with check (auth.uid() = created_by);

-- Update: only the creator can edit a trip.
create policy "trips: own update"
  on public.trips
  for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Delete: only the creator can delete a trip.
create policy "trips: own delete"
  on public.trips
  for delete
  using (auth.uid() = created_by);


-- ── 4. ROW LEVEL SECURITY — TRIP COMPANIONS ──────────────────
-- Companions inherit access from the parent trip's creator: a
-- companion is readable by anyone who can read the trip (creator +
-- partner), and writable only via a trip the current user owns.

alter table public.trip_companions enable row level security;

-- Read: own trips' companions.
create policy "trip_companions: own read"
  on public.trip_companions
  for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_companions.trip_id
        and t.created_by = auth.uid()
    )
  );

-- Read: partner's trips' companions (mirrors the trip partner-read).
create policy "trip_companions: partner read"
  on public.trip_companions
  for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_companions.trip_id
        and t.created_by = public.get_partner_id()
    )
  );

-- Insert: only into a trip the current user owns.
create policy "trip_companions: own insert"
  on public.trip_companions
  for insert
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_companions.trip_id
        and t.created_by = auth.uid()
    )
  );

-- Update: only companions on a trip the current user owns.
create policy "trip_companions: own update"
  on public.trip_companions
  for update
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_companions.trip_id
        and t.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_companions.trip_id
        and t.created_by = auth.uid()
    )
  );

-- Delete: only companions on a trip the current user owns.
create policy "trip_companions: own delete"
  on public.trip_companions
  for delete
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_companions.trip_id
        and t.created_by = auth.uid()
    )
  );


-- ── 5. STORAGE BUCKET — TRIP COVERS ──────────────────────────
-- Public bucket for trip cover images. Max 5MB. Follows the
-- snap-photos / coupon-images pattern (public read, owner-scoped
-- writes by first path segment = uploader user id).

insert into storage.buckets (id, name, public, file_size_limit)
values ('trip-covers', 'trip-covers', true, 5242880)
on conflict (id) do nothing;

-- Authenticated users can upload into their own folder (path: <uid>/...).
create policy "trip-covers: own insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (bucket is public; explicit policy for clarity).
create policy "trip-covers: public read"
  on storage.objects
  for select
  using (bucket_id = 'trip-covers');

-- Owners can replace/remove their own cover images.
create policy "trip-covers: own update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "trip-covers: own delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'trip-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ── 6. ENABLE REALTIME ───────────────────────────────────────
-- So a partner sees a newly-logged trip without a refresh.

alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.trip_companions;
