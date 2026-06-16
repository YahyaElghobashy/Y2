-- ============================================================
-- 041: Profiles geolocation (for real prayer times)
-- Adds nullable location + prayer-calculation prefs to profiles
-- so prayer times can be COMPUTED (via the adhan library) from
-- the user's coordinates. Times are computed client-side; the DB
-- only stores where/how to compute them.
-- ============================================================

alter table public.profiles
  add column if not exists latitude       double precision,
  add column if not exists longitude      double precision,
  add column if not exists prayer_method  text,
  add column if not exists timezone       text;

comment on column public.profiles.latitude is
  'User latitude (degrees, WGS84). Nullable — null means no location set yet.';
comment on column public.profiles.longitude is
  'User longitude (degrees, WGS84). Nullable — null means no location set yet.';
comment on column public.profiles.prayer_method is
  'Adhan CalculationMethod key (e.g. Egyptian, MuslimWorldLeague). Null falls back to the app default (Egyptian).';
comment on column public.profiles.timezone is
  'IANA timezone string (e.g. Africa/Cairo). Optional; display uses the device timezone when null.';

-- No new RLS policy needed: profiles already has the
-- "profiles: own update" policy (auth.uid() = id) from migration 001,
-- which lets a user self-update these new columns. Partner read is also
-- already covered by the existing "profiles: partner read" policy.
