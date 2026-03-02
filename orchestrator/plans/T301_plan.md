# T301: CoYYns Database Migration — Build Plan

## Overview

Create the Supabase database migration for the CoYYns currency system: wallets table, transactions table (immutable ledger), balance trigger, RLS policies, and seed data.

## Files to Create

| File | Purpose |
|---|---|
| `supabase/migrations/002_coyyns.sql` | Migration: tables, indexes, trigger function, RLS policies, seed |
| `supabase/tests/002_coyyns_checks.sql` | Verification SQL queries to run after migration |

## Files to Modify

| File | Change |
|---|---|
| `docs/TASK_LOG.md` | Add T301 entry |

## Dependencies on Existing Code

- `supabase/migrations/001_auth_profiles.sql` — provides:
  - `public.profiles` table (FK target for `user_id` columns)
  - `public.set_updated_at()` function (reused for wallets `updated_at` trigger)
  - Seed data with placeholder UUIDs `00000000-0000-0000-0000-000000000001` (Yahya) and `00000000-0000-0000-0000-000000000002` (Yara)

## No Design Tokens Needed

This is a pure SQL migration — no UI components, no CSS, no design tokens.

## Migration Structure (002_coyyns.sql)

1. **coyyns_wallets table** — `id`, `user_id` (unique FK → profiles), `balance` (int, CHECK >= 0), `lifetime_earned`, `lifetime_spent`, `created_at`, `updated_at`
2. **Indexes** — `user_id` index on wallets
3. **coyyns_transactions table** — `id`, `user_id` (FK → profiles), `amount` (int), `type` ('earn'|'spend'), `category` (text), `description` (nullable text), `metadata` (jsonb), `created_at`
4. **Indexes** — compound `(user_id, created_at desc)` on transactions, `category` index
5. **updated_at trigger** — reuses `set_updated_at()` from migration 001
6. **handle_coyyn_transaction() function** — security definer, validates type/amount sign match, upserts wallet if missing, updates balance/lifetime counters
7. **on_coyyn_transaction_insert trigger** — fires AFTER INSERT on transactions
8. **RLS on wallets** — own read, partner read (via profiles.partner_id subquery), no INSERT/UPDATE/DELETE from client
9. **RLS on transactions** — own read, own insert, no UPDATE/DELETE
10. **Seed** — wallet rows for both placeholder UUIDs with zero balances

## Test Checks (002_coyyns_checks.sql)

Follows pattern from `001_auth_profiles_checks.sql`:

1. Both tables exist with correct columns
2. RLS enabled on both tables
3. Correct policies exist (2 wallet SELECT, 1 transaction SELECT, 1 transaction INSERT)
4. Balance trigger exists
5. Seed wallets exist with zero balance
6. Earn transaction increases balance correctly
7. Spend transaction decreases balance correctly
8. Overspend is rejected (CHECK constraint violation)
9. Balance unchanged after rejected spend
10. Test data cleanup
11. Manual dashboard verification checklist

## Potential Issues / Edge Cases

- **Migration ordering**: 002 must run after 001. FK constraints will fail otherwise.
- **set_updated_at() dependency**: If 002 is tested standalone, 001 must have been run first.
- **Seed timing**: Wallet seed requires profile rows from 001 seed to exist first (FK constraint on user_id → profiles.id).
- **Placeholder UUIDs**: Using same `00000000-...001` / `00000000-...002` as 001. Comments note replacement needed for real deployment.
- **No TypeScript files**: This task produces only SQL. The `npm run build` check should still pass since we're not modifying any TS/TSX.

## Execution Order

1. Write `supabase/migrations/002_coyyns.sql` (full migration)
2. Write `supabase/tests/002_coyyns_checks.sql` (verification queries)
3. Run `npm run build` to confirm no regressions
4. Update `docs/TASK_LOG.md`
