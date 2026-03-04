-- ============================================================
-- Verification SQL for 011_marketplace.sql
-- Run against Supabase SQL editor to validate the migration
-- ============================================================

-- ── 1. VERIFY marketplace_items TABLE EXISTS ────────────────

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'marketplace_items'
order by ordinal_position;
-- Expected: 10 columns (id, name, description, price, icon, effect_type, effect_config, is_active, sort_order, created_at)

-- ── 2. VERIFY purchases TABLE EXISTS ────────────────────────

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'purchases'
order by ordinal_position;
-- Expected: 9 columns (id, buyer_id, target_id, item_id, cost, effect_payload, status, created_at, completed_at)

-- ── 3. VERIFY CHECK CONSTRAINTS ─────────────────────────────

select constraint_name
from information_schema.table_constraints
where table_schema = 'public'
  and table_name in ('marketplace_items', 'purchases')
  and constraint_type = 'CHECK';
-- Expected: price > 0, effect_type IN (...), cost > 0, status IN (...), no_self_purchase

-- ── 4. VERIFY RLS ENABLED ──────────────────────────────────

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('marketplace_items', 'purchases');
-- Expected: both have rowsecurity = true

-- ── 5. VERIFY RLS POLICIES ─────────────────────────────────

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('marketplace_items', 'purchases')
order by tablename, policyname;
-- Expected:
--   marketplace_items: 1 SELECT policy (authenticated read)
--   purchases: 5 policies (buyer read, target read, buyer insert, buyer update, target update)

-- ── 6. VERIFY SEED DATA ────────────────────────────────────

select name, price, icon, effect_type, sort_order
from public.marketplace_items
order by sort_order;
-- Expected: 5 rows (Extra Notification, Movie Night Veto, Breakfast in Bed, 1 Hour of Silence, Wildcard Favor)

-- ── 7. VERIFY INDEXES ──────────────────────────────────────

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('marketplace_items', 'purchases')
order by indexname;
-- Expected: marketplace_items_sort_order_idx, purchases_buyer_id_idx, purchases_target_id_idx, purchases_item_id_idx, purchases_status_idx

-- ── 8. VERIFY FOREIGN KEYS ─────────────────────────────────

select
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name = 'purchases';
-- Expected: 3 FKs (buyer_id→profiles, target_id→profiles, item_id→marketplace_items)
