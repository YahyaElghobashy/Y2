-- ============================================================
-- T1401: Watch Together — watch_items + watch_ratings
-- Track movies, series, anime, etc. watched as a couple.
-- Secret individual scores + reactions revealed when both submit.
--
-- This is migration 024. Requires 001 (profiles + set_updated_at).
-- ============================================================


-- ── 1. WATCH_ITEMS TABLE ───────────────────────────────────
-- One row per title added to the shared watch log.

create table public.watch_items (
  id              uuid        primary key default gen_random_uuid(),
  added_by        uuid        not null references public.profiles (id) on delete cascade,
  title           text        not null,
  item_type       text        not null default 'movie'
                              check (item_type in ('movie', 'series', 'anime', 'documentary', 'short', 'other')),
  poster_url      text,
  poster_media_id uuid        references public.media_files (id) on delete set null,
  year            integer,
  tmdb_id         integer,
  status          text        not null default 'watchlist'
                              check (status in ('watchlist', 'watching', 'watched')),
  watched_date    date,
  both_rated      boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index watch_items_status_idx on public.watch_items (status);
create index watch_items_added_by_idx on public.watch_items (added_by);

comment on table public.watch_items is
  'Shared watch log. Each item has a status flow: watchlist → watching → watched.';


-- ── 2. WATCH_RATINGS TABLE ─────────────────────────────────
-- Each user rates an item independently. UNIQUE(item_id, user_id).

create table public.watch_ratings (
  id           uuid        primary key default gen_random_uuid(),
  item_id      uuid        not null references public.watch_items (id) on delete cascade,
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  score        integer     not null check (score >= 1 and score <= 10),
  reaction     text        check (char_length(reaction) <= 200),
  submitted_at timestamptz not null default now(),

  unique (item_id, user_id)
);

create index watch_ratings_item_id_idx on public.watch_ratings (item_id);

comment on table public.watch_ratings is
  'Individual ratings per watch item. Secret until both_rated flips on parent item.';


-- ── 3. UPDATED_AT TRIGGER ──────────────────────────────────
-- Only on watch_items (watch_ratings are effectively immutable).

create trigger watch_items_set_updated_at
  before update on public.watch_items
  for each row
  execute function public.set_updated_at();


-- ── 4. BOTH_RATED TRIGGER ──────────────────────────────────
-- Fires after INSERT on watch_ratings. When 2 distinct users
-- have rated the same item, set both_rated = true.

create or replace function public.check_both_watch_rated()
returns trigger as $$
begin
  if (
    select count(distinct user_id)
    from public.watch_ratings
    where item_id = NEW.item_id
  ) >= 2 then
    update public.watch_items
    set both_rated = true
    where id = NEW.item_id
      and both_rated = false;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger watch_ratings_check_both_rated
  after insert on public.watch_ratings
  for each row
  execute function public.check_both_watch_rated();


-- ── 5. ROW LEVEL SECURITY — WATCH_ITEMS ────────────────────
-- Both partners can read all items. Only added_by can update/delete.

alter table public.watch_items enable row level security;

-- Both users can read all watch items (partner via paired profile)
create policy "watch_items: user select own"
  on public.watch_items for select
  to authenticated
  using (added_by = auth.uid());

create policy "watch_items: partner select"
  on public.watch_items for select
  to authenticated
  using (
    added_by in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

-- Any authenticated user can add items
create policy "watch_items: user insert"
  on public.watch_items for insert
  to authenticated
  with check (auth.uid() = added_by);

-- Only the person who added can update
create policy "watch_items: user update"
  on public.watch_items for update
  to authenticated
  using (auth.uid() = added_by)
  with check (auth.uid() = added_by);

-- Only the person who added can delete
create policy "watch_items: user delete"
  on public.watch_items for delete
  to authenticated
  using (auth.uid() = added_by);


-- ── 6. ROW LEVEL SECURITY — WATCH_RATINGS ──────────────────
-- Both partners can read all ratings. Users can only insert their own.

alter table public.watch_ratings enable row level security;

-- User can read own ratings
create policy "watch_ratings: user select own"
  on public.watch_ratings for select
  to authenticated
  using (auth.uid() = user_id);

-- User can read partner ratings
create policy "watch_ratings: partner select"
  on public.watch_ratings for select
  to authenticated
  using (
    user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

-- User can insert own ratings
create policy "watch_ratings: user insert"
  on public.watch_ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- User can update own ratings (change score/reaction)
create policy "watch_ratings: user update"
  on public.watch_ratings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 7. ENABLE REALTIME ─────────────────────────────────────

alter publication supabase_realtime add table public.watch_items;
alter publication supabase_realtime add table public.watch_ratings;
