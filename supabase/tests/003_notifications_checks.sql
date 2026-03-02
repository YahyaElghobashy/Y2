-- ============================================================
-- T401: Push Notifications — Verification Checks
-- Run after migration and seed to verify correctness
-- ============================================================


-- 1. All three tables exist with correct columns

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'push_subscriptions'
order by ordinal_position;
-- Expected columns: id, user_id, subscription, device_name, created_at, updated_at

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'notifications'
order by ordinal_position;
-- Expected columns: id, sender_id, recipient_id, title, body, emoji, type, status, metadata, created_at

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'daily_send_limits'
order by ordinal_position;
-- Expected columns: id, user_id, date, free_sends_used, bonus_sends_used, bonus_sends_available


-- 2. RLS is enabled on all three tables

select relname, relrowsecurity
from pg_class
where relname in ('push_subscriptions', 'notifications', 'daily_send_limits')
  and relnamespace = 'public'::regnamespace;
-- Expected: all three rows show relrowsecurity = true


-- 3. Correct policies exist

select tablename, policyname, cmd
from pg_policies
where tablename in ('push_subscriptions', 'notifications', 'daily_send_limits')
order by tablename, policyname;
-- Expected push_subscriptions: 4 policies (own read, own insert, own update, own delete)
-- Expected notifications: 3 policies (own insert, sender read, recipient read)
-- Expected daily_send_limits: 2 policies (own read, own update)


-- 4. get_or_create_daily_limit function exists

select routine_name, routine_type, security_type
from information_schema.routines
where routine_schema = 'public' and routine_name = 'get_or_create_daily_limit';
-- Expected: 1 row, FUNCTION, DEFINER


-- 5. Unique constraints exist

select conname, contype, conrelid::regclass
from pg_constraint
where conname in (
  'push_subscriptions_user_device_unique',
  'daily_send_limits_user_date_unique'
);
-- Expected: 2 rows, both contype = 'u' (unique)


-- 6. get_or_create_daily_limit creates a row on first call

select public.get_or_create_daily_limit(
  (select id from public.profiles where display_name = 'Yahya')
);
-- Expected: returns a row with free_sends_used = 0, bonus_sends_available = 0, date = today


-- 7. Calling it twice on the same day returns the same row (no duplicate)

select public.get_or_create_daily_limit(
  (select id from public.profiles where display_name = 'Yahya')
);
-- Expected: returns the same row as above (idempotent)

select count(*)
from public.daily_send_limits
where user_id = (select id from public.profiles where display_name = 'Yahya')
  and date = current_date;
-- Expected: 1 (not 2)


-- 8. Notification insert flow (run as service role / seed test)

insert into public.notifications (sender_id, recipient_id, title, body, emoji, type)
select
  p1.id, p2.id, 'Test notification', 'Hello from the test suite', '🧪', 'custom'
from public.profiles p1, public.profiles p2
where p1.display_name = 'Yahya' and p2.display_name = 'Yara';
-- Expected: 1 row inserted, status defaults to 'sent'

select id, title, status, metadata
from public.notifications
where title = 'Test notification';
-- Expected: 1 row with status = 'sent', metadata = '{}'


-- 9. Status update by service role

update public.notifications
set status = 'delivered'
where title = 'Test notification';
-- Expected: 1 row updated (service role bypasses RLS)


-- 10. Clean up test data

delete from public.notifications where title = 'Test notification';
delete from public.daily_send_limits
where user_id = (select id from public.profiles where display_name = 'Yahya')
  and date = current_date;
