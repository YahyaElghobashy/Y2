-- ============================================================
-- 050: Decide Together — decision_history (couple decision log)
-- Append-only record of every decision made with a Decide
-- Together selector (wheel, dice, rps, pros/cons, bonus...).
-- `options` = the choices that were in play (DecideOption[]);
-- `result`  = the chosen outcome (DecideResult). Both jsonb.
--
-- Numbered 050: live schema_migrations already holds 048
-- (atomic_marketplace_purchase) + 049 (notification_types_letter_snap),
-- applied to Hayah ahead of the repo's committed files. Applied live +
-- recorded version 050 via the Management API.
--
-- Depends on: 001_auth_profiles.sql        (profiles, gen_random_uuid)
--             008_fix_partner_read_policy.sql (get_partner_id)
-- ============================================================


-- ── 1. DECISION_HISTORY TABLE ───────────────────────────────

create table public.decision_history (
  id          uuid        primary key default gen_random_uuid(),
  created_by  uuid        not null references public.profiles (id) on delete cascade,
  kind        text        not null
                          check (kind in ('binary', 'many', 'weigh', 'playful')),
  tool_id     text        not null,
  options     jsonb       not null default '[]'::jsonb,
  result      jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Feed query is "my + partner's decisions, newest first".
create index decision_history_created_by_idx
  on public.decision_history (created_by, created_at desc);

comment on table public.decision_history is
  'Append-only log of Decide Together outcomes. options = DecideOption[], result = DecideResult (jsonb). Owner full CRUD; partner read-only via get_partner_id().';


-- ── 2. ROW LEVEL SECURITY ───────────────────────────────────
-- Owner does everything; partner can only read (append-only audit log).

alter table public.decision_history enable row level security;

create policy "decision_history: owner select"
  on public.decision_history for select
  to authenticated
  using (auth.uid() = created_by);

create policy "decision_history: partner select"
  on public.decision_history for select
  to authenticated
  using (created_by = public.get_partner_id());

create policy "decision_history: owner insert"
  on public.decision_history for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "decision_history: owner delete"
  on public.decision_history for delete
  to authenticated
  using (auth.uid() = created_by);


-- ── 3. ENABLE REALTIME ──────────────────────────────────────
-- Idempotent add (pattern from 038) so re-runs never error.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'decision_history'
  ) then
    alter publication supabase_realtime add table public.decision_history;
  end if;
end $$;
