-- ============================================================
-- T1101: Vision Board System Migration
-- Creates vision_boards, vision_categories, vision_items,
-- monthly_evaluations, and category_scores tables.
--
-- PARTNER VISIBILITY: Both partners can see each other's boards.
-- Only the board owner can create/update/delete boards,
-- categories, and items. Both partners can submit evaluations.
--
-- This is migration 022. Requires 001 (profiles + set_updated_at),
-- 020 (media_files).
-- ============================================================


-- ── 1. VISION_BOARDS TABLE ─────────────────────────────────
-- One board per user per year.

create table public.vision_boards (
  id            uuid        primary key default gen_random_uuid(),
  owner_id      uuid        not null references public.profiles (id) on delete cascade,
  year          integer     not null check (year >= 2024 and year <= 2100),
  title         text        not null,
  theme         text,
  hero_media_id uuid        references public.media_files (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (owner_id, year)
);

create index vision_boards_owner_id_idx on public.vision_boards (owner_id);

comment on table public.vision_boards is
  'Annual vision boards. One per user per year. Partner can view.';


-- ── 2. VISION_CATEGORIES TABLE ─────────────────────────────
-- User-defined categories within a board (e.g. Faith, Career).

create table public.vision_categories (
  id            uuid        primary key default gen_random_uuid(),
  board_id      uuid        not null references public.vision_boards (id) on delete cascade,
  name          text        not null,
  icon          text        not null default '✨',
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index vision_categories_board_id_idx on public.vision_categories (board_id);

comment on table public.vision_categories is
  'Categories within a vision board. Ordered by sort_order.';


-- ── 3. VISION_ITEMS TABLE ──────────────────────────────────
-- Individual aspiration items within a category.

create table public.vision_items (
  id            uuid        primary key default gen_random_uuid(),
  category_id   uuid        not null references public.vision_categories (id) on delete cascade,
  title         text        not null,
  description   text,
  media_id      uuid        references public.media_files (id) on delete set null,
  is_achieved   boolean     not null default false,
  achieved_at   timestamptz,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index vision_items_category_id_idx on public.vision_items (category_id);

comment on table public.vision_items is
  'Individual vision board items. Can have an optional image via media_files.';
comment on column public.vision_items.is_achieved is
  'When true, item is marked as achieved with a copper border + checkmark.';


-- ── 4. MONTHLY_EVALUATIONS TABLE ───────────────────────────
-- Monthly self-evaluation (or partner evaluation) of a board.

create table public.monthly_evaluations (
  id            uuid        primary key default gen_random_uuid(),
  board_id      uuid        not null references public.vision_boards (id) on delete cascade,
  evaluator_id  uuid        not null references public.profiles (id) on delete cascade,
  month         integer     not null check (month >= 1 and month <= 12),
  year          integer     not null check (year >= 2024 and year <= 2100),
  overall_score integer     not null check (overall_score >= 1 and overall_score <= 10),
  reflection    text,
  created_at    timestamptz not null default now(),

  unique (board_id, evaluator_id, month, year)
);

create index monthly_evaluations_board_month_idx
  on public.monthly_evaluations (board_id, month);

comment on table public.monthly_evaluations is
  'Monthly 1-10 evaluation of a vision board. Both owner and partner can submit.';
comment on column public.monthly_evaluations.evaluator_id is
  'Who submitted this evaluation. Can be the board owner (self) or their partner.';


-- ── 5. CATEGORY_SCORES TABLE ───────────────────────────────
-- Per-category score within a monthly evaluation.

create table public.category_scores (
  id            uuid        primary key default gen_random_uuid(),
  evaluation_id uuid        not null references public.monthly_evaluations (id) on delete cascade,
  category_id   uuid        not null references public.vision_categories (id) on delete cascade,
  score         integer     not null check (score >= 1 and score <= 10),
  note          text,

  unique (evaluation_id, category_id)
);

create index category_scores_evaluation_id_idx on public.category_scores (evaluation_id);

comment on table public.category_scores is
  'Per-category score within a monthly evaluation. Score constrained 1-10.';


-- ── 6. UPDATED_AT TRIGGER ──────────────────────────────────
-- Only on vision_boards (other tables are append-only or immutable).

create trigger vision_boards_set_updated_at
  before update on public.vision_boards
  for each row
  execute function public.set_updated_at();


-- ── 7. ROW LEVEL SECURITY — VISION_BOARDS ──────────────────
-- Owner: full CRUD. Partner: read-only.

alter table public.vision_boards enable row level security;

-- Owner can read own boards
create policy "vision_boards: owner select"
  on public.vision_boards for select
  to authenticated
  using (auth.uid() = owner_id);

-- Partner can read boards
create policy "vision_boards: partner select"
  on public.vision_boards for select
  to authenticated
  using (
    owner_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

-- Owner can create boards
create policy "vision_boards: owner insert"
  on public.vision_boards for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- Owner can update own boards
create policy "vision_boards: owner update"
  on public.vision_boards for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Owner can delete own boards
create policy "vision_boards: owner delete"
  on public.vision_boards for delete
  to authenticated
  using (auth.uid() = owner_id);


-- ── 8. ROW LEVEL SECURITY — VISION_CATEGORIES ─────────────
-- Board owner: full CRUD. Partner: read-only (via board join).

alter table public.vision_categories enable row level security;

-- Owner can read categories of own boards
create policy "vision_categories: owner select"
  on public.vision_categories for select
  to authenticated
  using (
    exists (
      select 1 from public.vision_boards
      where vision_boards.id = vision_categories.board_id
        and vision_boards.owner_id = auth.uid()
    )
  );

-- Partner can read categories of partner's boards
create policy "vision_categories: partner select"
  on public.vision_categories for select
  to authenticated
  using (
    exists (
      select 1 from public.vision_boards
      where vision_boards.id = vision_categories.board_id
        and vision_boards.owner_id in (
          select id from public.profiles
          where partner_id = auth.uid()
        )
    )
  );

-- Owner can insert categories into own boards
create policy "vision_categories: owner insert"
  on public.vision_categories for insert
  to authenticated
  with check (
    exists (
      select 1 from public.vision_boards
      where vision_boards.id = vision_categories.board_id
        and vision_boards.owner_id = auth.uid()
    )
  );

-- Owner can update categories of own boards
create policy "vision_categories: owner update"
  on public.vision_categories for update
  to authenticated
  using (
    exists (
      select 1 from public.vision_boards
      where vision_boards.id = vision_categories.board_id
        and vision_boards.owner_id = auth.uid()
    )
  );

-- Owner can delete categories from own boards
create policy "vision_categories: owner delete"
  on public.vision_categories for delete
  to authenticated
  using (
    exists (
      select 1 from public.vision_boards
      where vision_boards.id = vision_categories.board_id
        and vision_boards.owner_id = auth.uid()
    )
  );


-- ── 9. ROW LEVEL SECURITY — VISION_ITEMS ──────────────────
-- Board owner: full CRUD. Partner: read-only (via category→board join).

alter table public.vision_items enable row level security;

-- Owner can read items of own boards
create policy "vision_items: owner select"
  on public.vision_items for select
  to authenticated
  using (
    exists (
      select 1 from public.vision_categories vc
      join public.vision_boards vb on vb.id = vc.board_id
      where vc.id = vision_items.category_id
        and vb.owner_id = auth.uid()
    )
  );

-- Partner can read items of partner's boards
create policy "vision_items: partner select"
  on public.vision_items for select
  to authenticated
  using (
    exists (
      select 1 from public.vision_categories vc
      join public.vision_boards vb on vb.id = vc.board_id
      where vc.id = vision_items.category_id
        and vb.owner_id in (
          select id from public.profiles
          where partner_id = auth.uid()
        )
    )
  );

-- Owner can insert items into own boards
create policy "vision_items: owner insert"
  on public.vision_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.vision_categories vc
      join public.vision_boards vb on vb.id = vc.board_id
      where vc.id = vision_items.category_id
        and vb.owner_id = auth.uid()
    )
  );

-- Owner can update items of own boards
create policy "vision_items: owner update"
  on public.vision_items for update
  to authenticated
  using (
    exists (
      select 1 from public.vision_categories vc
      join public.vision_boards vb on vb.id = vc.board_id
      where vc.id = vision_items.category_id
        and vb.owner_id = auth.uid()
    )
  );

-- Owner can delete items from own boards
create policy "vision_items: owner delete"
  on public.vision_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.vision_categories vc
      join public.vision_boards vb on vb.id = vc.board_id
      where vc.id = vision_items.category_id
        and vb.owner_id = auth.uid()
    )
  );


