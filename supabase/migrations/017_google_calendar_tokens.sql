-- ============================================================
-- T710: Google Calendar Token Storage
-- Adds columns to profiles for Google Calendar OAuth integration.
-- Only the user themselves can see/update their own token (existing RLS).
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token text,
  ADD COLUMN IF NOT EXISTS google_calendar_connected_at timestamptz;
