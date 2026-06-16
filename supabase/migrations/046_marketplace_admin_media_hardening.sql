-- ============================================================
-- W4 / 046: Marketplace item admin + media/cron hardening
--   1. marketplace_items admin RLS (insert/update/delete) for the couple
--   2. marketplace_items.updated_at column + bump trigger
--   3. Expand the seeded inventory (5 -> 15) across every effect_type
--   4. cron_job_health + cron_http_failures views so cron/edge-fn
--      failures are visible (queryable) instead of silent
-- ============================================================

-- ── 1. Admin RLS ────────────────────────────────────────────
-- Before this migration the only policy on marketplace_items was
-- "authenticated read" (SELECT). The app is a private 2-user space,
-- so any authenticated user is an admin of the shared catalogue.
-- DELETE is gated by the purchases FK at the DB layer (items that
-- have been purchased cannot be hard-deleted — the UI soft-deletes
-- via is_active = false).

drop policy if exists "marketplace_items: authenticated insert" on public.marketplace_items;
create policy "marketplace_items: authenticated insert"
  on public.marketplace_items
  for insert
  to authenticated
  with check (true);

drop policy if exists "marketplace_items: authenticated update" on public.marketplace_items;
create policy "marketplace_items: authenticated update"
  on public.marketplace_items
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "marketplace_items: authenticated delete" on public.marketplace_items;
create policy "marketplace_items: authenticated delete"
  on public.marketplace_items
  for delete
  to authenticated
  using (true);

-- ── 2. updated_at column + trigger ──────────────────────────
alter table public.marketplace_items
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_marketplace_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_marketplace_items_updated_at on public.marketplace_items;
create trigger trg_marketplace_items_updated_at
  before update on public.marketplace_items
  for each row
  execute function public.set_marketplace_items_updated_at();

-- ── 3. Expand inventory (idempotent on name) ────────────────
insert into public.marketplace_items (name, description, price, icon, effect_type, effect_config, is_active, sort_order)
values
  ('Double Ping',          'Two guaranteed extra notifications.',                  18, '🔔', 'extra_ping', '{"extra_sends": 2}'::jsonb,                                                       true, 6),
  ('Triple Ping',          'Three guaranteed extra notifications.',                25, '📣', 'extra_ping', '{"extra_sends": 3}'::jsonb,                                                       true, 7),
  ('Restaurant Veto',      'Override where you eat out next.',                     30, '🍽', 'veto',       '{"requires_input": true, "input_prompt": "Which restaurant?"}'::jsonb,            true, 8),
  ('Plan Veto',            'Cancel one plan, no questions asked.',                 28, '✋', 'veto',       '{"requires_input": true, "input_prompt": "Which plan?"}'::jsonb,                  true, 9),
  ('Coffee Run',           'Your love brings you a coffee within 12h.',            20, '☕', 'task_order', '{"deadline_hours": 12, "task_description": "Bring me a coffee"}'::jsonb,          true, 10),
  ('Foot Massage',         'Claim a 15-minute foot massage within a day.',         45, '💆', 'task_order', '{"deadline_hours": 24, "task_description": "Give a 15-min foot massage"}'::jsonb, true, 11),
  ('Two Hours of Silence', 'Do-not-disturb for two full hours.',                   28, '🤫', 'dnd_timer',  '{"duration_minutes": 120}'::jsonb,                                               true, 12),
  ('Power Nap Pass',       'A protected 90-minute nap window.',                    22, '😴', 'dnd_timer',  '{"duration_minutes": 90}'::jsonb,                                                true, 13),
  ('Grand Wildcard',       'Negotiate one grand wish together.',                   75, '🌟', 'wildcard',   '{"negotiable": true, "requires_input": true, "input_prompt": "Name your grand wish"}'::jsonb,             true, 14),
  ('Day-Off Pass',         'A full day off from shared chores.',                   90, '🏖', 'wildcard',   '{"negotiable": true, "requires_input": true, "input_prompt": "What will you do with your day off?"}'::jsonb, true, 15)
on conflict (name) do nothing;

-- ── 4. Cron / edge-function failure visibility ──────────────
-- net.http_post is fire-and-forget: cron.job_run_details only records
-- whether the POST was *queued*, while the downstream HTTP status lands
-- in net._http_response where nothing surfaces it. These two views make
-- both layers queryable so a failing cron is no longer silent.
-- security_invoker defaults to false (PG15) → the view runs with the
-- owner's (postgres) privileges, so authenticated can read cron/net
-- through the view without direct grants on those schemas. The command
-- text (which references a vault secret) is intentionally excluded.

create or replace view public.cron_job_health as
select
  j.jobid,
  j.jobname,
  j.schedule,
  j.active,
  d.status         as last_run_status,
  d.return_message as last_run_message,
  d.start_time     as last_run_at
from cron.job j
left join lateral (
  select status, return_message, start_time
  from cron.job_run_details r
  where r.jobid = j.jobid
  order by r.start_time desc
  limit 1
) d on true
order by j.jobid;

create or replace view public.cron_http_failures as
select
  id,
  status_code,
  error_msg,
  timed_out,
  created
from net._http_response
where status_code is null
   or status_code >= 400
   or timed_out = true
order by created desc
limit 100;

revoke all on public.cron_job_health from anon;
revoke all on public.cron_http_failures from anon;
grant select on public.cron_job_health to authenticated, service_role;
grant select on public.cron_http_failures to authenticated, service_role;
