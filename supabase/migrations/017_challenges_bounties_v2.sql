-- ============================================================
-- T809: V2 Challenges + Bounties Migration
-- Evolves challenges table for accept/dispute flow.
-- Creates bounties & bounty_claims tables.
-- Adds RPC functions for cross-user CoYYns transfers.
--
-- Depends on: 001_auth_profiles.sql, 002_coyyns.sql,
--             012_challenges.sql
-- ============================================================


-- ── 1. ALTER CHALLENGES TABLE ─────────────────────────────────

-- 1a. Update any existing rows with stakes < 5 before tightening constraint
UPDATE public.challenges SET stakes = 5 WHERE stakes < 5;

-- 1b. Drop and recreate status CHECK to add V2 statuses
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_status_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_status_check
  CHECK (status IN (
    'pending_acceptance', 'active', 'pending_resolution',
    'completed', 'resolved', 'disputed', 'expired', 'cancelled'
  ));

-- 1c. Tighten stake constraint (>= 5 minimum bet)
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_stakes_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_stakes_check
  CHECK (stakes >= 5);

-- 1d. Add new columns for V2 flow
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS acceptor_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS resolution_note text;

-- 1e. Rebuild partial index to cover new filterable statuses
DROP INDEX IF EXISTS challenges_status_idx;
CREATE INDEX challenges_status_idx ON public.challenges(status)
  WHERE status IN ('pending_acceptance', 'active', 'pending_resolution', 'disputed');

COMMENT ON COLUMN public.challenges.acceptor_id IS
  'The user who accepted the challenge. NULL until accepted.';
COMMENT ON COLUMN public.challenges.resolution_note IS
  'Free-text note for disputes or resolution context.';


-- ── 2. BOUNTIES TABLE ─────────────────────────────────────────

