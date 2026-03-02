-- ============================================================
-- T501: Cycle Tracker — Verification Checks
-- Run after migration 004 to verify correctness.
--
-- IMPORTANT: Run each verification block while authenticated as
-- the appropriate user (Yahya or Yara) to confirm RLS behavior.
-- ============================================================


-- ── 1. Both tables exist with correct columns ─────────────────
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('cycle_config', 'cycle_logs')
order by table_name, ordinal_position;
-- Expected: cycle_config has 9 columns, cycle_logs has 7 columns


-- ── 2. RLS is enabled on both tables ──────────────────────────
select relname, relrowsecurity
from pg_class
where relname in ('cycle_config', 'cycle_logs')
  and relnamespace = 'public'::regnamespace;
-- Expected: both rows show relrowsecurity = true


-- ── 3. Correct policies exist on cycle_config ─────────────────
select policyname, cmd
from pg_policies
where tablename = 'cycle_config'
order by policyname;
-- Expected: 3 rows
--   cycle_config: owner insert  (INSERT)
--   cycle_config: owner select  (SELECT)
--   cycle_config: owner update  (UPDATE)
-- VERIFY: no policy with cmd = 'ALL' that would grant partner access
-- VERIFY: no DELETE policy exists


-- ── 4. Correct policies exist on cycle_logs ───────────────────
select policyname, cmd
from pg_policies
where tablename = 'cycle_logs'
order by policyname;
-- Expected: 4 rows
--   cycle_logs: owner delete  (DELETE)
--   cycle_logs: owner insert  (INSERT)
--   cycle_logs: owner select  (SELECT)
--   cycle_logs: owner update  (UPDATE)
-- VERIFY: no policy with cmd = 'ALL' that would grant partner access


-- ── 5. UNIQUE constraint on cycle_config.owner_id ─────────────
select constraint_name, constraint_type
from information_schema.table_constraints
where table_name = 'cycle_config'
  and constraint_type = 'UNIQUE';
-- Expected: 1 row for owner_id unique constraint


-- ── 6. UNIQUE constraint on cycle_logs (owner_id, date) ───────
select constraint_name, constraint_type
from information_schema.table_constraints
where table_name = 'cycle_logs'
  and constraint_type = 'UNIQUE';
-- Expected: 1 row for (owner_id, date) composite unique constraint


-- ── 7. Updated_at trigger exists on cycle_config ──────────────
select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'cycle_config_set_updated_at';
-- Expected: 1 row, UPDATE, cycle_config


-- ── 8. CHECK constraint on cycle_logs.mood ────────────────────
select constraint_name, check_clause
from information_schema.check_constraints
where constraint_name like '%cycle_logs%mood%';
-- Expected: constraint allowing only: good, neutral, sensitive, difficult, null


-- ── 9. Index exists on cycle_logs (owner_id, date desc) ───────
select indexname, indexdef
from pg_indexes
where tablename = 'cycle_logs'
  and indexname = 'cycle_logs_owner_date_idx';
-- Expected: 1 row with (owner_id, date DESC)


-- ── 10. Foreign keys reference profiles(id) with CASCADE ──────
select
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.referential_constraints rc
  on tc.constraint_name = rc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_name in ('cycle_config', 'cycle_logs')
  and kcu.column_name = 'owner_id';
-- Expected: 2 rows, both with delete_rule = 'CASCADE'


-- ============================================================
-- MANUAL RLS VERIFICATION
-- ============================================================
--
-- Run these in the Supabase SQL editor, switching auth context.
--
-- ── Authenticated as Yahya ─────────────────────────────────
-- 1. INSERT into cycle_config:
--    insert into cycle_config (owner_id, pill_start_date)
--    values (auth.uid(), '2026-03-01');
--    → Expected: SUCCESS, 1 row inserted
--
-- 2. SELECT from cycle_config:
--    select * from cycle_config;
--    → Expected: 1 row (the one just inserted)
--
-- 3. UPDATE cycle_config:
--    update cycle_config set active_days = 24 where owner_id = auth.uid();
--    → Expected: SUCCESS, 1 row updated
--
-- 4. INSERT into cycle_logs:
--    insert into cycle_logs (owner_id, date, mood, notes)
--    values (auth.uid(), '2026-03-01', 'good', 'All good today');
--    → Expected: SUCCESS, 1 row inserted
--
-- 5. SELECT from cycle_logs:
--    select * from cycle_logs;
--    → Expected: 1 row
--
-- ── Authenticated as Yara ──────────────────────────────────
-- 6. SELECT from cycle_config:
--    select * from cycle_config;
--    → Expected: 0 rows, NO error
--
-- 7. SELECT from cycle_logs:
--    select * from cycle_logs;
--    → Expected: 0 rows, NO error
--
-- 8. INSERT into cycle_config with Yahya's owner_id:
--    insert into cycle_config (owner_id, pill_start_date)
--    values ('<yahya_uuid>', '2026-03-01');
--    → Expected: FAIL — RLS with check rejects auth.uid() != owner_id
--
-- 9. INSERT into cycle_logs with Yahya's owner_id:
--    insert into cycle_logs (owner_id, date, mood)
--    values ('<yahya_uuid>', '2026-03-01', 'good');
--    → Expected: FAIL — RLS with check rejects auth.uid() != owner_id
--
-- ============================================================
