-- ============================================================
-- T1404: Couple Prompts — Daily Questions + Answers
-- One prompt per day. Both answer independently.
-- Answers secret until both submit.
--
-- This is migration 025. Requires 001 (profiles + set_updated_at).
-- ============================================================


-- ── 1. COUPLE_PROMPTS TABLE ────────────────────────────────
-- One prompt per day. Auto-selected from prompts bank.

create table public.couple_prompts (
  id              uuid        primary key default gen_random_uuid(),
  prompt_date     date        unique not null,
  prompt_text     text        not null,
  prompt_category text        not null
                              check (prompt_category in ('deep', 'playful', 'memory', 'dream', 'opinion', 'challenge')),
  both_answered   boolean     not null default false,
  created_at      timestamptz not null default now()
);

create index couple_prompts_date_idx on public.couple_prompts (prompt_date desc);

comment on table public.couple_prompts is
  'Daily couple question. One per day. both_answered flips when 2 users answer.';


-- ── 2. PROMPT_ANSWERS TABLE ────────────────────────────────
-- Each user answers independently. UNIQUE(prompt_id, user_id).

create table public.prompt_answers (
  id           uuid        primary key default gen_random_uuid(),
  prompt_id    uuid        not null references public.couple_prompts (id) on delete cascade,
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  answer_text  text        not null check (char_length(answer_text) <= 2000),
  submitted_at timestamptz not null default now(),

  unique (prompt_id, user_id)
);

create index prompt_answers_prompt_id_idx on public.prompt_answers (prompt_id);

comment on table public.prompt_answers is
  'Individual answers per daily prompt. Secret until both_answered flips.';


-- ── 3. BOTH_ANSWERED TRIGGER ───────────────────────────────
-- Fires after INSERT on prompt_answers. When 2 distinct users
-- have answered the same prompt, set both_answered = true.

create or replace function public.check_both_prompt_answered()
returns trigger as $$
begin
  if (
    select count(distinct user_id)
    from public.prompt_answers
    where prompt_id = NEW.prompt_id
  ) >= 2 then
    update public.couple_prompts
    set both_answered = true
    where id = NEW.prompt_id
      and both_answered = false;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger prompt_answers_check_both_answered
  after insert on public.prompt_answers
  for each row
  execute function public.check_both_prompt_answered();


-- ── 4. ROW LEVEL SECURITY — COUPLE_PROMPTS ─────────────────
-- Both partners can read all prompts. Anyone authenticated can insert.

alter table public.couple_prompts enable row level security;

create policy "couple_prompts: authenticated select"
  on public.couple_prompts for select
  to authenticated
  using (true);

create policy "couple_prompts: authenticated insert"
  on public.couple_prompts for insert
  to authenticated
  with check (true);


-- ── 5. ROW LEVEL SECURITY — PROMPT_ANSWERS ─────────────────
-- Users can read own answers always.
-- Users can read partner answers ONLY when both_answered = true.
-- Users can insert own answers only.

alter table public.prompt_answers enable row level security;

-- User can read own answers
create policy "prompt_answers: user select own"
  on public.prompt_answers for select
  to authenticated
  using (auth.uid() = user_id);

-- User can read partner answers when both answered
create policy "prompt_answers: partner select when both answered"
  on public.prompt_answers for select
  to authenticated
  using (
    user_id in (
      select id from public.profiles
      where partner_id = auth.uid()
    )
    and prompt_id in (
      select id from public.couple_prompts
      where both_answered = true
    )
  );

-- User can insert own answers
create policy "prompt_answers: user insert"
  on public.prompt_answers for insert
  to authenticated
  with check (auth.uid() = user_id);


-- ── 6. ENABLE REALTIME ─────────────────────────────────────

alter publication supabase_realtime add table public.couple_prompts;
alter publication supabase_realtime add table public.prompt_answers;
