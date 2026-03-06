-- ============================================================
-- Fix: Expand notifications.type CHECK constraint + enable realtime
--
-- The process-purchase edge function inserts notifications with
-- type = 'marketplace_effect', but the original constraint in
-- 003_notifications.sql only allows ('custom','coupon_approval','system').
-- This migration adds the missing value and enables realtime
-- (omitted from the original migration).
--
-- Depends on: 003_notifications.sql (notifications table)
-- ============================================================


-- ── 1. EXPAND TYPE CONSTRAINT ──────────────────────────────────

-- Drop the existing inline CHECK constraint on type
alter table public.notifications
  drop constraint if exists notifications_type_check;

-- Recreate with the missing 'marketplace_effect' value
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('custom', 'coupon_approval', 'system', 'marketplace_effect'));


-- ── 2. ENABLE REALTIME ─────────────────────────────────────────

-- 003_notifications.sql never added notifications to supabase_realtime.
-- This is required for the use-notifications hook's realtime subscription.
alter publication supabase_realtime add table public.notifications;
