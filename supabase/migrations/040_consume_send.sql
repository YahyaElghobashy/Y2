-- ============================================================
-- T4 (relationship-core): Atomic send-consumption RPC
-- Adds consume_send(p_user_id) which atomically debits one
-- notification send from today's daily_send_limits row,
-- preferring free sends, then purchased bonus sends.
-- Closes the gap where the 2/day limit was checked in the UI
-- but never actually consumed in the database (sends were
-- effectively unlimited).
-- Depends on: 003_notifications.sql (daily_send_limits table
--             + get_or_create_daily_limit function).
-- ============================================================

-- Free notification sends allowed per user per calendar day.
-- Mirrors FREE_SENDS_PER_DAY in src/lib/hooks/use-notifications.ts.

create or replace function public.consume_send(p_user_id uuid)
returns public.daily_send_limits
language plpgsql
security definer set search_path = public
as $$
declare
  v_free_limit constant integer := 2;
  v_row        public.daily_send_limits;
begin
  -- Ensure today's row exists (idempotent, race-safe).
  v_row := public.get_or_create_daily_limit(p_user_id);

  -- 1. Prefer a free send if any remain today.
  if v_row.free_sends_used < v_free_limit then
    update public.daily_send_limits
       set free_sends_used = free_sends_used + 1
     where user_id = p_user_id
       and date = current_date
    returning * into v_row;
    return v_row;
  end if;

  -- 2. Otherwise consume a purchased bonus send if one is available.
  if v_row.bonus_sends_used < v_row.bonus_sends_available then
    update public.daily_send_limits
       set bonus_sends_used = bonus_sends_used + 1
     where user_id = p_user_id
       and date = current_date
    returning * into v_row;
    return v_row;
  end if;

  -- 3. No allowance left — caller must purchase a bonus send first.
  raise exception 'send_limit_reached'
    using errcode = 'P0001';
end;
$$;

comment on function public.consume_send(uuid) is
  'Atomically debits one notification send from today''s daily_send_limits row for p_user_id. Increments free_sends_used while under the 2/day free allowance, then bonus_sends_used while purchased bonus sends remain. Raises ''send_limit_reached'' (P0001) when no allowance is left. Runs as security definer so it can update rows lazily created by get_or_create_daily_limit. Called by sendNotification() after the notification row is inserted.';

-- Allow authenticated clients to invoke the RPC for themselves.
-- The function only mutates the row matching p_user_id; callers pass
-- their own auth.uid() from the client.
grant execute on function public.consume_send(uuid) to authenticated;
