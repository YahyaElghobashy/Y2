-- ============================================================
-- 029_date_night_game.sql — Together Time: 3-mode couples game
-- Modes: الميزان (Alignment Check-In), غوص (Deep Dive), لعبة (Date Night Game)
-- ============================================================

-- ============================================================
-- 1. question_bank — shared pool of questions across all modes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  text_ar text,                              -- Arabic translation
  category text NOT NULL CHECK (category IN (
    'communication', 'intimacy', 'finances', 'faith',
    'family', 'lifestyle', 'dreams', 'conflict',
    'vulnerability', 'love', 'travel', 'home'
  )),
  difficulty text NOT NULL DEFAULT 'light' CHECK (difficulty IN ('light', 'medium', 'deep')),
  answer_type text NOT NULL DEFAULT 'open' CHECK (answer_type IN (
    'open', 'scale_1_10', 'yes_no', 'multiple_choice', 'ranking'
  )),
  answer_options jsonb,                      -- for multiple_choice: ["opt1","opt2",...]; for ranking: ["item1","item2",...]
  suitable_modes text[] NOT NULL DEFAULT '{date_night}' CHECK (
    suitable_modes <@ ARRAY['check_in', 'deep_dive', 'date_night']::text[]
  ),
  heat_level int DEFAULT 0 CHECK (heat_level BETWEEN 0 AND 3),  -- 0 = none, 1-3 for spicy
  is_system boolean NOT NULL DEFAULT true,   -- false = user-contributed
  contributed_by uuid REFERENCES public.profiles(id),
  use_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_bank_category ON public.question_bank (category);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON public.question_bank (difficulty);
CREATE INDEX IF NOT EXISTS idx_question_bank_answer_type ON public.question_bank (answer_type);
CREATE INDEX IF NOT EXISTS idx_question_bank_modes ON public.question_bank USING GIN (suitable_modes);
CREATE INDEX IF NOT EXISTS idx_question_bank_active ON public.question_bank (is_active) WHERE is_active = true;

-- ============================================================
-- 2. game_dares — dare cards for date night mode
-- ============================================================

CREATE TABLE IF NOT EXISTS public.game_dares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  text_ar text,
  category text NOT NULL CHECK (category IN (
    'communication', 'intimacy', 'finances', 'faith',
    'family', 'lifestyle', 'dreams', 'conflict',
    'vulnerability', 'love', 'travel', 'home'
  )),
  heat_level int NOT NULL DEFAULT 1 CHECK (heat_level BETWEEN 1 AND 3),
  coyyns_reward int NOT NULL DEFAULT 15,     -- earned if completed
  coyyns_penalty int NOT NULL DEFAULT 10,    -- deducted if skipped
  is_system boolean NOT NULL DEFAULT true,
  contributed_by uuid REFERENCES public.profiles(id),
  use_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_dares_heat ON public.game_dares (heat_level);
CREATE INDEX IF NOT EXISTS idx_game_dares_category ON public.game_dares (category);

-- ============================================================
-- 3. game_sessions — a single play session (any mode)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  partner_id uuid NOT NULL REFERENCES public.profiles(id),
  mode text NOT NULL CHECK (mode IN ('check_in', 'deep_dive', 'date_night')),
  status text NOT NULL DEFAULT 'setup' CHECK (status IN (
    'setup', 'authoring', 'playing', 'paused', 'completed', 'abandoned'
  )),
  config jsonb NOT NULL DEFAULT '{}',        -- mode-specific settings
  -- check_in specific
  alignment_score numeric(5,2),              -- overall alignment % for check_in mode
  category_scores jsonb,                     -- { "communication": 85, "finances": 45 }
  relationship_pulse numeric(3,1),           -- pre-session pulse (1-10)
  -- date_night specific
  player1_score int NOT NULL DEFAULT 0,
  player2_score int NOT NULL DEFAULT 0,
  total_coyyns_earned int NOT NULL DEFAULT 0,
  -- shared
  total_rounds int NOT NULL DEFAULT 0,
  completed_rounds int NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_created_by ON public.game_sessions (created_by);
