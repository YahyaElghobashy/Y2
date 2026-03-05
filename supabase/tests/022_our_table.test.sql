-- ============================================================
-- T1301 Verification: Our Table Migration
-- Run in Supabase SQL Editor to verify migration applied correctly.
-- ============================================================

-- 1. Tables exist with correct columns
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'food_visits'
order by ordinal_position;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'food_ratings'
order by ordinal_position;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'food_photos'
order by ordinal_position;

-- 2. CHECK constraints exist
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.food_visits'::regclass
  and contype = 'c';

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.food_ratings'::regclass
  and contype = 'c';

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.food_photos'::regclass
  and contype = 'c';

-- 3. UNIQUE constraint on food_ratings (visit_id, user_id)
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.food_ratings'::regclass
  and contype = 'u';

-- 4. Indexes exist
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('food_visits', 'food_ratings', 'food_photos')
order by tablename, indexname;

-- 5. Triggers exist
select trigger_name, event_manipulation, event_object_table, action_statement
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in ('food_visits', 'food_ratings')
order by event_object_table, trigger_name;

-- 6. RLS is enabled on all 3 tables
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('food_visits', 'food_ratings', 'food_photos');

-- 7. RLS policies exist
select tablename, policyname, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('food_visits', 'food_ratings', 'food_photos')
order by tablename, policyname;

-- 8. Generated column exists on food_ratings
select column_name, generation_expression
from information_schema.columns
where table_schema = 'public'
  and table_name = 'food_ratings'
  and is_generated = 'ALWAYS';

-- 9. Storage bucket exists
select id, name, public, file_size_limit
from storage.buckets
where id = 'food-photos';

-- 10. Realtime enabled
select * from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename in ('food_visits', 'food_ratings', 'food_photos');
