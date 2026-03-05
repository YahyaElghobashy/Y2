-- ============================================================
-- T1301: Our Table — Food Journal Tables
-- Creates food_visits, food_ratings, food_photos for the
-- shared restaurant tracking module.
--
-- SHARED: Both partners can create visits and rate each other's
-- visits. Ratings are revealed together via both_reviewed flag.
-- Vibe score is hidden until both partners have rated.
--
-- This is migration 022. Requires 001 (profiles + set_updated_at)
-- and 020 (media_files).
-- ============================================================


-- ── 1. FOOD_VISITS TABLE ──────────────────────────────────────
-- One row per restaurant visit. Created by the visiting user.

create table public.food_visits (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  place_name    text        not null,
  place_id      text,                    -- OSM node ID (nullable, from Nominatim)
  lat           numeric(10,7),           -- GPS latitude
  lng           numeric(10,7),           -- GPS longitude
  cuisine_type  text        not null check (cuisine_type in (
    'arabic', 'asian', 'burger', 'cafe', 'dessert', 'egyptian',
    'fast_food', 'french', 'grilled', 'indian', 'italian',
    'japanese', 'korean', 'lebanese', 'mexican', 'seafood', 'turkish'
  )),
  visit_date    date        not null default current_date,
  visit_time    time,
  visit_number  integer     not null default 1 check (visit_number >= 1),
  is_bookmarked boolean     not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index food_visits_user_date_idx on public.food_visits (user_id, visit_date desc);
create index food_visits_place_id_idx on public.food_visits (place_id) where place_id is not null;
create index food_visits_place_name_idx on public.food_visits (place_name);

comment on table public.food_visits is
  'Restaurant visits in Our Table module. Each visit tracks location, cuisine, date, and optional GPS coords.';


-- ── 2. FOOD_RATINGS TABLE ─────────────────────────────────────
-- One rating per user per visit. 9 dimensions scored 1-10.
-- overall_average is a GENERATED column (avg of all 9).
-- both_reviewed flips true via trigger when both partners rate.

create table public.food_ratings (
  id              uuid        primary key default gen_random_uuid(),
  visit_id        uuid        not null references public.food_visits (id) on delete cascade,
  user_id         uuid        not null references public.profiles (id) on delete cascade,
  location_score  integer     not null check (location_score  between 1 and 10),
  parking_score   integer     not null check (parking_score   between 1 and 10),
  service_score   integer     not null check (service_score   between 1 and 10),
  food_quality    integer     not null check (food_quality     between 1 and 10),
  quantity_score  integer     not null check (quantity_score   between 1 and 10),
  price_score     integer     not null check (price_score      between 1 and 10),
  cuisine_score   integer     not null check (cuisine_score    between 1 and 10),
  bathroom_score  integer     not null check (bathroom_score   between 1 and 10),
  vibe_score      integer     not null check (vibe_score       between 1 and 10),
  overall_average numeric(3,1) not null generated always as (
    (location_score + parking_score + service_score + food_quality +
     quantity_score + price_score + cuisine_score + bathroom_score + vibe_score)::numeric / 9.0
  ) stored,
  both_reviewed   boolean     not null default false,
  created_at      timestamptz not null default now(),

  -- Each user can only rate a visit once
  unique (visit_id, user_id)
);

create index food_ratings_visit_id_idx on public.food_ratings (visit_id);
create index food_ratings_user_id_idx on public.food_ratings (user_id);

comment on table public.food_ratings is
  '9-dimension restaurant ratings. overall_average is auto-computed. both_reviewed flips when both partners rate the same visit.';


-- ── 3. FOOD_PHOTOS TABLE ──────────────────────────────────────
-- Photos attached to a visit. Two required types + optional extras.

create table public.food_photos (
  id            uuid        primary key default gen_random_uuid(),
  visit_id      uuid        not null references public.food_visits (id) on delete cascade,
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  photo_type    text        not null check (photo_type in (
    'food_plate', 'partner_eating', 'ambiance', 'dessert', 'extra'
  )),
  storage_path  text        not null,
  media_file_id uuid        references public.media_files (id) on delete set null,
  display_order integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index food_photos_visit_id_idx on public.food_photos (visit_id);

comment on table public.food_photos is
  'Photos for food visits. food_plate and partner_eating are required; ambiance, dessert, extra are optional.';


-- ── 4. AUTO-INCREMENT VISIT_NUMBER TRIGGER ────────────────────
-- Increments visit_number per restaurant for the same user.
-- Uses place_id if available, else place_name.

create or replace function public.auto_visit_number()
returns trigger
language plpgsql
security definer
as $$
declare
  max_num integer;
begin
  if new.place_id is not null then
    select coalesce(max(visit_number), 0) into max_num
    from public.food_visits
    where user_id = new.user_id
      and place_id = new.place_id;
  else
    select coalesce(max(visit_number), 0) into max_num
    from public.food_visits
    where user_id = new.user_id
      and place_name = new.place_name
      and place_id is null;
  end if;

  new.visit_number := max_num + 1;
  return new;
end;
$$;

create trigger food_visits_auto_visit_number
  before insert on public.food_visits
  for each row
  execute function public.auto_visit_number();


-- ── 5. BOTH_REVIEWED TRIGGER ──────────────────────────────────
-- When a rating is inserted, check if both partners have rated
-- the same visit. If so, flip both_reviewed=true on BOTH rows.

create or replace function public.check_both_reviewed()
returns trigger
language plpgsql
security definer
as $$
declare
  visit_creator_id uuid;
  partner_id       uuid;
  rating_count     integer;
begin
  -- Get the visit creator
  select user_id into visit_creator_id
  from public.food_visits
  where id = new.visit_id;

  -- Get the partner of the visit creator
  select p.partner_id into partner_id
  from public.profiles p
  where p.id = visit_creator_id;

  -- Count distinct raters for this visit (should be 2 when both reviewed)
  select count(distinct user_id) into rating_count
  from public.food_ratings
  where visit_id = new.visit_id
    and user_id in (visit_creator_id, partner_id);

  -- If both have rated, flip both_reviewed on all ratings for this visit
  if rating_count = 2 then
    update public.food_ratings
    set both_reviewed = true
    where visit_id = new.visit_id
      and both_reviewed = false;
  end if;

  return new;
end;
$$;

create trigger food_ratings_check_both_reviewed
  after insert on public.food_ratings
  for each row
  execute function public.check_both_reviewed();


-- ── 6. UPDATED_AT TRIGGER ─────────────────────────────────────
-- Only on food_visits (ratings and photos are insert-only).

create trigger food_visits_set_updated_at
  before update on public.food_visits
  for each row
  execute function public.set_updated_at();


-- ── 7. ROW LEVEL SECURITY — FOOD_VISITS ──────────────────────
-- Own visits: full CRUD.
-- Partner visits: read-only.

alter table public.food_visits enable row level security;

create policy "food_visits: user select own"
  on public.food_visits for select
  to authenticated
  using (auth.uid() = user_id);

create policy "food_visits: partner select"
  on public.food_visits for select
  to authenticated
  using (
    user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

create policy "food_visits: user insert"
  on public.food_visits for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "food_visits: user update"
  on public.food_visits for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "food_visits: user delete"
  on public.food_visits for delete
  to authenticated
  using (auth.uid() = user_id);


-- ── 8. ROW LEVEL SECURITY — FOOD_RATINGS ─────────────────────
-- Own ratings: insert + read (no update/delete — immutable).
-- Partner ratings: read-only.
-- Partner can insert rating on your visit (rate partner's visit).

alter table public.food_ratings enable row level security;

create policy "food_ratings: user select own"
  on public.food_ratings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "food_ratings: partner select"
  on public.food_ratings for select
  to authenticated
  using (
    user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

create policy "food_ratings: user insert own"
  on public.food_ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No update or delete — ratings are immutable once submitted


-- ── 9. ROW LEVEL SECURITY — FOOD_PHOTOS ──────────────────────
-- Own photos: insert + read + delete.
-- Partner photos: read-only.

alter table public.food_photos enable row level security;

create policy "food_photos: user select own"
  on public.food_photos for select
  to authenticated
  using (auth.uid() = user_id);

create policy "food_photos: partner select"
  on public.food_photos for select
  to authenticated
  using (
    user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

create policy "food_photos: user insert"
  on public.food_photos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "food_photos: user delete"
  on public.food_photos for delete
  to authenticated
  using (auth.uid() = user_id);


-- ── 10. STORAGE BUCKET — FOOD PHOTOS ─────────────────────────
-- For food visit photos (food plate, partner eating, ambiance, etc.)

insert into storage.buckets (id, name, public, file_size_limit)
values ('food-photos', 'food-photos', true, 10485760)  -- 10MB limit
on conflict (id) do nothing;


-- ── 11. ENABLE REALTIME ───────────────────────────────────────

alter publication supabase_realtime add table public.food_visits;
alter publication supabase_realtime add table public.food_ratings;
alter publication supabase_realtime add table public.food_photos;