CREATE TABLE public.bounties (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title               text        NOT NULL,
  trigger_description text        NOT NULL,
  reward              integer     NOT NULL CHECK (reward > 0),
  is_recurring        boolean     NOT NULL DEFAULT true,
  is_active           boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bounties_is_active_idx ON public.bounties(is_active)
  WHERE is_active = true;
CREATE INDEX bounties_creator_id_idx ON public.bounties(creator_id);

COMMENT ON TABLE public.bounties IS
  'Standing rewards that partners can claim. Honor system — no proof required.';
COMMENT ON COLUMN public.bounties.trigger_description IS
  'What the claimer must do to earn the reward. E.g. "Cook dinner", "Give a back rub".';
COMMENT ON COLUMN public.bounties.is_recurring IS
  'If true, bounty stays active after payout and can be claimed again.';


-- ── 3. BOUNTY_CLAIMS TABLE ────────────────────────────────────

CREATE TABLE public.bounty_claims (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id     uuid        NOT NULL REFERENCES public.bounties(id) ON DELETE CASCADE,
  claimer_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  confirmed_by  uuid        REFERENCES public.profiles(id),
  status        text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'denied')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bounty_claims_bounty_id_idx ON public.bounty_claims(bounty_id);
CREATE INDEX bounty_claims_status_idx ON public.bounty_claims(status)
  WHERE status = 'pending';

COMMENT ON TABLE public.bounty_claims IS
  'Claims against standing bounties. Claimer says "I did it", creator confirms or denies.';


-- ── 4. TRIGGERS ───────────────────────────────────────────────
-- Reuse set_updated_at() from 001_auth_profiles.sql

CREATE TRIGGER bounties_set_updated_at
  BEFORE UPDATE ON public.bounties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER bounty_claims_set_updated_at
  BEFORE UPDATE ON public.bounty_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- ── 5. ROW LEVEL SECURITY ─────────────────────────────────────

-- Bounties
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bounties: authenticated read"
  ON public.bounties FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "bounties: creator insert"
  ON public.bounties FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "bounties: authenticated update"
  ON public.bounties FOR UPDATE TO authenticated
  USING (true);

-- Bounty Claims
ALTER TABLE public.bounty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bounty_claims: authenticated read"
  ON public.bounty_claims FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "bounty_claims: claimer insert"
  ON public.bounty_claims FOR INSERT TO authenticated
  WITH CHECK (claimer_id = auth.uid());

CREATE POLICY "bounty_claims: authenticated update"
  ON public.bounty_claims FOR UPDATE TO authenticated
  USING (true);


-- ── 6. RPC: RESOLVE CHALLENGE PAYOUT ──────────────────────────
-- Called by the loser (confirmer) to pay the winner.
-- SECURITY DEFINER bypasses RLS so we can insert a transaction
-- for the winner (who is a different user).

CREATE OR REPLACE FUNCTION public.resolve_challenge_payout(
  p_challenge_id uuid,
  p_winner_id uuid,
  p_amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge public.challenges;
BEGIN
  -- Lock and fetch challenge
  SELECT * INTO v_challenge
  FROM public.challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  IF v_challenge.status != 'pending_resolution' THEN
    RAISE EXCEPTION 'Challenge is not pending resolution (status: %)', v_challenge.status;
  END IF;

  -- Insert earn transaction for winner (bypasses RLS via SECURITY DEFINER)
  INSERT INTO public.coyyns_transactions (user_id, amount, type, category, description, metadata)
  VALUES (
    p_winner_id,
    p_amount,
    'earn',
    'challenge_win',
    'Won challenge: ' || v_challenge.title,
    jsonb_build_object('challenge_id', p_challenge_id)
  );

  -- Update challenge to resolved
  UPDATE public.challenges
  SET status = 'resolved',
      winner_id = p_winner_id,
      actual_transfer = p_amount
  WHERE id = p_challenge_id;
END;
$$;


-- ── 7. RPC: REFUND CHALLENGE STAKE ────────────────────────────
-- Called when a challenge is declined or cancelled.
-- Refunds creator (and acceptor if they staked).

CREATE OR REPLACE FUNCTION public.refund_challenge_stake(
  p_challenge_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge public.challenges;
BEGIN
  SELECT * INTO v_challenge
  FROM public.challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF v_challenge IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  IF v_challenge.status NOT IN ('pending_acceptance', 'active', 'disputed') THEN
    RAISE EXCEPTION 'Challenge cannot be refunded (status: %)', v_challenge.status;
  END IF;

  -- Refund creator
  INSERT INTO public.coyyns_transactions (user_id, amount, type, category, description, metadata)
  VALUES (
    v_challenge.creator_id,
    v_challenge.stakes,
    'earn',
    'challenge_refund',
    'Refund: ' || v_challenge.title,
    jsonb_build_object('challenge_id', p_challenge_id)
  );

  -- Refund acceptor if they staked
  IF v_challenge.acceptor_id IS NOT NULL THEN
    INSERT INTO public.coyyns_transactions (user_id, amount, type, category, description, metadata)
    VALUES (
      v_challenge.acceptor_id,
      v_challenge.stakes,
      'earn',
      'challenge_refund',
      'Refund: ' || v_challenge.title,
      jsonb_build_object('challenge_id', p_challenge_id)
    );
  END IF;

  -- Mark cancelled
  UPDATE public.challenges
  SET status = 'cancelled'
  WHERE id = p_challenge_id;
END;
$$;


-- ── 8. RPC: CONFIRM BOUNTY CLAIM ──────────────────────────────
-- Called by the bounty creator to confirm a claim and pay the claimer.

CREATE OR REPLACE FUNCTION public.confirm_bounty_claim(
  p_claim_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim public.bounty_claims;
  v_bounty public.bounties;
BEGIN
  SELECT * INTO v_claim
  FROM public.bounty_claims
  WHERE id = p_claim_id
  FOR UPDATE;

  IF v_claim IS NULL THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;

  IF v_claim.status != 'pending' THEN
    RAISE EXCEPTION 'Claim is not pending (status: %)', v_claim.status;
  END IF;

  SELECT * INTO v_bounty
  FROM public.bounties
  WHERE id = v_claim.bounty_id;

  IF v_bounty IS NULL THEN
    RAISE EXCEPTION 'Bounty not found';
  END IF;

  -- Pay claimer (insert earn transaction)
  INSERT INTO public.coyyns_transactions (user_id, amount, type, category, description, metadata)
  VALUES (
    v_claim.claimer_id,
    v_bounty.reward,
    'earn',
    'bounty_reward',
    'Bounty: ' || v_bounty.title,
    jsonb_build_object('bounty_id', v_bounty.id, 'claim_id', p_claim_id)
  );

  -- Update claim status
  UPDATE public.bounty_claims
  SET status = 'confirmed',
      confirmed_by = auth.uid()
  WHERE id = p_claim_id;

  -- Deactivate non-recurring bounties
  IF NOT v_bounty.is_recurring THEN
    UPDATE public.bounties
    SET is_active = false
    WHERE id = v_bounty.id;
  END IF;
END;
$$;


-- ── 9. REALTIME ───────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.bounties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bounty_claims;
