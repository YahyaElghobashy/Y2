-- ============================================================
-- T601: Love Coupons — Verification Checks
-- Run after migration 005_coupons.sql to verify correctness
-- ============================================================


-- 1. Tables exist with correct columns

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'coupons'
order by ordinal_position;
-- Expected: id, creator_id, recipient_id, title, description, emoji,
--   category, image_url, status, is_surprise, surprise_revealed,
--   redeemed_at, approved_at, rejected_at, rejection_reason, expires_at,
--   created_at, updated_at

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'coupon_history'
order by ordinal_position;
-- Expected: id, coupon_id, action, actor_id, note, created_at


-- 2. RLS is enabled on both tables

select relname, relrowsecurity
from pg_class
where relname in ('coupons', 'coupon_history')
  and relnamespace = 'public'::regnamespace;
-- Expected: both rows have relrowsecurity = true


-- 3. All policies exist

select tablename, policyname, cmd
from pg_policies
where tablename in ('coupons', 'coupon_history')
order by tablename, policyname;
-- Expected for coupons:
--   coupons: creator insert (INSERT)
--   coupons: creator read (SELECT)
--   coupons: creator update (UPDATE)
--   coupons: recipient read (non-surprise) (SELECT)
--   coupons: recipient update (redeem) (UPDATE)
-- Expected for coupon_history:
--   coupon_history: actor insert (INSERT)
--   coupon_history: creator or recipient read (SELECT)


-- 4. Auto-history trigger exists

select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'on_coupon_created';
-- Expected: 1 row, INSERT, coupons


-- 5. Updated_at trigger exists

select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'coupons_set_updated_at';
-- Expected: 1 row, UPDATE, coupons


-- 6. Check constraints exist

select conname, contype
from pg_constraint
where conrelid = 'public.coupons'::regclass
  and contype = 'c'
order by conname;
-- Expected: coupons_category_check, coupons_no_self_gift,
--   coupons_reveal_requires_surprise, coupons_status_check


-- 7. Indexes exist

select indexname
from pg_indexes
where tablename = 'coupons' and schemaname = 'public'
order by indexname;
-- Expected: coupons_creator_id_idx, coupons_expires_at_idx,
--   coupons_pkey, coupons_recipient_id_idx, coupons_status_idx

select indexname
from pg_indexes
where tablename = 'coupon_history' and schemaname = 'public'
order by indexname;
-- Expected: coupon_history_actor_id_idx, coupon_history_coupon_id_idx,
--   coupon_history_pkey


-- 8. Functional test: insert a coupon and verify history is auto-created
-- (Run as service role / SQL editor in Supabase dashboard)

insert into public.coupons (creator_id, recipient_id, title)
values (
  '00000000-0000-0000-0000-000000000001',  -- Yahya UUID
  '00000000-0000-0000-0000-000000000002',  -- Yara UUID
  'Test coupon — delete me'
);

select action, actor_id from public.coupon_history
where coupon_id = (
  select id from public.coupons where title = 'Test coupon — delete me'
);
-- Expected: 1 row, action = 'created', actor_id = Yahya UUID


-- 9. Verify surprise coupon is invisible to recipient via RLS
-- (Run as Yahya)

insert into public.coupons (creator_id, recipient_id, title, is_surprise)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Secret surprise coupon',
  true
);
-- (Switch session to Yara, then run:)
select count(*) from public.coupons where title = 'Secret surprise coupon';
-- Expected: 0  (Yara cannot see it)

-- (Switch session back to Yahya, reveal it:)
update public.coupons
set surprise_revealed = true
where title = 'Secret surprise coupon';
-- (Switch session to Yara, then run:)
select count(*) from public.coupons where title = 'Secret surprise coupon';
-- Expected: 1  (now Yara can see it)


-- 10. Constraint tests (should fail)

-- Self-gift should fail:
-- insert into public.coupons (creator_id, recipient_id, title)
-- values ('00000000-0000-0000-0000-000000000001',
--         '00000000-0000-0000-0000-000000000001',
--         'Self gift');
-- Expected: ERROR violates check constraint "coupons_no_self_gift"

-- Invalid status should fail:
-- insert into public.coupons (creator_id, recipient_id, title, status)
-- values ('00000000-0000-0000-0000-000000000001',
--         '00000000-0000-0000-0000-000000000002',
--         'Bad status', 'invalid');
-- Expected: ERROR violates check constraint "coupons_status_check"

-- Invalid category should fail:
-- insert into public.coupons (creator_id, recipient_id, title, category)
-- values ('00000000-0000-0000-0000-000000000001',
--         '00000000-0000-0000-0000-000000000002',
--         'Bad category', 'invalid');
-- Expected: ERROR violates check constraint "coupons_category_check"

-- surprise_revealed without is_surprise should fail:
-- insert into public.coupons (creator_id, recipient_id, title, is_surprise, surprise_revealed)
-- values ('00000000-0000-0000-0000-000000000001',
--         '00000000-0000-0000-0000-000000000002',
--         'Bad reveal', false, true);
-- Expected: ERROR violates check constraint "coupons_reveal_requires_surprise"

-- Invalid history action should fail:
-- insert into public.coupon_history (coupon_id, action, actor_id)
-- values (gen_random_uuid(), 'invalid_action', '00000000-0000-0000-0000-000000000001');
-- Expected: ERROR violates check constraint "coupon_history_action_check"


-- CLEANUP (run after testing):
-- delete from public.coupons where title in ('Test coupon — delete me', 'Secret surprise coupon');
