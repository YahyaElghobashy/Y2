# T201: Auth DB Migration — Build Plan

## Overview

Create the foundational Supabase migration for the `profiles` table. This is a pure SQL task — no React components, no TypeScript files. The migration creates the identity backbone that every future feature depends on.

## Files to Create

| File | Purpose |
|---|---|
| `supabase/migrations/001_auth_profiles.sql` | Full migration: profiles table, triggers, RLS policies, seed data |
| `supabase/tests/001_auth_profiles_checks.sql` | Manual verification queries to run after migration |

## Files to Modify

| File | Change |
|---|---|
| `docs/TASK_LOG.md` | Add T201 row |

## No Files Modified in `src/`

This task creates no React components, hooks, utilities, or TypeScript types. The `UserProfile` type will be created in T202 (Supabase Client) based on this schema.

## Dependencies on Existing Components

None. This is the first backend task. No imports from existing components.

## Design Tokens Referenced

None. This is a SQL migration — no UI work.

## Migration Structure (5 sections)

1. **PROFILES TABLE** — `public.profiles` with FK to `auth.users`, self-referential `partner_id`
2. **UPDATED_AT TRIGGER** — `set_updated_at()` function + trigger on `profiles`
3. **AUTO-CREATE PROFILE TRIGGER** — `handle_new_user()` fires on `auth.users` INSERT, creates profile row
4. **ROW LEVEL SECURITY** — 3 policies: own read, partner read, own update. No insert/delete from client.
5. **SEED DATA** — Placeholder UUIDs for Yahya + Yara, partner linking

## Schema Columns

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, FK → auth.users(id) ON DELETE CASCADE |
| `display_name` | text | NOT NULL |
| `email` | text | NOT NULL |
| `avatar_url` | text | NULLABLE |
| `partner_id` | uuid | NULLABLE, FK → profiles(id) ON DELETE SET NULL |
| `role` | text | NOT NULL, DEFAULT 'user' |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() |

## RLS Policies

| Policy Name | Operation | Logic |
|---|---|---|
| `profiles: own read` | SELECT | `auth.uid() = id` |
| `profiles: partner read` | SELECT | `id = (select partner_id from profiles where id = auth.uid())` |
| `profiles: own update` | UPDATE | `auth.uid() = id` (both USING and WITH CHECK) |
| *(none)* | INSERT | Trigger-only — no client inserts |
| *(none)* | DELETE | Profiles are permanent |

## Test Cases (SQL verification)

1. Table exists with correct columns and types
2. RLS is enabled on `profiles`
3. All 3 policies exist with correct operations
4. `on_auth_user_created` trigger exists on `auth.users`
5. Partner link is bidirectional after seed
6. No null/empty display_names exist

## Potential Issues / Edge Cases

- Seed UUIDs are placeholders — must be replaced with real UUIDs from Supabase Auth dashboard before running
- Trigger fires during seed if auth users created via dashboard before migration — seed UPDATE handles this (idempotent)
- Self-referential FK on `partner_id` — both rows must exist before UPDATE sets the link
- RLS partner read does a subquery on `profiles` itself — Postgres handles this correctly (no recursion)
- Running `npm run build` should be unaffected since no TypeScript files are modified

## What This Connects To (future tasks)

- **T202** — Supabase client + `UserProfile` TypeScript type derived from this schema
- **T203** — Login page → `supabase.auth.signInWithPassword()`
- **T204** — AuthProvider → fetches profile row, uses `partner_id`
- Every future data table FKs to `profiles.id`
