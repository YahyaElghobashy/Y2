-- ============================================================
-- 033: Bypass onboarding for all existing profiles
-- Temporary migration: marks all profiles as onboarding-complete
-- so the onboarding flow doesn't fire even if the client guard
-- is accidentally re-enabled.
-- ============================================================

UPDATE profiles
SET onboarding_step = 'ready',
    onboarding_completed_at = NOW()
WHERE onboarding_completed_at IS NULL;
