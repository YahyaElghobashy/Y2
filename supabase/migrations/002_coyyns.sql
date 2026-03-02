-- ============================================================
-- T301: CoYYns Database Migration
-- Creates wallets, transactions, RLS, balance trigger, and seed
-- Depends on: 001_auth_profiles.sql (profiles table must exist)
-- ============================================================


-- ── 1. COYYNS WALLETS TABLE ───────────────────────────────────

create table public.coyyns_wallets (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null unique references public.profiles (id) on delete cascade,
  balance          integer     not null default 0 check (balance >= 0),
  lifetime_earned  integer     not null default 0 check (lifetime_earned >= 0),
  lifetime_spent   integer     not null default 0 check (lifetime_spent >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Index on user_id for fast wallet lookups by authenticated user
create index coyyns_wallets_user_id_idx on public.coyyns_wallets (user_id);

comment on table public.coyyns_wallets is
  'One row per user. Stores current CoYYns balance and lifetime earn/spend totals. Balance is maintained exclusively by trigger — never write directly from client.';
comment on column public.coyyns_wallets.balance is
  'Current spendable balance. Always >= 0. Written only by handle_coyyn_transaction trigger.';
comment on column public.coyyns_wallets.lifetime_earned is
  'Cumulative total CoYYns earned across all time. Never decreases.';
comment on column public.coyyns_wallets.lifetime_spent is
  'Cumulative total CoYYns spent across all time. Never decreases.';


-- ── 2. COYYNS TRANSACTIONS TABLE ─────────────────────────────

create table public.coyyns_transactions (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  amount       integer     not null,
  type         text        not null check (type in ('earn', 'spend')),
  category     text        not null,
  description  text,
  metadata     jsonb       not null default '{}',
  created_at   timestamptz not null default now()
);

-- Index on user_id for fetching a user's transaction history in order
create index coyyns_transactions_user_id_created_at_idx
  on public.coyyns_transactions (user_id, created_at desc);

-- Index on category for analytics queries (most common earn/spend sources)
create index coyyns_transactions_category_idx on public.coyyns_transactions (category);

comment on table public.coyyns_transactions is
  'Immutable ledger of all CoYYns earn and spend events. Positive amount for earn, negative for spend. Source of truth for balance.';
comment on column public.coyyns_transactions.amount is
  'Positive integer for earn events, negative integer for spend events. The trigger uses sign to determine direction.';
comment on column public.coyyns_transactions.type is
  'earn or spend. Must match the sign of amount — earn must be positive, spend must be negative.';
comment on column public.coyyns_transactions.category is
  'Machine-readable source of the transaction. E.g. manual, challenge, marketplace_purchase, notification_purchase, check_in, coupon_redeem.';
comment on column public.coyyns_transactions.metadata is
  'Flexible JSON bag for extra context. E.g. { "challenge_id": "...", "item_name": "..." }. Never required, always safe to be empty.';


-- ── 3. UPDATED_AT TRIGGER FOR WALLETS ────────────────────────

create trigger coyyns_wallets_set_updated_at
  before update on public.coyyns_wallets
  for each row
  execute function public.set_updated_at();
-- Note: set_updated_at() was defined in 001_auth_profiles.sql and is reused here.


-- ── 4. BALANCE TRIGGER ───────────────────────────────────────
-- Fires on every INSERT to coyyns_transactions.
-- Updates the wallet row for the transacting user.
-- This is the ONLY place balance is ever modified.

create or replace function public.handle_coyyn_transaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Validate: earn transactions must have positive amount
  if new.type = 'earn' and new.amount <= 0 then
    raise exception 'Earn transactions must have a positive amount. Got: %', new.amount;
  end if;

  -- Validate: spend transactions must have negative amount
  if new.type = 'spend' and new.amount >= 0 then
    raise exception 'Spend transactions must have a negative amount. Got: %', new.amount;
  end if;

  -- Upsert the wallet row (handles the case where a wallet doesn't exist yet,
  -- though wallets are seeded at user creation time)
  insert into public.coyyns_wallets (user_id, balance, lifetime_earned, lifetime_spent)
  values (new.user_id, 0, 0, 0)
  on conflict (user_id) do nothing;

  if new.type = 'earn' then
    update public.coyyns_wallets
    set
      balance         = balance + new.amount,
      lifetime_earned = lifetime_earned + new.amount
    where user_id = new.user_id;
  else
    -- spend: amount is negative, so we subtract abs(amount) from balance
    -- The CHECK (balance >= 0) constraint on the table will reject this
    -- UPDATE if it would drive balance below zero, rolling back the transaction.
    update public.coyyns_wallets
    set
      balance        = balance + new.amount,   -- new.amount is negative
      lifetime_spent = lifetime_spent + abs(new.amount)
    where user_id = new.user_id;
  end if;

  return new;
end;
$$;

create trigger on_coyyn_transaction_insert
  after insert on public.coyyns_transactions
  for each row
  execute function public.handle_coyyn_transaction();


-- ── 5. ROW LEVEL SECURITY — WALLETS ──────────────────────────

alter table public.coyyns_wallets enable row level security;

-- Policy: users can read their own wallet
create policy "coyyns_wallets: own read"
  on public.coyyns_wallets
  for select
  using (auth.uid() = user_id);

-- Policy: users can read their partner's wallet (for /us page balance display)
create policy "coyyns_wallets: partner read"
  on public.coyyns_wallets
  for select
  using (
    user_id = (
      select partner_id
      from public.profiles
      where id = auth.uid()
    )
  );

-- No INSERT policy from client — wallets are seeded at migration time and
-- auto-created by the trigger if missing. Clients never insert wallet rows.
-- No UPDATE policy from client — balance is maintained exclusively by trigger.
-- No DELETE policy — wallets are permanent.


-- ── 6. ROW LEVEL SECURITY — TRANSACTIONS ─────────────────────

alter table public.coyyns_transactions enable row level security;

-- Policy: users can read their own transactions
create policy "coyyns_transactions: own read"
  on public.coyyns_transactions
  for select
  using (auth.uid() = user_id);

-- Policy: users can insert transactions for themselves only
create policy "coyyns_transactions: own insert"
  on public.coyyns_transactions
  for insert
  with check (auth.uid() = user_id);

-- No UPDATE policy — the ledger is immutable. Transactions are never edited.
-- No DELETE policy — the ledger is append-only.
-- Note: Partners cannot read each other's transactions (only balances via wallets).
-- If a "shared history" feed is needed in the future, add a partner read policy here.


-- ── 7. SEED DATA ─────────────────────────────────────────────
-- Creates a wallet row for each of the two pre-seeded users.
-- Uses the same placeholder UUIDs as 001_auth_profiles.sql.
-- Replace with the same real UUIDs you used in that migration.
--
-- This seed is safe to run after 001_auth_profiles.sql seed has been run
-- (i.e., after both profile rows exist in public.profiles).

do $$
declare
  yahya_id uuid := '00000000-0000-0000-0000-000000000001'; -- REPLACE with real UUID
  yara_id  uuid := '00000000-0000-0000-0000-000000000002'; -- REPLACE with real UUID
begin
  -- Insert wallets for both users (balance starts at 0)
  insert into public.coyyns_wallets (user_id, balance, lifetime_earned, lifetime_spent)
  values
    (yahya_id, 0, 0, 0),
    (yara_id,  0, 0, 0)
  on conflict (user_id) do nothing;
end;
$$;
