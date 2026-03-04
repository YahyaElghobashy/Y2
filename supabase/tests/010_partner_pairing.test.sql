-- ============================================================
-- Verification SQL for 010_partner_pairing.sql
-- Run against Supabase SQL editor to validate the migration
-- ============================================================

-- ── 1. VERIFY COLUMNS EXIST ────────────────────────────────

select
  column_name,
  data_type,
  column_default,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('invite_code', 'pairing_status', 'paired_at')
order by column_name;
-- Expected: 3 rows (invite_code text, pairing_status text 'unpaired', paired_at timestamptz)

-- ── 2. VERIFY UNIQUE CONSTRAINT ON invite_code ─────────────

select constraint_name, constraint_type
from information_schema.table_constraints
where table_schema = 'public'
  and table_name = 'profiles'
  and constraint_type = 'UNIQUE';
-- Expected: includes invite_code unique constraint

-- ── 3. VERIFY CHECK CONSTRAINT ON pairing_status ───────────

select constraint_name
from information_schema.check_constraints
where constraint_schema = 'public'
  and constraint_name like '%pairing_status%';
-- Expected: 1 row — CHECK (pairing_status IN ('unpaired', 'invite_sent', 'paired'))

-- ── 4. VERIFY FUNCTIONS EXIST ──────────────────────────────

select routine_name, routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('generate_invite_code', 'set_invite_code', 'pair_partners', 'unpair_partners');
-- Expected: 4 rows

-- ── 5. VERIFY TRIGGER EXISTS ───────────────────────────────

select trigger_name, event_manipulation, action_timing
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table = 'profiles'
  and trigger_name = 'profiles_set_invite_code';
-- Expected: 1 row — BEFORE INSERT

-- ── 6. VERIFY ALL EXISTING PROFILES HAVE invite_code ───────

select count(*) as profiles_without_code
from public.profiles
where invite_code is null;
-- Expected: 0

-- ── 7. VERIFY invite_codes ARE UNIQUE AND 6 CHARS ──────────

select id, invite_code, length(invite_code) as code_length
from public.profiles
where invite_code is not null;
-- Expected: all codes are 6 characters, uppercase alphanumeric

-- ── 8. VERIFY pair_partners FUNCTION SIGNATURE ─────────────

select
  p.proname as function_name,
  pg_catalog.pg_get_function_arguments(p.oid) as arguments,
  pg_catalog.pg_get_function_result(p.oid) as return_type,
  p.prosecdef as is_security_definer
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'pair_partners';
-- Expected: (my_id uuid, partner_code text) → jsonb, security definer = true

-- ── 9. VERIFY INDEX EXISTS ─────────────────────────────────

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'profiles'
  and indexname = 'profiles_invite_code_idx';
-- Expected: 1 row
