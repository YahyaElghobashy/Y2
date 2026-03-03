-- ============================================================
-- 008: Fix infinite recursion in "profiles: partner read" RLS
--
-- The old policy subqueried public.profiles to find partner_id,
-- which triggered RLS evaluation on profiles again → infinite loop.
-- Fix: a SECURITY DEFINER helper that bypasses RLS for the lookup.
-- ============================================================


-- ── 1. HELPER FUNCTION ─────────────────────────────────────
-- Returns the current user's partner_id, bypassing RLS.

create or replace function public.get_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select partner_id
  from public.profiles
  where id = auth.uid();
$$;


-- ── 2. FIX profiles: partner read ──────────────────────────

drop policy if exists "profiles: partner read" on public.profiles;

create policy "profiles: partner read"
  on public.profiles for select
  using ( id = public.get_partner_id() );


-- ── 3. FIX coyyns_wallets: partner read ────────────────────
-- Not recursive on its own, but its subquery on profiles would
-- hit the old recursive policy. Using the helper is cleaner.

drop policy if exists "coyyns_wallets: partner read" on public.coyyns_wallets;

create policy "coyyns_wallets: partner read"
  on public.coyyns_wallets for select
  using ( user_id = public.get_partner_id() );
