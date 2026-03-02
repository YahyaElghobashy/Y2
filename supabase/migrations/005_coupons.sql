-- ============================================================
-- T601: Love Coupons Migration
-- Creates coupons + coupon_history tables, RLS policies,
-- triggers, and indexes.
-- Depends on: 001_auth_profiles.sql (profiles table)
-- ============================================================


-- ── 1. COUPONS TABLE ─────────────────────────────────────────

create table public.coupons (
  id                uuid        primary key default gen_random_uuid(),
  creator_id        uuid        not null references public.profiles (id) on delete restrict,
  recipient_id      uuid        not null references public.profiles (id) on delete restrict,
  title             text        not null,
  description       text,
  emoji             text,
  category          text        not null default 'general',
  image_url         text,
  status            text        not null default 'active',
  is_surprise       boolean     not null default false,
  surprise_revealed boolean     not null default false,
  redeemed_at       timestamptz,
  approved_at       timestamptz,
  rejected_at       timestamptz,
  rejection_reason  text,
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- status must be one of the defined lifecycle values
  constraint coupons_status_check check (
    status in ('active', 'pending_approval', 'redeemed', 'rejected', 'expired')
  ),

  -- category must be one of the defined values
  constraint coupons_category_check check (
    category in ('romantic', 'practical', 'fun', 'food', 'general')
  ),

  -- creator and recipient must be different people
  constraint coupons_no_self_gift check (creator_id <> recipient_id),

  -- surprise_revealed can only be true if is_surprise is true
  constraint coupons_reveal_requires_surprise check (
    surprise_revealed = false or is_surprise = true
  )
);

-- Indexes for common query patterns
create index coupons_creator_id_idx    on public.coupons (creator_id);
create index coupons_recipient_id_idx  on public.coupons (recipient_id);
create index coupons_status_idx        on public.coupons (status);
create index coupons_expires_at_idx    on public.coupons (expires_at)
  where expires_at is not null;

comment on table public.coupons is
  'One row per love coupon. Tracks the full lifecycle from creation to redemption.';
comment on column public.coupons.is_surprise is
  'When true, the recipient cannot see this coupon until surprise_revealed is set to true.';
comment on column public.coupons.surprise_revealed is
  'Creator flips this to true to make a surprise coupon visible to the recipient.';
comment on column public.coupons.status is
  'Lifecycle state: active → pending_approval → redeemed | rejected. Also: expired.';


-- ── 2. COUPON_HISTORY TABLE ───────────────────────────────────

create table public.coupon_history (
  id          uuid        primary key default gen_random_uuid(),
  coupon_id   uuid        not null references public.coupons (id) on delete cascade,
  action      text        not null,
  actor_id    uuid        not null references public.profiles (id) on delete restrict,
  note        text,
  created_at  timestamptz not null default now(),

  constraint coupon_history_action_check check (
    action in ('created', 'redeemed', 'approved', 'rejected', 'revealed', 'expired')
  )
);

-- Indexes for fetching history by coupon
create index coupon_history_coupon_id_idx on public.coupon_history (coupon_id);
create index coupon_history_actor_id_idx  on public.coupon_history (actor_id);

comment on table public.coupon_history is
  'Immutable audit log of every state change on a coupon. Rows are never updated or deleted.';
comment on column public.coupon_history.action is
  'What happened: created | redeemed | approved | rejected | revealed | expired';
comment on column public.coupon_history.actor_id is
  'The profile ID of the user who performed this action.';


-- ── 3. UPDATED_AT TRIGGER FOR COUPONS ────────────────────────
-- Reuses set_updated_at() created in 001_auth_profiles.sql

create trigger coupons_set_updated_at
  before update on public.coupons
  for each row
  execute function public.set_updated_at();


-- ── 4. AUTO-LOG 'created' TO coupon_history ON INSERT ────────

create or replace function public.handle_coupon_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.coupon_history (coupon_id, action, actor_id)
  values (new.id, 'created', new.creator_id);
  return new;
end;
$$;

create trigger on_coupon_created
  after insert on public.coupons
  for each row
  execute function public.handle_coupon_created();


-- ── 5. ROW LEVEL SECURITY: COUPONS ───────────────────────────
--
-- SURPRISE COUPON LOGIC (read carefully):
--
--   A coupon is readable by the recipient ONLY IF:
--     (a) is_surprise = false         (not a surprise — always visible)
--   OR
--     (b) is_surprise = true AND surprise_revealed = true
--         (was a surprise, but has now been revealed by the creator)
--
--   In other words: if is_surprise = true AND surprise_revealed = false,
--   the recipient CANNOT see the coupon. The NOT EXISTS check below
--   prevents the row from appearing in any recipient SELECT query.
--
--   The creator can always see all their own coupons regardless of
--   surprise status — they know what they created.

alter table public.coupons enable row level security;

-- Creator: full read access to all coupons they created
create policy "coupons: creator read"
  on public.coupons
  for select
  using (auth.uid() = creator_id);

-- Recipient: can read coupons where they are the recipient,
-- EXCEPT surprise coupons that have not yet been revealed.
create policy "coupons: recipient read (non-surprise)"
  on public.coupons
  for select
  using (
    auth.uid() = recipient_id
    and (
      is_surprise = false
      or (is_surprise = true and surprise_revealed = true)
    )
  );

-- Creator: can INSERT a new coupon (must set themselves as creator)
create policy "coupons: creator insert"
  on public.coupons
  for insert
  with check (auth.uid() = creator_id);

-- Creator: can UPDATE a coupon they own.
-- This covers: approve (status → 'redeemed'), reject (status → 'rejected'),
-- reveal (surprise_revealed → true), set rejection_reason, set approved_at, etc.
create policy "coupons: creator update"
  on public.coupons
  for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Recipient: can UPDATE a coupon to redeem it.
-- Specifically: set status = 'pending_approval' and redeemed_at = now().
-- The check constrains that recipient cannot change creator_id, recipient_id,
-- title, or any creator-only fields — enforced at app layer.
create policy "coupons: recipient update (redeem)"
  on public.coupons
  for update
  using (
    auth.uid() = recipient_id
    and (
      is_surprise = false
      or (is_surprise = true and surprise_revealed = true)
    )
  )
  with check (auth.uid() = recipient_id);

-- No DELETE policy — coupons are permanent records


-- ── 6. ROW LEVEL SECURITY: COUPON_HISTORY ────────────────────

alter table public.coupon_history enable row level security;

-- Both creator and recipient of a coupon can read its history.
-- We join back to coupons to determine membership.
create policy "coupon_history: creator or recipient read"
  on public.coupon_history
  for select
  using (
    exists (
      select 1
      from public.coupons c
      where c.id = coupon_history.coupon_id
        and (c.creator_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

-- Users can only insert history rows where they are the actor.
-- The auto-trigger for 'created' runs as security definer, bypassing this.
-- Client-side history inserts (e.g., app logging 'redeemed') must have actor_id = auth.uid().
create policy "coupon_history: actor insert"
  on public.coupon_history
  for insert
  with check (
    auth.uid() = actor_id
    and exists (
      select 1
      from public.coupons c
      where c.id = coupon_history.coupon_id
        and (c.creator_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

-- No UPDATE or DELETE on coupon_history — the log is append-only
