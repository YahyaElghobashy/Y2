-- ============================================================
-- Fix: Scope events SELECT RLS policy to partner only
--
-- The original policy in 013_shared_calendar.sql allows ANY
-- authenticated user to read all shared events. This tightens
-- the policy so shared events are only visible to the creator's
-- partner, using the existing get_partner_id() helper from
-- 008_fix_partner_read_policy.sql.
--
-- Depends on: 013_shared_calendar.sql (events table + original policy)
--             008_fix_partner_read_policy.sql (get_partner_id function)
-- ============================================================


-- ── 1. REPLACE SELECT POLICY ───────────────────────────────────

drop policy if exists "events: read own and partner shared" on public.events;

create policy "events: read own and partner shared"
  on public.events
  for select
  to authenticated
  using (
    creator_id = auth.uid()
    or (is_shared = true and creator_id = public.get_partner_id())
  );
