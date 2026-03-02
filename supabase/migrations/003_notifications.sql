-- ============================================================
-- T401: Push Notifications Database Migration
-- Creates push_subscriptions, notifications, daily_send_limits,
-- RLS policies, and the get_or_create_daily_limit function
-- Depends on: 001_auth_profiles.sql (profiles table must exist)
-- ============================================================


-- ── 1. PUSH SUBSCRIPTIONS TABLE ───────────────────────────────

create table public.push_subscriptions (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  subscription jsonb       not null,
  device_name  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint push_subscriptions_user_device_unique unique (user_id, subscription)
);

-- Index on user_id for fast subscription lookups when sending to a recipient
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

comment on table public.push_subscriptions is
  'One row per registered device per user. Stores the Web Push PushSubscription object (endpoint + keys). Used by the Edge Function to deliver notifications to all active devices for a recipient.';
comment on column public.push_subscriptions.subscription is
  'The serialised PushSubscription JSON object from the browser. Contains endpoint, expirationTime, and keys (p256dh, auth). Never expose to the client of other users.';
comment on column public.push_subscriptions.device_name is
  'Optional human-readable label set by the user. E.g. "Yahya iPhone", "Work MacBook". Useful for managing multiple subscriptions.';


-- ── 2. UPDATED_AT TRIGGER FOR PUSH_SUBSCRIPTIONS ─────────────

create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row
  execute function public.set_updated_at();
-- Note: set_updated_at() was defined in 001_auth_profiles.sql and is reused here.


-- ── 3. NOTIFICATIONS TABLE ────────────────────────────────────

create table public.notifications (
  id           uuid        primary key default gen_random_uuid(),
  sender_id    uuid        not null references public.profiles (id) on delete cascade,
  recipient_id uuid        not null references public.profiles (id) on delete cascade,
  title        text        not null,
  body         text        not null,
  emoji        text,
  type         text        not null default 'custom'
                           check (type in ('custom', 'coupon_approval', 'system')),
  status       text        not null default 'sent'
                           check (status in ('sent', 'delivered', 'failed')),
  metadata     jsonb       not null default '{}',
  created_at   timestamptz not null default now()
);

-- Index for recipient's inbox view (newest first)
create index notifications_recipient_id_created_at_idx
  on public.notifications (recipient_id, created_at desc);

-- Index for sender's outbox view (newest first)
create index notifications_sender_id_created_at_idx
  on public.notifications (sender_id, created_at desc);

comment on table public.notifications is
  'Immutable log of every push notification sent between Yahya and Yara. Status is updated by the Edge Function after delivery attempt. Rows are never edited or deleted by the client.';
comment on column public.notifications.emoji is
  'Optional single emoji prepended to the notification title on the device lock screen. E.g. "🌙", "❤️". Stored separately so the UI can render it distinctly.';
comment on column public.notifications.type is
  'Categorises the source of the notification. custom = user-composed message. coupon_approval = triggered by the coupons feature. system = app-generated alerts.';
comment on column public.notifications.status is
  'Lifecycle state set by the Edge Function. sent = row created, push not yet attempted. delivered = Web Push API accepted the payload. failed = push API returned an error.';
comment on column public.notifications.metadata is
  'Flexible JSON bag for feature-specific context. E.g. { "coupon_id": "..." } for coupon_approval type. Always safe to be empty.';


-- ── 4. DAILY SEND LIMITS TABLE ────────────────────────────────

create table public.daily_send_limits (
  id                     uuid    primary key default gen_random_uuid(),
  user_id                uuid    not null references public.profiles (id) on delete cascade,
  date                   date    not null default current_date,
  free_sends_used        integer not null default 0 check (free_sends_used >= 0),
  bonus_sends_used       integer not null default 0 check (bonus_sends_used >= 0),
  bonus_sends_available  integer not null default 0 check (bonus_sends_available >= 0),
  constraint daily_send_limits_user_date_unique unique (user_id, date)
);

-- Index on user_id for history queries
create index daily_send_limits_user_id_idx on public.daily_send_limits (user_id);

comment on table public.daily_send_limits is
  'One row per user per calendar day. Tracks how many free and bonus notification sends have been used. Rows are lazily created on first send of the day via get_or_create_daily_limit().';
