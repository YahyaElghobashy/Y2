-- ============================================================
-- 051: Wallet on Signup
-- Auto-create a coyyns_wallets row whenever a profile is created.
--
-- BUG FIXED: Wallet rows were only ever created lazily on a user's
-- FIRST coyyns_transactions insert (via handle_coyyn_transaction in
-- 002_coyyns.sql). A brand-new user — or a partner with 0 CoYYns —
-- had no wallet row at all. The marketplace/wallet hooks fetched the
-- wallet with PostgREST .single(), which returns HTTP 406 on 0 rows,
-- breaking the UI (balance shows 0, buy buttons disabled).
--
-- This migration moves wallet creation to PROFILE-INSERT time (profiles
-- are created on signup via handle_new_user in 001_auth_profiles.sql),
-- so every user has a wallet from the moment they exist. It also
-- backfills wallets for any existing profile that is missing one.
--
-- Depends on: 001_auth_profiles.sql (profiles), 002_coyyns.sql (coyyns_wallets)
-- ============================================================


-- ── 1. WALLET-ON-PROFILE-INSERT FUNCTION ─────────────────────
-- Mirrors the column shape of coyyns_wallets. Idempotent via the
-- UNIQUE (user_id) constraint: on conflict (user_id) do nothing.
-- security definer + pinned search_path matches handle_new_user /
-- handle_coyyn_transaction (002), so it runs regardless of the
-- inserting role and RLS (clients have no INSERT policy on wallets).

create or replace function public.handle_new_profile_wallet()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.coyyns_wallets (user_id, balance, lifetime_earned, lifetime_spent)
  values (new.id, 0, 0, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_profile_wallet is
  'Auto-creates a zeroed coyyns_wallets row when a profile is inserted (signup). Idempotent on conflict (user_id). See migration 051.';


-- ── 2. TRIGGER ON PROFILES INSERT ────────────────────────────
-- Placed on profiles (not auth.users) because profiles is the row
-- created on signup and coyyns_wallets.user_id FKs to profiles(id) —
-- the profile must exist before its wallet can be inserted.

drop trigger if exists on_profile_created_wallet on public.profiles;

create trigger on_profile_created_wallet
  after insert on public.profiles
  for each row
  execute function public.handle_new_profile_wallet();


-- ── 3. BACKFILL EXISTING PROFILES ────────────────────────────
-- Gives every pre-existing profile (e.g. "Yahya") a wallet row.
-- Safe to re-run: NOT EXISTS guard + on conflict do nothing.

insert into public.coyyns_wallets (user_id, balance, lifetime_earned, lifetime_spent)
select p.id, 0, 0, 0
from public.profiles p
where not exists (
  select 1 from public.coyyns_wallets w where w.user_id = p.id
)
on conflict do nothing;
