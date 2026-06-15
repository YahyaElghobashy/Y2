-- ============================================================
-- T3: Realtime for the CoYYns love-economy loop
-- Adds the love-economy tables to the supabase_realtime publication
-- so the partner sees incoming purchases and balance changes live.
--
-- Depends on: 002_coyyns.sql (coyyns_wallets, coyyns_transactions)
--             011_marketplace.sql (purchases)
--
-- Without this, the realtime subscriptions in use-active-purchases.ts
-- and use-coyyns.ts silently never fire (tables not in the publication).
-- ============================================================

-- ── 1. REPLICA IDENTITY ──────────────────────────────────────
-- FULL replica identity makes UPDATE payloads carry the full new row so
-- client-side filters (e.g. user_id=eq.X) match reliably for postgres_changes.

alter table public.purchases          replica identity full;
alter table public.coyyns_wallets     replica identity full;
alter table public.coyyns_transactions replica identity full;

-- ── 2. ADD TABLES TO supabase_realtime PUBLICATION ───────────
-- Idempotent: only add a table if it is not already a member of the
-- publication, so re-running the migration never errors.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'purchases'
  ) then
    alter publication supabase_realtime add table public.purchases;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'coyyns_wallets'
  ) then
    alter publication supabase_realtime add table public.coyyns_wallets;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'coyyns_transactions'
  ) then
    alter publication supabase_realtime add table public.coyyns_transactions;
  end if;
end
$$;
