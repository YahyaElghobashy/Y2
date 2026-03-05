-- ============================================================
-- T1406: Spin the Wheel — wheel_presets + wheel_sessions + wheel_spins
-- Reusable spin-the-wheel with selection, elimination, and
-- best-of modes for couple decision-making.
--
-- This is migration 026. Requires 001 (profiles + set_updated_at).
-- ============================================================


-- ── 1. WHEEL_PRESETS TABLE ───────────────────────────────────
-- Saved wheel configurations with named item sets.

create table public.wheel_presets (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  name        text        not null,
  icon        text        not null default '🎯',
  items       jsonb       not null
                          check (jsonb_array_length(items) >= 2 and jsonb_array_length(items) <= 20),
  is_shared   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index wheel_presets_user_id_idx on public.wheel_presets (user_id);

comment on table public.wheel_presets is
  'Saved wheel configurations. items is a jsonb array of {id, label, color?, weight?}.';


-- ── 2. WHEEL_SESSIONS TABLE ─────────────────────────────────
-- One row per wheel session (game).

create table public.wheel_sessions (
  id              uuid        primary key default gen_random_uuid(),
  preset_id       uuid        not null references public.wheel_presets (id) on delete cascade,
  started_by      uuid        not null references public.profiles (id) on delete cascade,
  mode            text        not null
                              check (mode in ('selection', 'elimination', 'best_of')),
  best_of_target  integer,
  best_of_rounds  integer     not null default 0,
  status          text        not null default 'active'
                              check (status in ('active', 'completed', 'abandoned')),
  winner_label    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index wheel_sessions_preset_id_idx on public.wheel_sessions (preset_id);
create index wheel_sessions_status_idx on public.wheel_sessions (status);

comment on table public.wheel_sessions is
  'One wheel session per game. Tracks mode, progress, and winner.';


-- ── 3. WHEEL_SPINS TABLE ────────────────────────────────────
-- Individual spin results within a session.

create table public.wheel_spins (
  id               uuid        primary key default gen_random_uuid(),
  session_id       uuid        not null references public.wheel_sessions (id) on delete cascade,
  spin_number      integer     not null,
  spun_by          uuid        not null references public.profiles (id) on delete cascade,
  result_label     text        not null,
  result_index     integer     not null,
  remaining_items  jsonb,
  eliminated_item  text,
  spin_duration_ms integer,
  created_at       timestamptz not null default now()
);

create index wheel_spins_session_id_idx on public.wheel_spins (session_id);

comment on table public.wheel_spins is
  'Individual spin results. remaining_items tracks elimination state.';


-- ── 4. UPDATED_AT TRIGGERS ──────────────────────────────────

create trigger wheel_presets_set_updated_at
  before update on public.wheel_presets
  for each row
  execute function public.set_updated_at();

create trigger wheel_sessions_set_updated_at
  before update on public.wheel_sessions
  for each row
  execute function public.set_updated_at();


-- ── 5. ROW LEVEL SECURITY — WHEEL_PRESETS ────────────────────

alter table public.wheel_presets enable row level security;

-- User can read own presets
create policy "wheel_presets: user select own"
  on public.wheel_presets for select
  to authenticated
  using (user_id = auth.uid());

-- User can read partner's shared presets
create policy "wheel_presets: partner select shared"
  on public.wheel_presets for select
  to authenticated
  using (
    is_shared = true
    and user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

-- User can insert own presets
create policy "wheel_presets: user insert"
  on public.wheel_presets for insert
  to authenticated
  with check (auth.uid() = user_id);

-- User can update own presets
create policy "wheel_presets: user update"
  on public.wheel_presets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- User can delete own presets
create policy "wheel_presets: user delete"
  on public.wheel_presets for delete
  to authenticated
  using (auth.uid() = user_id);


-- ── 6. ROW LEVEL SECURITY — WHEEL_SESSIONS ──────────────────

alter table public.wheel_sessions enable row level security;

-- User can read own sessions
create policy "wheel_sessions: user select own"
  on public.wheel_sessions for select
  to authenticated
  using (started_by = auth.uid());

-- User can read partner's sessions
create policy "wheel_sessions: partner select"
  on public.wheel_sessions for select
  to authenticated
  using (
    started_by in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

-- User can insert own sessions
create policy "wheel_sessions: user insert"
  on public.wheel_sessions for insert
  to authenticated
  with check (auth.uid() = started_by);

-- User can update own sessions
create policy "wheel_sessions: user update"
  on public.wheel_sessions for update
  to authenticated
  using (auth.uid() = started_by)
  with check (auth.uid() = started_by);


-- ── 7. ROW LEVEL SECURITY — WHEEL_SPINS ─────────────────────

alter table public.wheel_spins enable row level security;

-- User can read own spins
create policy "wheel_spins: user select own"
  on public.wheel_spins for select
  to authenticated
  using (spun_by = auth.uid());

-- User can read partner's spins
create policy "wheel_spins: partner select"
  on public.wheel_spins for select
  to authenticated
  using (
    spun_by in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
  );

-- User can insert own spins
create policy "wheel_spins: user insert"
  on public.wheel_spins for insert
  to authenticated
  with check (auth.uid() = spun_by);


-- ── 8. ENABLE REALTIME ──────────────────────────────────────

alter publication supabase_realtime add table public.wheel_presets;
alter publication supabase_realtime add table public.wheel_sessions;
alter publication supabase_realtime add table public.wheel_spins;
