# T501: Period Tracker DB Migration — Build Plan

## Overview
Create two Supabase tables (`cycle_config` and `cycle_logs`) for private hormonal pill cycle tracking. Strict owner-only RLS — no partner access whatsoever.

## Files to Create

| # | File | Purpose |
|---|---|---|
| 1 | `supabase/migrations/004_cycle_tracker.sql` | Migration: cycle_config + cycle_logs tables, RLS, trigger, comments |
| 2 | `supabase/tests/004_cycle_tracker_checks.sql` | Verification SQL for schema, RLS, constraints |

## Files to Modify

| # | File | Change |
|---|---|---|
| 1 | `docs/API_CONTRACTS.md` | Add cycle_config and cycle_logs table schemas |
| 2 | `docs/TASK_LOG.md` | Add T501 completion entry |

## Dependencies

- **Migration 001 (T201)**: `public.profiles` table must exist (both tables FK to `profiles.id`)
- **Migration 001 (T201)**: `public.set_updated_at()` trigger function (reused by cycle_config trigger)
- No npm packages needed — this is a pure SQL migration task

## Schema Summary

### cycle_config (9 columns)
- `id` uuid PK (gen_random_uuid)
- `owner_id` uuid NOT NULL UNIQUE → profiles(id) CASCADE
- `pill_start_date` date NOT NULL
- `active_days` integer NOT NULL DEFAULT 21
- `break_days` integer NOT NULL DEFAULT 7
- `pms_warning_days` integer NOT NULL DEFAULT 3
- `notes` text NULLABLE
- `created_at` timestamptz NOT NULL DEFAULT now()
- `updated_at` timestamptz NOT NULL DEFAULT now()

### cycle_logs (7 columns)
- `id` uuid PK (gen_random_uuid)
- `owner_id` uuid NOT NULL → profiles(id) CASCADE
- `date` date NOT NULL
- `mood` text CHECK ('good','neutral','sensitive','difficult') NULLABLE
- `symptoms` text[] NULLABLE
- `notes` text NULLABLE
- `created_at` timestamptz NOT NULL DEFAULT now()
- UNIQUE(owner_id, date)

## RLS Policies

### cycle_config (3 policies — NO delete)
- owner select: `auth.uid() = owner_id`
- owner insert: `auth.uid() = owner_id`
- owner update: `auth.uid() = owner_id` (both USING + WITH CHECK)

### cycle_logs (4 policies — includes delete)
- owner select: `auth.uid() = owner_id`
- owner insert: `auth.uid() = owner_id`
- owner update: `auth.uid() = owner_id`
- owner delete: `auth.uid() = owner_id`

**CRITICAL: No partner-read policy on either table. This is the one exception in the entire app.**

## Indexes
- `cycle_config.owner_id` — implicit via UNIQUE constraint
- `cycle_logs_owner_date_idx` — explicit on (owner_id, date DESC) for range queries

## Trigger
- `cycle_config_set_updated_at` — reuses `public.set_updated_at()` from T201
- No trigger on cycle_logs (no updated_at column)

## Test Cases (Verification SQL)
1. Both tables exist with correct column count and types
2. RLS enabled on both tables
3. cycle_config has exactly 3 policies (select, insert, update) — no delete, no partner
4. cycle_logs has exactly 4 policies (select, insert, update, delete) — no partner
5. UNIQUE constraint on cycle_config.owner_id
6. UNIQUE constraint on cycle_logs(owner_id, date)
7. updated_at trigger exists on cycle_config
8. CHECK constraint on cycle_logs.mood (good/neutral/sensitive/difficult)
9. Manual RLS verification instructions (Yahya sees data, Yara sees 0 rows)

## Potential Issues
- `set_updated_at()` must already exist — migration 001 must run first
- `gen_random_uuid()` — native in Postgres 13+ (Supabase default), no extension needed
- No seed data — cycle_config populated by Yahya on first use
- No components to build — pure SQL migration task
- `npm run build` should pass unchanged — no TypeScript files modified