-- ── 10. ROW LEVEL SECURITY — MONTHLY_EVALUATIONS ──────────
-- Both partners can evaluate. Both can read evaluations.

alter table public.monthly_evaluations enable row level security;

-- Board owner can read evaluations of own board
create policy "monthly_evaluations: board owner select"
  on public.monthly_evaluations for select
  to authenticated
  using (
    exists (
      select 1 from public.vision_boards
      where vision_boards.id = monthly_evaluations.board_id
        and vision_boards.owner_id = auth.uid()
    )
  );

-- Evaluator can read own evaluations
create policy "monthly_evaluations: evaluator select"
  on public.monthly_evaluations for select
  to authenticated
  using (auth.uid() = evaluator_id);

-- Partner can read evaluations of partner's board
create policy "monthly_evaluations: partner select"
  on public.monthly_evaluations for select
  to authenticated
  using (
    exists (
      select 1 from public.vision_boards
      where vision_boards.id = monthly_evaluations.board_id
        and vision_boards.owner_id in (
          select id from public.profiles
          where partner_id = auth.uid()
        )
    )
  );

-- Both owner and partner can insert evaluations
-- (evaluator must be themselves)
create policy "monthly_evaluations: authenticated insert"
  on public.monthly_evaluations for insert
  to authenticated
  with check (
    auth.uid() = evaluator_id
    and exists (
      select 1 from public.vision_boards
      where vision_boards.id = monthly_evaluations.board_id
        and (
          vision_boards.owner_id = auth.uid()
          or vision_boards.owner_id in (
            select id from public.profiles
            where partner_id = auth.uid()
          )
        )
    )
  );


