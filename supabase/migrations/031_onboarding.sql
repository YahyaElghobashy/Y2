-- ============================================================
-- 027: Onboarding flow
-- Adds onboarding step tracking to profiles table
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT NOT NULL DEFAULT 'welcome',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Mark existing paired users as onboarding-complete so they skip the flow
UPDATE profiles
SET onboarding_step = 'ready',
    onboarding_completed_at = NOW()
WHERE pairing_status = 'paired';

-- Also mark users who already have a display_name set (returning users who set up profile)
UPDATE profiles
SET onboarding_step = 'ready',
    onboarding_completed_at = NOW()
WHERE display_name IS NOT NULL
  AND display_name != 'User'
  AND display_name != ''
  AND onboarding_completed_at IS NULL;
