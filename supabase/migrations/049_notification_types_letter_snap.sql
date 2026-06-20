-- ============================================================
-- 049: Add 'letter' and 'snap_reaction' notification types
-- Couple-writes now notify the partner: writing a monthly letter and
-- reacting to a snap. Extend the notifications.type CHECK so those rows
-- are accepted. The notification list renders generically (title/body/
-- emoji), so no renderer change is required; metadata carries the source
-- ids for future deep-linking.
--
-- Depends on: 003_notifications.sql, 045_self_spirit_realtime_garden_cycle.sql
-- ============================================================

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'custom',
    'coupon_approval',
    'system',
    'marketplace_effect',
    'event_reminder',
    'cycle_reminder',
    'letter',
    'snap_reaction'
  ));
