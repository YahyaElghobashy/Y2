-- ============================================================
-- T301: CoYYns Migration — Verification Checks
-- Run these queries after migration to verify correctness.
-- Execute in the Supabase SQL Editor (service role context).
-- ============================================================


-- ── 1. Wallets table exists with correct columns ─────────────
-- Expected: 7 rows — id, user_id, balance, lifetime_earned,
--           lifetime_spent, created_at, updated_at

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'coyyns_wallets'
order by ordinal_position;


-- ── 2. Transactions table exists with correct columns ────────
-- Expected: 8 rows — id, user_id, amount, type, category,
--           description, metadata, created_at

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'coyyns_transactions'
order by ordinal_position;


-- ── 3. RLS is enabled on both tables ─────────────────────────
-- Expected: both rows show relrowsecurity = true

select relname, relrowsecurity
from pg_class
where relname in ('coyyns_wallets', 'coyyns_transactions')
  and relnamespace = 'public'::regnamespace;


-- ── 4. Correct policies exist ────────────────────────────────
-- Expected wallets: 2 SELECT policies (own read, partner read)
-- Expected transactions: 1 SELECT policy (own read), 1 INSERT policy (own insert)

select tablename, policyname, cmd
from pg_policies
where tablename in ('coyyns_wallets', 'coyyns_transactions')
order by tablename, policyname;


-- ── 5. Balance trigger exists ────────────────────────────────
-- Expected: 1 row — on_coyyn_transaction_insert, INSERT, coyyns_transactions

select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'on_coyyn_transaction_insert';


-- ── 6. Updated_at trigger exists on wallets ──────────────────
-- Expected: 1 row — coyyns_wallets_set_updated_at, UPDATE, coyyns_wallets

select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'coyyns_wallets_set_updated_at';


-- ── 7. Indexes exist ─────────────────────────────────────────
-- Expected: 3 rows — coyyns_wallets_user_id_idx,
--   coyyns_transactions_user_id_created_at_idx,
--   coyyns_transactions_category_idx

select indexname
from pg_indexes
where tablename in ('coyyns_wallets', 'coyyns_transactions')
  and indexname not like '%pkey'
order by indexname;


-- ── 8. Seed wallets exist with zero balance ──────────────────
-- Expected: 2 rows — Yahya (0, 0, 0) and Yara (0, 0, 0)

select u.display_name, w.balance, w.lifetime_earned, w.lifetime_spent
from public.coyyns_wallets w
join public.profiles u on u.id = w.user_id
order by u.display_name;


-- ── 9. Earn transaction increases balance correctly ──────────
-- Insert 100 CoYYns for Yahya

insert into public.coyyns_transactions (user_id, amount, type, category, description)
select id, 100, 'earn', 'manual', 'test earn'
from public.profiles where display_name = 'Yahya';

select balance, lifetime_earned, lifetime_spent
from public.coyyns_wallets w
join public.profiles p on p.id = w.user_id
where p.display_name = 'Yahya';
-- Expected: balance = 100, lifetime_earned = 100, lifetime_spent = 0


-- ── 10. Spend transaction decreases balance correctly ────────
-- Spend 30 CoYYns for Yahya

insert into public.coyyns_transactions (user_id, amount, type, category, description)
select id, -30, 'spend', 'manual', 'test spend'
from public.profiles where display_name = 'Yahya';

select balance, lifetime_earned, lifetime_spent
from public.coyyns_wallets w
join public.profiles p on p.id = w.user_id
where p.display_name = 'Yahya';
-- Expected: balance = 70, lifetime_earned = 100, lifetime_spent = 30


-- ── 11. Overspend is rejected ────────────────────────────────
-- Attempt to spend 9999 CoYYns (should fail with CHECK violation)

insert into public.coyyns_transactions (user_id, amount, type, category, description)
select id, -9999, 'spend', 'manual', 'should fail'
from public.profiles where display_name = 'Yahya';
-- Expected: ERROR 23514 (check_violation) — transaction is rolled back


-- ── 12. Balance unchanged after rejected spend ───────────────
-- Expected: still 70

select balance from public.coyyns_wallets w
join public.profiles p on p.id = w.user_id
where p.display_name = 'Yahya';


-- ── 13. Type/amount sign mismatch is rejected ────────────────
-- Earn with negative amount should fail

insert into public.coyyns_transactions (user_id, amount, type, category, description)
select id, -50, 'earn', 'manual', 'should fail — wrong sign'
from public.profiles where display_name = 'Yahya';
-- Expected: ERROR — Earn transactions must have a positive amount

-- Spend with positive amount should fail

insert into public.coyyns_transactions (user_id, amount, type, category, description)
select id, 50, 'spend', 'manual', 'should fail — wrong sign'
from public.profiles where display_name = 'Yahya';
-- Expected: ERROR — Spend transactions must have a negative amount


-- ── 14. Zero amount earn is rejected ─────────────────────────

insert into public.coyyns_transactions (user_id, amount, type, category, description)
select id, 0, 'earn', 'manual', 'should fail — zero'
from public.profiles where display_name = 'Yahya';
-- Expected: ERROR — Earn transactions must have a positive amount


-- ── 15. Clean up test transactions ───────────────────────────
-- Note: in production, transactions are immutable — this is test cleanup only.
-- Deleting transactions does NOT reverse the wallet balance.
-- After cleanup, manually reset the wallet or re-run seed.

delete from public.coyyns_transactions where description like 'test %';

-- Reset Yahya's wallet to zero for clean state
update public.coyyns_wallets
set balance = 0, lifetime_earned = 0, lifetime_spent = 0
where user_id = (select id from public.profiles where display_name = 'Yahya');


-- ============================================================
-- Manual Dashboard Checks (not scriptable):
--
-- 1. Log in as Yahya →
--    select * from coyyns_wallets;
--    Expected: 1 row (own wallet)
--
-- 2. Log in as Yahya →
--    select * from coyyns_wallets where user_id = '<yara_uuid>';
--    Expected: 1 row (partner read policy allows it)
--
-- 3. Log in as Yahya →
--    select * from coyyns_transactions where user_id = '<yara_uuid>';
--    Expected: 0 rows (no partner transaction access)
--
-- 4. Log in as Yahya →
--    update coyyns_wallets set balance = 9999 where user_id = '<yahya_uuid>';
--    Expected: policy violation error (no UPDATE policy)
--
-- 5. Log in as Yahya →
--    delete from coyyns_wallets;
--    Expected: policy violation error (no DELETE policy)
--
-- 6. Log in as Yahya →
--    delete from coyyns_transactions;
--    Expected: policy violation error (no DELETE policy)
-- ============================================================
