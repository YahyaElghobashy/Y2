# T601: Love Coupons DB Migration — Build Plan

## Overview
Create the Supabase migration for the Love Coupons feature: two tables (`coupons` and `coupon_history`), RLS policies enforcing surprise-coupon privacy, an auto-history trigger, and a verification test file.

## Files to Create

| # | Path | Purpose |
|---|---|---|
| 1 | `supabase/migrations/005_coupons.sql` | Migration: tables, indexes, constraints, triggers, RLS policies |
| 2 | `supabase/tests/005_coupons_checks.sql` | Verification SQL for manual testing |

## Files Modified

None — this is a pure SQL migration with no TypeScript components.

## Dependencies on Existing Code

| Dependency | From | Used For |
|---|---|---|
| `public.profiles` table | `001_auth_profiles.sql` | FK references for `creator_id`, `recipient_id`, `actor_id` |
| `public.set_updated_at()` function | `001_auth_profiles.sql` | Reused as `updated_at` trigger on `coupons` table |

## Schema Details

### `coupons` table (18 columns)
- `id` (uuid PK), `creator_id` (FK→profiles), `recipient_id` (FK→profiles)
- `title` (text NOT NULL), `description` (text), `emoji` (text), `category` (text, CHECK in 5 values), `image_url` (text)
- `status` (text, CHECK in 5 lifecycle values), `is_surprise` (bool), `surprise_revealed` (bool)
- `redeemed_at`, `approved_at`, `rejected_at` (timestamptz), `rejection_reason` (text)
- `expires_at`, `created_at`, `updated_at` (timestamptz)
- 4 CHECK constraints: status, category, no_self_gift, reveal_requires_surprise
- 4 indexes: creator_id, recipient_id, status, expires_at (partial)

### `coupon_history` table (6 columns)
- `id` (uuid PK), `coupon_id` (FK→coupons ON DELETE CASCADE), `action` (text, CHECK in 6 values)
- `actor_id` (FK→profiles ON DELETE RESTRICT), `note` (text), `created_at` (timestamptz)
- 2 indexes: coupon_id, actor_id

### Triggers
1. `coupons_set_updated_at` — reuses existing `set_updated_at()` from migration 001
2. `on_coupon_created` — fires AFTER INSERT on coupons, auto-logs 'created' action to `coupon_history`

### RLS Policies (7 total)

**coupons (5 policies):**
1. `coupons: creator read` — SELECT where `auth.uid() = creator_id`
2. `coupons: recipient read (non-surprise)` — SELECT where `auth.uid() = recipient_id` AND (`is_surprise = false` OR (`is_surprise = true` AND `surprise_revealed = true`))
3. `coupons: creator insert` — INSERT with `auth.uid() = creator_id`
4. `coupons: creator update` — UPDATE where `auth.uid() = creator_id`
5. `coupons: recipient update (redeem)` — UPDATE where `auth.uid() = recipient_id` AND surprise visibility check

**coupon_history (2 policies):**
1. `coupon_history: creator or recipient read` — SELECT via EXISTS join to coupons
2. `coupon_history: actor insert` — INSERT with `auth.uid() = actor_id` AND membership check

No DELETE or UPDATE policies on either table.

## Design Tokens Referenced

N/A — this is a SQL-only migration, no UI work.

## Test Cases (Verification SQL)

1. Tables exist with correct columns (information_schema check)
2. RLS enabled on both tables (pg_class check)
3. All 7 policies exist with correct commands (pg_policies check)
4. Auto-history trigger exists (information_schema.triggers check)
5. All 4 CHECK constraints exist (pg_constraint check)
6. Functional test: insert coupon → verify auto-created history row
7. Surprise coupon visibility: insert as Yahya with `is_surprise=true` → verify Yara sees 0 rows → reveal → verify Yara sees 1 row

## Potential Issues / Edge Cases

1. **Migration ordering**: 005 must run after 001. Supabase CLI handles filename ordering.
2. **`set_updated_at()` must exist**: If migration 001 hasn't run, this migration fails on the trigger creation. This is intentional — fail fast.
3. **Surprise RLS correctness**: Must NOT simplify to `surprise_revealed = true` alone — non-surprise coupons default to `surprise_revealed = false` and would become invisible.
4. **`handle_coupon_created()` is `security definer`**: Bypasses RLS to insert into `coupon_history` automatically. Without this, the trigger would fail due to the `actor insert` policy requiring `auth.uid()`.
5. **No DELETE policy**: Coupons and history are permanent. This is by design.
6. **Double redemption**: Not guarded at DB level — app layer (T602) must check status before allowing redemption.
