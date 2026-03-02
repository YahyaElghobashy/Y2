# T401: Push Notifications Database Migration — Build Plan

## Overview

Create the Supabase migration for push notifications infrastructure: 3 tables (`push_subscriptions`, `notifications`, `daily_send_limits`), RLS policies, and the `get_or_create_daily_limit` function.

## Files to Create

| File | Purpose |
|---|---|
| `supabase/migrations/003_notifications.sql` | Migration: 3 tables, RLS, function |
| `supabase/tests/003_notifications_checks.sql` | Manual verification SQL checklist |

## Files to Modify

| File | Change |
|---|---|
| `docs/TASK_LOG.md` | Add T401 completion row |

## Dependencies on Existing Code

- `001_auth_profiles.sql` — `public.profiles` table (all FKs reference `profiles.id`)
- `001_auth_profiles.sql` — `public.set_updated_at()` function (reused for `push_subscriptions` trigger)
- `002_coyyns.sql` — `coyyns_transactions` table (bonus sends purchase inserts a row with `category = 'notification_purchase'` — app-layer link, no schema dependency)

## Schema Details

### Table 1: `push_subscriptions`
- Columns: `id` (uuid PK), `user_id` (uuid FK→profiles), `subscription` (jsonb), `device_name` (text), `created_at`, `updated_at`
- Unique: `(user_id, subscription)`
- Index: `user_id`
- Trigger: reuses `set_updated_at()`
- RLS: 4 policies — own read, own insert, own update, own delete

### Table 2: `notifications`
- Columns: `id` (uuid PK), `sender_id` (uuid FK→profiles), `recipient_id` (uuid FK→profiles), `title` (text), `body` (text), `emoji` (text), `type` (text, check), `status` (text, check), `metadata` (jsonb), `created_at`
- Indexes: `(recipient_id, created_at desc)`, `(sender_id, created_at desc)`
- RLS: 3 policies — own insert (sender), sender read, recipient read
- No UPDATE/DELETE from client

### Table 3: `daily_send_limits`
- Columns: `id` (uuid PK), `user_id` (uuid FK→profiles), `date` (date), `free_sends_used` (int), `bonus_sends_used` (int), `bonus_sends_available` (int)
- Unique: `(user_id, date)`
- Index: `user_id`
- RLS: 2 policies — own read, own update
- No INSERT from client (only via function)

### Function: `get_or_create_daily_limit(p_user_id uuid)`
- Returns `daily_send_limits` row for today
- Creates with defaults if missing
- `security definer` + `set search_path = public`
- Uses `on conflict do nothing` for race safety

## Design Tokens Referenced

N/A — this is a pure SQL migration with no UI components.

## Test Cases (Verification SQL)

1. All three tables exist with correct columns
2. RLS enabled on all three tables
3. Correct policies exist (4 + 3 + 2 = 9 total)
4. `get_or_create_daily_limit` function exists as DEFINER
5. Unique constraints exist
6. Function creates row on first call (idempotent)
7. Duplicate call returns same row
8. Notification insert with defaults works
9. Status update by service role works
10. Cleanup test data

## Potential Issues / Edge Cases

- Migration must run strictly after 001 (FK dependencies)
- `set_updated_at()` must already exist (defined in 001)
- `UNIQUE(user_id, subscription)` on jsonb — Postgres supports this via hash comparison
- `get_or_create_daily_limit` race condition handled by `on conflict do nothing` + re-select
- No `updated_at` on `notifications` or `daily_send_limits` — intentional (notifications are immutable from client, limits only have integer increments)
