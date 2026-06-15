-- ============================================================
-- 028_event_reminders.sql — Reminder scheduling for calendar events
-- ============================================================

-- Table: event_reminders
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  remind_before interval NOT NULL,       -- e.g. '15 minutes', '1 hour', '1 day'
  remind_at timestamptz,                 -- computed: event datetime - remind_before
  is_sent boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate reminders for same event/user/interval
  CONSTRAINT event_reminders_unique UNIQUE (event_id, user_id, remind_before)
);

-- Index for efficient cron queries (unsent reminders due now)
CREATE INDEX IF NOT EXISTS idx_event_reminders_pending
  ON public.event_reminders (is_sent, remind_at)
  WHERE is_sent = false;

-- Index for looking up reminders by event
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id
  ON public.event_reminders (event_id);

-- ============================================================
-- Trigger: compute remind_at from event date/time - remind_before
-- All-day events default to 9:00 AM local time as base
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_remind_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_row public.events%ROWTYPE;
  base_timestamp timestamptz;
BEGIN
  -- Fetch the parent event
  SELECT * INTO event_row FROM public.events WHERE id = NEW.event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', NEW.event_id;
  END IF;

  -- Build base timestamp from event_date + event_time (or 09:00 for all-day)
  IF event_row.event_time IS NOT NULL THEN
    base_timestamp := (event_row.event_date || 'T' || event_row.event_time)::timestamptz;
  ELSE
    -- All-day events: use 9:00 AM as base time
    base_timestamp := (event_row.event_date || 'T09:00:00')::timestamptz;
  END IF;

  -- Compute remind_at
  NEW.remind_at := base_timestamp - NEW.remind_before;

  RETURN NEW;
END;
$$;

-- Trigger on INSERT and UPDATE
CREATE TRIGGER trg_compute_remind_at
  BEFORE INSERT OR UPDATE OF remind_before, event_id
  ON public.event_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_remind_at();

-- ============================================================
-- RLS: users can only manage their own reminders
-- ============================================================

ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- Users can read their own reminders
CREATE POLICY "Users can view own reminders"
  ON public.event_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create reminders for themselves
CREATE POLICY "Users can create own reminders"
  ON public.event_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reminders
CREATE POLICY "Users can update own reminders"
  ON public.event_reminders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reminders
CREATE POLICY "Users can delete own reminders"
  ON public.event_reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for edge functions (cron job)
CREATE POLICY "Service role full access"
  ON public.event_reminders
  FOR ALL
  USING (auth.role() = 'service_role');
