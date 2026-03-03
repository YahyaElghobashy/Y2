-- ============================================================
-- 008: Fix Partner Read RLS — Verification Queries
--
-- Run these against the live database (SQL Editor or Management API)
-- to verify migration 008 was applied correctly.
-- ============================================================


-- 1. Verify get_partner_id() function exists and is SECURITY DEFINER
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'get_partner_id';
-- Expected: 1 row, security_type = 'DEFINER'


-- 2. Verify profiles: partner read policy uses get_partner_id() (no subquery)
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'profiles' AND policyname = 'profiles: partner read';
-- Expected: qual = '(id = get_partner_id())'


-- 3. Verify coyyns_wallets: partner read policy uses get_partner_id()
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'coyyns_wallets' AND policyname = 'coyyns_wallets: partner read';
-- Expected: qual = '(user_id = get_partner_id())'


-- 4. Call get_partner_id() — should not error (returns NULL for service role)
SELECT public.get_partner_id() AS partner_id;
-- Expected: 1 row, partner_id = NULL, NO infinite recursion error


-- 5. Verify policy counts are unchanged
SELECT tablename, count(*) AS cnt
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- Expected: profiles=4, coyyns_wallets=2 (same as before migration 008)
