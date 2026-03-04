-- ============================================================
-- T309: CoYYns Marketplace Migration
-- Creates marketplace_items + purchases tables with RLS,
-- seeds 5 starter items.
--
-- Depends on: 001_auth_profiles.sql (profiles table)
--             002_coyyns.sql (coyyns_transactions for spend)
-- ============================================================


-- ── 1. MARKETPLACE ITEMS TABLE ─────────────────────────────

create table public.marketplace_items (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  description   text        not null,
  price         integer     not null check (price > 0),
  icon          text        not null,
  effect_type   text        not null
    check (effect_type in ('extra_ping', 'veto', 'task_order', 'dnd_timer', 'wildcard')),
  effect_config jsonb       not null default '{}',
  is_active     boolean     not null default true,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index marketplace_items_sort_order_idx
  on public.marketplace_items (sort_order)
  where is_active = true;

comment on table public.marketplace_items is
  'Catalog of purchasable items in the CoYYns marketplace. Items are created by admin/migration only.';
comment on column public.marketplace_items.effect_type is
  'Machine-readable effect category: extra_ping, veto, task_order, dnd_timer, wildcard.';
comment on column public.marketplace_items.effect_config is
  'JSON config for the effect. E.g. {"extra_sends": 1} for extra_ping, {"requires_input": true} for veto.';
comment on column public.marketplace_items.is_active is
  'Soft delete. Inactive items are hidden from the store but preserved for purchase history.';


-- ── 2. PURCHASES TABLE ─────────────────────────────────────

create table public.purchases (
  id              uuid        primary key default gen_random_uuid(),
  buyer_id        uuid        not null references public.profiles (id) on delete restrict,
  target_id       uuid        not null references public.profiles (id) on delete restrict,
  item_id         uuid        not null references public.marketplace_items (id) on delete restrict,
  cost            integer     not null check (cost > 0),
  effect_payload  jsonb,
  status          text        not null default 'pending'
    check (status in ('pending', 'active', 'completed', 'expired', 'declined')),
  created_at      timestamptz not null default now(),
  completed_at    timestamptz,

  -- Buyer and target must be different people
  constraint purchases_no_self_purchase check (buyer_id <> target_id)
);

create index purchases_buyer_id_idx  on public.purchases (buyer_id);
create index purchases_target_id_idx on public.purchases (target_id);
create index purchases_item_id_idx   on public.purchases (item_id);
create index purchases_status_idx    on public.purchases (status)
  where status in ('pending', 'active');

comment on table public.purchases is
  'One row per marketplace purchase. Tracks the lifecycle from pending → active → completed/expired/declined.';
comment on column public.purchases.cost is
  'CoYYns spent on this purchase. Recorded separately from the marketplace_items.price in case of future discounts.';
comment on column public.purchases.effect_payload is
  'Buyer-provided input for the effect. E.g. {"movie": "Inception"} for veto, {"wish": "..."} for wildcard.';
comment on column public.purchases.status is
  'Lifecycle state: pending (just bought) → active (in effect) → completed/expired/declined.';


-- ── 3. ROW LEVEL SECURITY: MARKETPLACE ITEMS ───────────────

alter table public.marketplace_items enable row level security;

-- All authenticated users can browse the store
create policy "marketplace_items: authenticated read"
  on public.marketplace_items
  for select
  to authenticated
  using (true);


-- ── 4. ROW LEVEL SECURITY: PURCHASES ───────────────────────

alter table public.purchases enable row level security;

-- Buyer and target can see their purchases
create policy "purchases: buyer read"
  on public.purchases
  for select
  using (buyer_id = auth.uid());

create policy "purchases: target read"
  on public.purchases
  for select
  using (target_id = auth.uid());

-- Only the buyer can create a purchase
create policy "purchases: buyer insert"
  on public.purchases
  for insert
  with check (buyer_id = auth.uid());

-- Both buyer and target can update status
create policy "purchases: buyer update"
  on public.purchases
  for update
  using (buyer_id = auth.uid());

create policy "purchases: target update"
  on public.purchases
  for update
  using (target_id = auth.uid());


-- ── 5. UNIQUE CONSTRAINT FOR IDEMPOTENT SEEDING ──────────────

alter table public.marketplace_items
  add constraint marketplace_items_name_unique unique (name);


-- ── 6. SEED MARKETPLACE ITEMS (idempotent) ───────────────────

insert into public.marketplace_items
  (name, description, price, icon, effect_type, effect_config, sort_order)
values
  (
    'Extra Notification',
    'Send partner an additional ping today beyond the daily limit',
    10, '🔔', 'extra_ping',
    '{"extra_sends": 1}'::jsonb,
    1
  ),
  (
    'Movie Night Veto',
    'You pick tonight''s movie, no arguments. Partner gets a VETO! notification.',
    25, '🎬', 'veto',
    '{"requires_input": true, "input_prompt": "What movie?"}'::jsonb,
    2
  ),
  (
    'Breakfast in Bed',
    'Partner must make you breakfast tomorrow. Creates a task order with a deadline.',
    40, '🍳', 'task_order',
    '{"deadline_hours": 24, "task_description": "Make breakfast in bed"}'::jsonb,
    3
  ),
  (
    '1 Hour of Silence',
    'A playful DND token. Both apps show a countdown timer. Symbolic and fun.',
    15, '🤫', 'dnd_timer',
    '{"duration_minutes": 60}'::jsonb,
    4
  ),
  (
    'Wildcard Favor',
    'An open-ended favor. Write what you want, partner can accept or negotiate.',
    50, '🃏', 'wildcard',
    '{"requires_input": true, "input_prompt": "What''s your wish?", "negotiable": true}'::jsonb,
    5
  )
on conflict (name) do nothing;
