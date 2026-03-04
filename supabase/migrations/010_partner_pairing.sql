-- ============================================================
-- TF01: Partner Pairing — invite_code + pairing flow
--
-- Adds invite_code column to profiles for partner discovery,
-- pairing_status to track flow state, and an atomic
-- pair_partners() function for safe bidirectional linking.
--
-- Depends on: 001_auth_profiles.sql (profiles table)
--             008_fix_partner_read_policy.sql (get_partner_id)
-- ============================================================


-- ── 1. NEW COLUMNS ON PROFILES ─────────────────────────────

alter table public.profiles
  add column if not exists invite_code     text unique,
  add column if not exists pairing_status  text default 'unpaired'
    check (pairing_status in ('unpaired', 'invite_sent', 'paired')),
  add column if not exists paired_at       timestamptz;

comment on column public.profiles.invite_code is
  'Six-character uppercase alphanumeric code for partner discovery. Auto-generated on profile creation.';
comment on column public.profiles.pairing_status is
  'Pairing lifecycle state: unpaired → invite_sent → paired.';
comment on column public.profiles.paired_at is
  'Timestamp of when this user was successfully paired with their partner.';


-- ── 2. INVITE CODE GENERATOR ───────────────────────────────
-- Generates a 6-character uppercase alphanumeric code.
-- Retries until a unique code is found (collision-safe).

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
  done boolean := false;
begin
  while not done loop
    code := upper(substr(md5(random()::text), 1, 6));
    done := not exists (select 1 from public.profiles where invite_code = code);
  end loop;
  return code;
end;
$$;


-- ── 3. AUTO-SET INVITE CODE ON PROFILE INSERT ──────────────
-- If a new profile row has no invite_code, generate one.

create or replace function public.set_invite_code()
returns trigger
language plpgsql
as $$
begin
  if new.invite_code is null then
    new.invite_code := public.generate_invite_code();
  end if;
  return new;
end;
$$;

create trigger profiles_set_invite_code
  before insert on public.profiles
  for each row
  execute function public.set_invite_code();


-- ── 4. BACKFILL EXISTING PROFILES ──────────────────────────
-- Any existing profiles without invite codes get one now.

update public.profiles
set invite_code = public.generate_invite_code()
where invite_code is null;


-- ── 5. ATOMIC PAIRING FUNCTION ─────────────────────────────
-- Links two profiles as partners in a single atomic operation.
-- Returns JSON with success/error status.
-- SECURITY DEFINER: bypasses RLS for cross-user updates.

create or replace function public.pair_partners(my_id uuid, partner_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  partner_row public.profiles%rowtype;
begin
  -- Find the partner by invite code (exclude self)
  -- FOR UPDATE locks the row to prevent concurrent pairing races
  select * into partner_row
  from public.profiles
  where invite_code = partner_code
    and id != my_id
  for update;

  if not found then
    return '{"error": "Invalid invite code"}'::jsonb;
  end if;

  -- Check if partner is already paired
  if partner_row.pairing_status = 'paired' then
    return '{"error": "User already paired"}'::jsonb;
  end if;

  -- Lock and check caller's row to prevent self-race
  if exists (
    select 1 from public.profiles
    where id = my_id and pairing_status = 'paired'
    for update
  ) then
    return '{"error": "You are already paired"}'::jsonb;
  end if;

  -- Atomic bidirectional link (state guard in WHERE prevents stale writes)
  update public.profiles
  set partner_id = partner_row.id,
      pairing_status = 'paired',
      paired_at = now()
  where id = my_id
    and pairing_status != 'paired';

  update public.profiles
  set partner_id = my_id,
      pairing_status = 'paired',
      paired_at = now()
  where id = partner_row.id
    and pairing_status != 'paired';

  return jsonb_build_object(
    'success', true,
    'partner_id', partner_row.id,
    'partner_name', partner_row.display_name
  );
end;
$$;

comment on function public.pair_partners(uuid, text) is
  'Atomic partner pairing. Takes caller UUID and partner invite code. Links both profiles bidirectionally. Returns JSON with success or error message.';


-- ── 6. UNPAIR FUNCTION ─────────────────────────────────────
-- Cleanly reverses a pairing. Both profiles go back to unpaired.

create or replace function public.unpair_partners(my_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  my_partner_id uuid;
begin
  select partner_id into my_partner_id
  from public.profiles
  where id = my_id;

  if my_partner_id is null then
    return '{"error": "Not currently paired"}'::jsonb;
  end if;

  -- Clear both sides
  update public.profiles
  set partner_id = null,
      pairing_status = 'unpaired',
      paired_at = null
  where id = my_id;

  update public.profiles
  set partner_id = null,
      pairing_status = 'unpaired',
      paired_at = null
  where id = my_partner_id;

  return '{"success": true}'::jsonb;
end;
$$;

comment on function public.unpair_partners(uuid) is
  'Cleanly reverses a partner pairing. Clears partner_id and status on both profiles.';


-- ── 7. INDEX ───────────────────────────────────────────────

create index if not exists profiles_invite_code_idx
  on public.profiles (invite_code)
  where invite_code is not null;
