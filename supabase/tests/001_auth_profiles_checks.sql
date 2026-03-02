-- ============================================================
-- T201: Auth Profiles — Verification Checks
-- Run these queries after migration to verify correctness.
-- Execute in the Supabase SQL Editor (service role context).
-- ============================================================


-- ── 1. Table exists and has all columns ──────────────────────
-- Expected: 8 rows — id, display_name, email, avatar_url,
--           partner_id, role, created_at, updated_at

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;


-- ── 2. RLS is enabled ────────────────────────────────────────
-- Expected: relrowsecurity = true

select relrowsecurity
from pg_class
where relname = 'profiles' and relnamespace = 'public'::regnamespace;


-- ── 3. Policies exist ────────────────────────────────────────
-- Expected: 3 rows
--   profiles: own read    (SELECT)
--   profiles: own update  (UPDATE)
--   profiles: partner read (SELECT)

select policyname, cmd
from pg_policies
where tablename = 'profiles'
order by policyname;


-- ── 4. Trigger exists on auth.users ──────────────────────────
-- Expected: 1 row — on_auth_user_created, INSERT, users

select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'on_auth_user_created';


-- ── 5. updated_at trigger exists on profiles ─────────────────
-- Expected: 1 row — profiles_set_updated_at, UPDATE, profiles

select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'profiles_set_updated_at';


-- ── 6. Partner link is bidirectional (after seed) ────────────
-- Expected: 2 rows — (Yahya, Yara) and (Yara, Yahya)

select
  a.display_name as user_name,
  b.display_name as partner_name
from public.profiles a
join public.profiles b on a.partner_id = b.id;


-- ── 7. No profiles without a display_name ────────────────────
-- Expected: 0

select count(*) from public.profiles where display_name is null or display_name = '';


-- ── 8. Index exists on partner_id ────────────────────────────
-- Expected: 1 row — profiles_partner_id_idx

select indexname
from pg_indexes
where tablename = 'profiles' and indexname = 'profiles_partner_id_idx';


-- ============================================================
-- Manual Dashboard Checks (not scriptable):
--
-- 1. Log in as Yahya →
--    select * from profiles;
--    Expected: exactly 2 rows (own + partner)
--
-- 2. Log in as Yara →
--    select * from profiles;
--    Expected: exactly 2 rows (own + partner)
--
-- 3. As either user, attempt:
--    delete from profiles where id = auth.uid();
--    Expected: policy violation error (no DELETE policy)
--
-- 4. As either user, attempt:
--    insert into profiles (id, display_name, email)
--    values (gen_random_uuid(), 'Hacker', 'h@x.com');
--    Expected: policy violation error (no INSERT policy)
-- ============================================================