-- ── 11. ROW LEVEL SECURITY — CATEGORY_SCORES ──────────────
-- Inherit access via evaluation_id.

alter table public.category_scores enable row level security;

-- Can read if you can read the evaluation
create policy "category_scores: select via evaluation"
  on public.category_scores for select
  to authenticated
  using (
    exists (
      select 1 from public.monthly_evaluations me
      join public.vision_boards vb on vb.id = me.board_id
      where me.id = category_scores.evaluation_id
        and (
          vb.owner_id = auth.uid()
          or me.evaluator_id = auth.uid()
          or vb.owner_id in (
            select id from public.profiles
            where partner_id = auth.uid()
          )
        )
    )
  );

-- Evaluator can insert scores for own evaluations
create policy "category_scores: evaluator insert"
  on public.category_scores for insert
  to authenticated
  with check (
    exists (
      select 1 from public.monthly_evaluations
      where monthly_evaluations.id = category_scores.evaluation_id
        and monthly_evaluations.evaluator_id = auth.uid()
    )
  );


-- ── 12. STORAGE BUCKET ─────────────────────────────────────
-- For vision board hero banners and item photos.

insert into storage.buckets (id, name, public, file_size_limit)
values ('vision-board-images', 'vision-board-images', true, 5242880)
on conflict (id) do nothing;
