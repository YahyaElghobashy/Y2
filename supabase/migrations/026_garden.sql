-- ============================================================
-- T1014: Shared Garden — garden_days table
-- Tracks daily app opens from each user. When both open on the
-- same day, a flower blooms in their shared garden.
-- ============================================================

-- ── Table ──────────────────────────────────────────────────────
create table public.garden_days (
  id            uuid        primary key default gen_random_uuid(),
  garden_date   date        not null unique,
  yahya_opened  boolean     not null default false,
  yara_opened   boolean     not null default false,
  flower_type   text,
  created_at    timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────────
alter table public.garden_days enable row level security;

-- All authenticated users can read
create policy "garden_days: authenticated read"
  on public.garden_days for select
  to authenticated
  using (true);

-- All authenticated users can insert
create policy "garden_days: authenticated insert"
  on public.garden_days for insert
  to authenticated
  with check (true);

-- All authenticated users can update
create policy "garden_days: authenticated update"
  on public.garden_days for update
  to authenticated
  using (true)
  with check (true);

-- ── Index ──────────────────────────────────────────────────────
create index idx_garden_days_date on public.garden_days (garden_date desc);

-- ── Realtime ───────────────────────────────────────────────────
alter publication supabase_realtime add table public.garden_days;