comment on column public.daily_send_limits.free_sends_used is
  'Number of free sends used today. Free allowance is 2 per day. When this reaches 2, only bonus sends are available.';
comment on column public.daily_send_limits.bonus_sends_used is
  'Number of purchased bonus sends used today. Informational — does not gate anything directly.';
comment on column public.daily_send_limits.bonus_sends_available is
  'Bonus sends purchased with CoYYns that have not yet been used today. Decremented by the Edge Function (T403) when a bonus send is consumed. Incremented when CoYYns are spent to purchase more.';


-- ── 5. ROW LEVEL SECURITY — PUSH_SUBSCRIPTIONS ───────────────

alter table public.push_subscriptions enable row level security;

-- Policy: users can read their own subscriptions only
create policy "push_subscriptions: own read"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

-- Policy: users can insert subscriptions for themselves only
create policy "push_subscriptions: own insert"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

-- Policy: users can update their own subscriptions (e.g. rename device)
create policy "push_subscriptions: own update"
  on public.push_subscriptions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: users can delete their own subscriptions (unregister device)
create policy "push_subscriptions: own delete"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);

-- Partners CANNOT read each other's subscription objects. The Edge Function
-- reads recipient subscriptions as service role (security definer), not as the
-- authenticated sender. This protects raw endpoint URLs and encryption keys.


-- ── 6. ROW LEVEL SECURITY — NOTIFICATIONS ────────────────────

alter table public.notifications enable row level security;

-- Policy: sender can insert notifications (only for themselves as sender)
create policy "notifications: own insert"
  on public.notifications
  for insert
  with check (auth.uid() = sender_id);

-- Policy: sender can read notifications they sent
create policy "notifications: sender read"
  on public.notifications
  for select
  using (auth.uid() = sender_id);

-- Policy: recipient can read notifications sent to them
create policy "notifications: recipient read"
  on public.notifications
  for select
  using (auth.uid() = recipient_id);

-- No UPDATE policy from client — status updates are performed by the Edge
-- Function (T403) running as service role. Clients never change status.
-- No DELETE policy — the notification log is permanent.


-- ── 7. ROW LEVEL SECURITY — DAILY SEND LIMITS ────────────────

alter table public.daily_send_limits enable row level security;

-- Policy: users can read their own daily limit row
create policy "daily_send_limits: own read"
  on public.daily_send_limits
  for select
  using (auth.uid() = user_id);

-- Policy: users can update their own daily limit row
-- (e.g. incrementing free_sends_used after a successful send)
create policy "daily_send_limits: own update"
  on public.daily_send_limits
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No INSERT policy from client — rows are created exclusively via the
-- get_or_create_daily_limit() function which runs as security definer.
-- No DELETE policy — limit rows are historical records.


-- ── 8. FUNCTION: get_or_create_daily_limit ────────────────────
-- Returns the daily_send_limits row for p_user_id and today's date.
-- If no row exists yet (first send of the day), inserts one with default
-- values and returns it. Safe to call multiple times — idempotent.
-- Runs as security definer so it can INSERT despite no client INSERT policy.

create or replace function public.get_or_create_daily_limit(p_user_id uuid)
returns public.daily_send_limits
language plpgsql
security definer set search_path = public
as $$
declare
  v_row public.daily_send_limits;
begin
  -- Attempt to fetch today's row first (the common path)
  select * into v_row
  from public.daily_send_limits
  where user_id = p_user_id
    and date = current_date;

  -- If no row exists, create one with all defaults and return it
  if not found then
    insert into public.daily_send_limits (user_id, date)
    values (p_user_id, current_date)
    on conflict (user_id, date) do nothing;

    -- Re-select after insert (handles the race condition where two concurrent
    -- calls both miss the initial select and both attempt insert — only one
    -- succeeds, but both return the same row via this re-select)
    select * into v_row
    from public.daily_send_limits
    where user_id = p_user_id
      and date = current_date;
  end if;

  return v_row;
end;
$$;

comment on function public.get_or_create_daily_limit(uuid) is
  'Returns today''s daily_send_limits row for the given user, creating it with default values if it does not yet exist. Idempotent and safe under concurrent calls. Called by T403 (Edge Function) before every send attempt.';