CREATE INDEX IF NOT EXISTS idx_game_sessions_partner ON public.game_sessions (partner_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_mode ON public.game_sessions (mode);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions (status);

-- ============================================================
-- 4. game_rounds — individual rounds within a session
-- ============================================================

CREATE TABLE IF NOT EXISTS public.game_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round_number int NOT NULL,
  question_id uuid REFERENCES public.question_bank(id),
  dare_id uuid REFERENCES public.game_dares(id),
  custom_content_id uuid,                    -- FK to session_custom_content
  round_type text NOT NULL CHECK (round_type IN (
    'question', 'dare', 'truth_or_dare', 'open_discussion'
  )),
  -- Parallel answers (both players answer same question)
  player1_answer jsonb,                      -- { value: 7 } or { text: "..." } or { choice: "opt1" }
  player2_answer jsonb,
  player1_answered_at timestamptz,
  player2_answered_at timestamptz,
  both_answered boolean NOT NULL DEFAULT false,
  -- Alignment (check_in mode)
  alignment_gap numeric(5,2),               -- absolute diff for scale questions
  alignment_label text CHECK (alignment_label IN ('aligned', 'close', 'talk_about_it')),
  -- Date night dare
  dare_completed boolean,
  dare_completed_by uuid REFERENCES public.profiles(id),
  coyyns_earned int DEFAULT 0,
  -- Journal (deep_dive mode)
  player1_journal text,
  player2_journal text,
  -- Shared
  is_skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_rounds_session ON public.game_rounds (session_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_question ON public.game_rounds (question_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_both ON public.game_rounds (session_id, both_answered);

-- Unique constraint: one round number per session
ALTER TABLE public.game_rounds ADD CONSTRAINT game_rounds_session_round_unique
  UNIQUE (session_id, round_number);

-- ============================================================
-- 5. answer_history — tracks answers across sessions for trajectory
-- ============================================================

CREATE TABLE IF NOT EXISTS public.answer_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  question_id uuid NOT NULL REFERENCES public.question_bank(id),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
  answer_value jsonb NOT NULL,               -- { value: 7 } or { text: "..." }
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_answer_history_user_question
  ON public.answer_history (user_id, question_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answer_history_session
  ON public.answer_history (session_id);

-- ============================================================
-- 6. session_custom_content — partner-authored questions/dares
-- ============================================================

CREATE TABLE IF NOT EXISTS public.session_custom_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  target_partner_id uuid NOT NULL REFERENCES public.profiles(id),
  content_type text NOT NULL CHECK (content_type IN ('question', 'dare')),
  text text NOT NULL,
  heat_level int DEFAULT 0 CHECK (heat_level BETWEEN 0 AND 3),
  coyyns_reward int DEFAULT 0,
  coyyns_penalty int DEFAULT 0,
  is_revealed boolean NOT NULL DEFAULT false,  -- hidden until round is played
  round_id uuid REFERENCES public.game_rounds(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_custom_session
  ON public.session_custom_content (session_id);
CREATE INDEX IF NOT EXISTS idx_session_custom_revealed
  ON public.session_custom_content (session_id, is_revealed) WHERE is_revealed = false;

-- ============================================================
-- 7. game_contributions — user-submitted questions to the bank
-- ============================================================

CREATE TABLE IF NOT EXISTS public.game_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  text text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL DEFAULT 'light',
  answer_type text NOT NULL DEFAULT 'open',
  target_mode text NOT NULL DEFAULT 'date_night',
  coyyns_spent int NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  question_id uuid REFERENCES public.question_bank(id),  -- set when approved
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_contributions_user
  ON public.game_contributions (user_id, created_at DESC);

-- ============================================================
-- 8. game_schedules — recurring game night scheduling
-- ============================================================

CREATE TABLE IF NOT EXISTS public.game_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  mode text NOT NULL CHECK (mode IN ('check_in', 'deep_dive', 'date_night')),
  recurrence text NOT NULL DEFAULT 'weekly' CHECK (recurrence IN ('weekly', 'biweekly', 'monthly')),
  day_of_week int CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
  preferred_time time,
  config jsonb DEFAULT '{}',                 -- saved setup config for quick-start
  is_active boolean NOT NULL DEFAULT true,
  next_due_at timestamptz,
  last_played_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_schedules_user
  ON public.game_schedules (created_by, is_active) WHERE is_active = true;

-- ============================================================
-- Trigger: auto-set both_answered when both players submit
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_both_round_answered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.player1_answer IS NOT NULL
     AND NEW.player2_answer IS NOT NULL
     AND NOT NEW.both_answered THEN
    NEW.both_answered := true;

    -- For check_in scale questions, compute alignment gap
    IF NEW.player1_answer ? 'value' AND NEW.player2_answer ? 'value' THEN
      NEW.alignment_gap := ABS(
        (NEW.player1_answer->>'value')::numeric -
        (NEW.player2_answer->>'value')::numeric
      );
      NEW.alignment_label := CASE
        WHEN NEW.alignment_gap <= 1 THEN 'aligned'
        WHEN NEW.alignment_gap <= 3 THEN 'close'
        ELSE 'talk_about_it'
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_both_answered
  BEFORE UPDATE ON public.game_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.check_both_round_answered();

-- ============================================================
-- Trigger: update session updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.game_session_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_game_session_updated
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.game_session_updated();

-- ============================================================
-- RLS Policies
-- ============================================================

-- question_bank: readable by all authenticated, writable by contributors
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active questions"
  ON public.question_bank FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Users can insert contributed questions"
  ON public.question_bank FOR INSERT
  WITH CHECK (auth.uid() = contributed_by AND is_system = false);

-- game_dares: readable by all authenticated
ALTER TABLE public.game_dares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active dares"
  ON public.game_dares FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Users can insert contributed dares"
  ON public.game_dares FOR INSERT
  WITH CHECK (auth.uid() = contributed_by AND is_system = false);

-- game_sessions: only participants
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view"
  ON public.game_sessions FOR SELECT
  USING (auth.uid() IN (created_by, partner_id));

CREATE POLICY "Authenticated users can create sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Session participants can update"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() IN (created_by, partner_id))
  WITH CHECK (auth.uid() IN (created_by, partner_id));

-- game_rounds: session participants only
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Round access via session participant"
  ON public.game_rounds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = session_id AND auth.uid() IN (s.created_by, s.partner_id)
  ));

CREATE POLICY "Round insert via session participant"
  ON public.game_rounds FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = session_id AND auth.uid() IN (s.created_by, s.partner_id)
  ));

