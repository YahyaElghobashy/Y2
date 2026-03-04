-- ============================================================
-- T1004: Rituals + Ritual Logs Tables
-- Creates rituals and ritual_logs tables for personal and
-- shared habit tracking.
--
-- PERSONAL + SHARED: Each user creates their own rituals.
-- Shared rituals (is_shared=true) are visible to partner.
-- Ritual logs are immutable (no update/delete).
--
-- This is migration 018. Requires 001 (profiles + set_updated_at).
-- ============================================================


-- ── 1. RITUALS TABLE ─────────────────────────────────────────
-- One row per ritual. Created by a user, optionally shared.

create table public.rituals (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  title         text        not null,
  description   text,
  icon          text        not null default '✨',
  cadence       text        not null check (cadence in ('daily', 'weekly', 'monthly')),
  is_shared     boolean     not null default false,
  coyyns_reward integer     not null default 0 check (coyyns_reward >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index rituals_user_id_idx on public.rituals (user_id);

comment on table public.rituals is
  'Habit / ritual definitions. Personal by default, is_shared=true visible to partner.';


-- ── 2. RITUAL_LOGS TABLE ─────────────────────────────────────
-- One row per (ritual_id, user_id, period_key). Prevents double-logging.
-- Period key format: daily:2026-03-04, weekly:2026-W10, monthly:2026-03

create table public.ritual_logs (
  id            uuid        primary key default gen_random_uuid(),
  ritual_id     uuid        not null references public.rituals (id) on delete cascade,
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  period_key    text        not null,
  note          text,
  photo_url     text,
  logged_at     timestamptz not null default now(),
  created_at    timestamptz not null default now(),

  unique (ritual_id, user_id, period_key)
);

create index ritual_logs_ritual_id_idx on public.ritual_logs (ritual_id);
create index ritual_logs_user_id_idx on public.ritual_logs (user_id);
create index ritual_logs_period_key_idx on public.ritual_logs (ritual_id, period_key);

comment on table public.ritual_logs is
  'Immutable log of ritual completions. UNIQUE(ritual_id, user_id, period_key) prevents double-logging.';


-- ── 3. UPDATED_AT TRIGGER ────────────────────────────────────
-- Only on rituals (ritual_logs are immutable).

create trigger rituals_set_updated_at
  before update on public.rituals
  for each row
  execute function public.set_updated_at();


-- ── 4. ROW LEVEL SECURITY — RITUALS ─────────────────────────
-- Own rituals: full CRUD.
-- Partner's shared rituals: read-only.

alter table public.rituals enable row level security;

-- User can read own rituals
create policy "rituals: user select own"
  on public.rituals for select
  to authenticated
  using (auth.uid() = user_id);

-- User can read partner's shared rituals
create policy "rituals: partner select shared"
  on public.rituals for select
  to authenticated
  using (
    is_shared = true
    and user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

-- User can create own rituals
create policy "rituals: user insert"
  on public.rituals for insert
  to authenticated
  with check (auth.uid() = user_id);

-- User can update own rituals
create policy "rituals: user update"
  on public.rituals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- User can delete own rituals
create policy "rituals: user delete"
  on public.rituals for delete
  to authenticated
  using (auth.uid() = user_id);


-- ── 5. ROW LEVEL SECURITY — RITUAL_LOGS ─────────────────────
-- Own logs: insert + read.
-- Partner logs for shared rituals: read-only.
-- No update or delete (immutable).

alter table public.ritual_logs enable row level security;

-- User can read own logs
create policy "ritual_logs: user select own"
  on public.ritual_logs for select
  to authenticated
  using (auth.uid() = user_id);

-- User can read partner logs for shared rituals
create policy "ritual_logs: partner select shared"
  on public.ritual_logs for select
  to authenticated
  using (
    ritual_id in (
      select id from public.rituals
      where is_shared = true
        and user_id in (
          select id from public.profiles
          where partner_id = auth.uid()
        )
    )
  );

-- User can insert own logs
create policy "ritual_logs: user insert"
  on public.ritual_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- NO update or delete policies — ritual_logs are immutable


-- ── 6. STORAGE BUCKET — RITUAL IMAGES ────────────────────────
-- For ritual log photos (optional).

insert into storage.buckets (id, name, public, file_size_limit)
values ('ritual-images', 'ritual-images', true, 5242880)
on conflict (id) do nothing;
