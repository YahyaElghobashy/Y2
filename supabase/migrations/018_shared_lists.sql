-- ============================================================
-- T1001: Shared Lists Migration
-- Creates shared_lists and list_items tables for couples.
-- Supports sub-tasks (parent_id), CoYYns rewards, and partner access.
--
-- SHARED DATA: Both partners can CRUD all lists and items.
--
-- This is migration 017. Requires 001 (profiles + set_updated_at).
-- ============================================================


-- ── 1. SHARED_LISTS TABLE ────────────────────────────────────
-- One list per title. Both partners share all lists.

create table public.shared_lists (
  id          uuid        primary key default gen_random_uuid(),
  created_by  uuid        not null references public.profiles (id) on delete cascade,
  title       text        not null,
  list_type   text        not null default 'general',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint shared_lists_type_check check (
    list_type in ('general', 'grocery', 'wishlist', 'todo')
  )
);

create index shared_lists_created_by_idx on public.shared_lists (created_by);

comment on table public.shared_lists is
  'Shared lists (grocery, todo, etc.) between both partners. '
  'Both partners can create, read, update, and delete lists.';


-- ── 2. LIST_ITEMS TABLE ──────────────────────────────────────
-- Items within a shared list. Supports sub-tasks via parent_id.

create table public.list_items (
  id             uuid        primary key default gen_random_uuid(),
  list_id        uuid        not null references public.shared_lists (id) on delete cascade,
  parent_id      uuid        references public.list_items (id) on delete cascade,
  title          text        not null,
  is_completed   boolean     not null default false,
  completed_by   uuid        references public.profiles (id) on delete set null,
  completed_at   timestamptz,
  coyyns_reward  integer     not null default 0 check (coyyns_reward >= 0),
  position       integer     not null default 0,
  created_by     uuid        not null references public.profiles (id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index list_items_list_id_idx on public.list_items (list_id);
create index list_items_parent_id_idx on public.list_items (parent_id)
  where parent_id is not null;
create index list_items_position_idx on public.list_items (list_id, position);

comment on table public.list_items is
  'Items within a shared list. parent_id enables sub-tasks. '
  'coyyns_reward is awarded when a partner completes the item.';


-- ── 3. UPDATED_AT TRIGGERS ───────────────────────────────────
-- Re-uses the set_updated_at() function from migration 001.

create trigger shared_lists_set_updated_at
  before update on public.shared_lists
  for each row
  execute function public.set_updated_at();

create trigger list_items_set_updated_at
  before update on public.list_items
  for each row
  execute function public.set_updated_at();


-- ── 4. ROW LEVEL SECURITY — SHARED_LISTS ─────────────────────
-- Both partners can CRUD all shared lists.

alter table public.shared_lists enable row level security;

create policy "shared_lists: own select"
  on public.shared_lists for select
  to authenticated
  using (auth.uid() = created_by);

create policy "shared_lists: partner select"
  on public.shared_lists for select
  to authenticated
  using (
    created_by = (select partner_id from public.profiles where id = auth.uid())
  );

create policy "shared_lists: own insert"
  on public.shared_lists for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "shared_lists: partner update"
  on public.shared_lists for update
  to authenticated
  using (
    auth.uid() = created_by
    or created_by = (select partner_id from public.profiles where id = auth.uid())
  );

create policy "shared_lists: own delete"
  on public.shared_lists for delete
  to authenticated
  using (auth.uid() = created_by);


-- ── 5. ROW LEVEL SECURITY — LIST_ITEMS ───────────────────────
-- Both partners can CRUD all items in their shared lists.

alter table public.list_items enable row level security;

create policy "list_items: partner select"
  on public.list_items for select
  to authenticated
  using (
    exists (
      select 1 from public.shared_lists sl
      where sl.id = list_items.list_id
      and (
        sl.created_by = auth.uid()
        or sl.created_by = (select partner_id from public.profiles where id = auth.uid())
      )
    )
  );

create policy "list_items: partner insert"
  on public.list_items for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.shared_lists sl
      where sl.id = list_items.list_id
      and (
        sl.created_by = auth.uid()
        or sl.created_by = (select partner_id from public.profiles where id = auth.uid())
      )
    )
  );

create policy "list_items: partner update"
  on public.list_items for update
  to authenticated
  using (
    exists (
      select 1 from public.shared_lists sl
      where sl.id = list_items.list_id
      and (
        sl.created_by = auth.uid()
        or sl.created_by = (select partner_id from public.profiles where id = auth.uid())
      )
    )
  );

create policy "list_items: partner delete"
  on public.list_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.shared_lists sl
      where sl.id = list_items.list_id
      and (
        sl.created_by = auth.uid()
        or sl.created_by = (select partner_id from public.profiles where id = auth.uid())
      )
    )
  );