CREATE POLICY "Round update via session participant"
  ON public.game_rounds FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = session_id AND auth.uid() IN (s.created_by, s.partner_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = session_id AND auth.uid() IN (s.created_by, s.partner_id)
  ));

-- answer_history: user can see own + partner's answers
ALTER TABLE public.answer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view answer history for their sessions"
  ON public.answer_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = session_id AND auth.uid() IN (s.created_by, s.partner_id)
  ));

CREATE POLICY "Users can insert own answer history"
  ON public.answer_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- session_custom_content: participants only, hidden until revealed
ALTER TABLE public.session_custom_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom content visible to session participants"
  ON public.session_custom_content FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = session_id AND auth.uid() IN (s.created_by, s.partner_id)
  ) AND (
    -- Author can always see their own content
    auth.uid() = author_id
    -- Target can only see revealed content
    OR (auth.uid() = target_partner_id AND is_revealed = true)
  ));

CREATE POLICY "Authors can insert custom content"
  ON public.session_custom_content FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Session participants can update custom content"
  ON public.session_custom_content FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.game_sessions s
    WHERE s.id = session_id AND auth.uid() IN (s.created_by, s.partner_id)
  ));

-- game_contributions: users manage their own
ALTER TABLE public.game_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contributions"
  ON public.game_contributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert contributions"
  ON public.game_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- game_schedules: creator only
ALTER TABLE public.game_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedules"
  ON public.game_schedules FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create schedules"
  ON public.game_schedules FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own schedules"
  ON public.game_schedules FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own schedules"
  ON public.game_schedules FOR DELETE
  USING (auth.uid() = created_by);

-- Service role bypass for all game tables
CREATE POLICY "Service role full access on question_bank"
  ON public.question_bank FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on game_dares"
  ON public.game_dares FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on game_sessions"
  ON public.game_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on game_rounds"
  ON public.game_rounds FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on answer_history"
  ON public.answer_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on session_custom_content"
  ON public.session_custom_content FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on game_contributions"
  ON public.game_contributions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on game_schedules"
  ON public.game_schedules FOR ALL USING (auth.role() = 'service_role');
