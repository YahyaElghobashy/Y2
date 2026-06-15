-- ============================================================================
-- register-cron.sql  —  pg_cron registration for Y2 / "Hayah" scheduled
-- edge functions (Supabase project ref: ehqtcdakzvisemrmjnqh).
--
-- Registers one cron job per scheduled edge function. Each job uses pg_net
-- (net.http_post) to invoke the function's public endpoint with the project
-- service_role JWT (functions have verify_jwt = ON).
--
-- IDEMPOTENT + RE-RUNNABLE: extensions are created IF NOT EXISTS, and every
-- job is unscheduled-if-exists before being (re)scheduled. Safe to run any
-- number of times.
--
-- ──────────────────────────────────────────────────────────────────────────
-- SECRET HANDLING — the auth key is NEVER hardcoded in this file. It is read
-- at cron-run time from Supabase Vault under the name 'service_role_key'.
--
-- IMPORTANT (Hayah uses the NEW Supabase API-key system): the value that the
-- edge runtime injects as SUPABASE_SERVICE_ROLE_KEY — and therefore the value
-- the functions' body-auth (`authHeader.includes(SERVICE_ROLE_KEY)`) compares
-- against — is the project's SECRET key (prefix `sb_secret_…`), NOT the legacy
-- service_role JWT. The legacy JWT passes PostgREST but the functions 401 on
-- it. Store the `sb_secret_…` key (Dashboard → Settings → API Keys → Secret
-- keys). Inject it ONCE (out of band, not committed) with:
--
--   select vault.create_secret(
--     '<sb_secret_…>',                -- injected at run time, never committed
--     'service_role_key',
--     'Supabase secret key (sb_secret_) = SUPABASE_SERVICE_ROLE_KEY in edge fns'
--   );
--   -- (use vault.update_secret(id, ...) instead if the name already exists)
--
-- Run THIS file via the Supabase Management API (no local CLI):
--   curl -s -X POST \
--     "https://api.supabase.com/v1/projects/ehqtcdakzvisemrmjnqh/database/query" \
--     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
--     -H "User-Agent: curl/8.4.0" -H "Content-Type: application/json" \
--     -d "$(jq -Rs '{query: .}' scripts/register-cron.sql)"
-- ============================================================================

-- ── 1. Extensions ───────────────────────────────────────────────────────────
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

-- ── 2. Register jobs ────────────────────────────────────────────────────────
-- Cadences are derived from each function's own header comment / schedule logic:
--   send-event-reminder  → every 5 min  (scans event_reminders due now)
--   snap-trigger         → every 1 min  (±1 min trigger window, Cairo tz inside)
--   google-calendar-pull → every 30 min (pulls next 30 days of gcal events)
--   media-export         → daily 03:00 UTC (exports media older than 7 days)
--
-- NOTE: pg_cron schedules evaluate in UTC. The functions handle any timezone
-- logic internally, so UTC scheduling is intentional.

do $$
declare
  fn_base text := 'https://ehqtcdakzvisemrmjnqh.functions.supabase.co/';
  jobs jsonb := jsonb_build_array(
    jsonb_build_object('name', 'send-event-reminder',  'schedule', '*/5 * * * *'),
    jsonb_build_object('name', 'snap-trigger',          'schedule', '* * * * *'),
    jsonb_build_object('name', 'google-calendar-pull',  'schedule', '*/30 * * * *'),
    jsonb_build_object('name', 'media-export',          'schedule', '0 3 * * *')
  );
  j jsonb;
  slug text;
  sched text;
  cmd text;
begin
  for j in select * from jsonb_array_elements(jobs)
  loop
    slug  := j ->> 'name';
    sched := j ->> 'schedule';

    -- unschedule-if-exists (no error when absent: function only runs per matched row)
    perform cron.unschedule(jobid) from cron.job where jobname = slug;

    -- Command run on each tick: POST to the function with the service_role JWT
    -- pulled live from Vault (no secret stored in cron.job.command either).
    cmd := format(
      $cmd$
      select net.http_post(
        url     := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' ||
            (select decrypted_secret from vault.decrypted_secrets
             where name = 'service_role_key' limit 1)
        ),
        body    := '{}'::jsonb,
        timeout_milliseconds := 30000
      );
      $cmd$,
      fn_base || slug
    );

    perform cron.schedule(slug, sched, cmd);
  end loop;
end $$;

-- ── 3. Verify ───────────────────────────────────────────────────────────────
select jobname, schedule, active
from cron.job
where jobname in (
  'send-event-reminder', 'snap-trigger', 'google-calendar-pull', 'media-export'
)
order by jobname;
