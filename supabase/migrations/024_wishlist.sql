-- ============================================================
-- T1501: Wishlists + Wishlist Items Migration
-- Personal wishlists with secret claim mechanism.
--
-- DESIGN: claimed_by is stored in the DB and visible to both
-- users via RLS. The APPLICATION LAYER (useWishlist hook) is
-- responsible for masking claimed_by on the owner's own items
-- so gift surprises are preserved.
--
-- Depends on: 001_auth_profiles.sql (profiles, set_updated_at)
--             020_media_files.sql (media_files for image_media_id)
-- ============================================================


-- ── 1. WISHLISTS TABLE ───────────────────────────────────────
-- One wishlist per user (is_default=true). Future: multiple named wishlists.

create table public.wishlists (
  id          uuid        primary key default gen_random_uuid(),
  owner_id    uuid        not null references public.profiles (id) on delete cascade,
  name        text        not null default 'My Wishlist',
  is_default  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index wishlists_owner_id_idx on public.wishlists (owner_id);

comment on table public.wishlists is
  'One wishlist per user (is_default=true). Future: multiple named wishlists.';


-- ── 2. WISHLIST_ITEMS TABLE ──────────────────────────────────
-- Individual wishlist items with secret claim tracking.

create table public.wishlist_items (
  id              uuid        primary key default gen_random_uuid(),
  wishlist_id     uuid        not null references public.wishlists (id) on delete cascade,
  title           text        not null,
  description     text,
  url             text,
  image_url       text,
  image_media_id  uuid        references public.media_files (id) on delete set null,
  price           numeric(10,2),
  currency        text        not null default 'EGP',
  category        text        not null default 'other'
    check (category in (
      'fashion', 'tech', 'home', 'books', 'beauty',
      'food', 'experience', 'travel', 'other'
    )),
  priority        text        not null default 'want'
    check (priority in ('must_have', 'want', 'nice_to_have')),
  is_purchased    boolean     not null default false,
  purchased_at    timestamptz,
  purchased_by    uuid        references public.profiles (id) on delete set null,
  claimed_by      uuid        references public.profiles (id) on delete set null,
  claimed_at      timestamptz,
  sort_order      integer     not null default 0,
  added_by        uuid        not null references public.profiles (id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index wishlist_items_wishlist_id_idx
  on public.wishlist_items (wishlist_id);

create index wishlist_items_wishlist_purchased_idx
  on public.wishlist_items (wishlist_id, is_purchased);

comment on table public.wishlist_items is
  'Individual wishlist items. claimed_by is SECRET from the wishlist owner — masked at application layer, NOT RLS.';
comment on column public.wishlist_items.claimed_by is
  'Partner who intends to buy this item. MUST be masked by the hook when returning items to the wishlist owner.';


-- ── 3. UPDATED_AT TRIGGERS ──────────────────────────────────

create trigger wishlists_set_updated_at
  before update on public.wishlists
  for each row
  execute function public.set_updated_at();

create trigger wishlist_items_set_updated_at
  before update on public.wishlist_items
  for each row
  execute function public.set_updated_at();


-- ── 4. ROW LEVEL SECURITY — WISHLISTS ───────────────────────
-- Owner: full CRUD. Partner: read-only.

alter table public.wishlists enable row level security;

create policy "wishlists: owner select"
  on public.wishlists for select
  to authenticated
  using (auth.uid() = owner_id);

create policy "wishlists: partner select"
  on public.wishlists for select
  to authenticated
  using (owner_id = public.get_partner_id());

create policy "wishlists: owner insert"
  on public.wishlists for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "wishlists: owner update"
  on public.wishlists for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "wishlists: owner delete"
  on public.wishlists for delete
  to authenticated
  using (auth.uid() = owner_id);


-- ── 5. ROW LEVEL SECURITY — WISHLIST_ITEMS ──────────────────
-- Both users can read all items (claim masking is app-layer).
-- Owner can CRUD own wishlist's items.
-- Partner can UPDATE claim/purchase fields on partner's items.

alter table public.wishlist_items enable row level security;

-- Owner reads own wishlist items
create policy "wishlist_items: owner select"
  on public.wishlist_items for select
  to authenticated
  using (
    wishlist_id in (
      select id from public.wishlists where owner_id = auth.uid()
    )
  );

-- Partner reads partner's wishlist items
create policy "wishlist_items: partner select"
  on public.wishlist_items for select
  to authenticated
  using (
    wishlist_id in (
      select id from public.wishlists where owner_id = public.get_partner_id()
    )
  );

-- Owner can insert items to own wishlist
create policy "wishlist_items: owner insert"
  on public.wishlist_items for insert
  to authenticated
  with check (
    wishlist_id in (
      select id from public.wishlists where owner_id = auth.uid()
    )
  );

-- Owner can update own wishlist items
create policy "wishlist_items: owner update"
  on public.wishlist_items for update
  to authenticated
  using (
    wishlist_id in (
      select id from public.wishlists where owner_id = auth.uid()
    )
  );

-- Partner can update claim/purchase status on partner's items
create policy "wishlist_items: partner update claim"
  on public.wishlist_items for update
  to authenticated
  using (
    wishlist_id in (
      select id from public.wishlists where owner_id = public.get_partner_id()
    )
  );

-- Owner can delete own wishlist items
create policy "wishlist_items: owner delete"
  on public.wishlist_items for delete
  to authenticated
  using (
    wishlist_id in (
      select id from public.wishlists where owner_id = auth.uid()
    )
  );


-- ── 6. AUTO-CREATE DEFAULT WISHLIST ─────────────────────────
-- When a profile is created, auto-create a default wishlist.
-- Uses SECURITY DEFINER to bypass RLS.

create or replace function public.create_default_wishlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wishlists (owner_id, name, is_default)
  values (new.id, 'My Wishlist', true);
  return new;
end;
$$;

create trigger profiles_create_default_wishlist
  after insert on public.profiles
  for each row
  execute function public.create_default_wishlist();


-- ── 7. BACKFILL DEFAULT WISHLISTS ───────────────────────────
-- Create default wishlists for existing profiles that don't have one.

insert into public.wishlists (owner_id, name, is_default)
select p.id, 'My Wishlist', true
from public.profiles p
where not exists (
  select 1 from public.wishlists w
  where w.owner_id = p.id and w.is_default = true
);
