-- ============================================================
-- T3: Idempotency backstop for the game → wallet CoYYns credit
-- A game session must credit the wallet at most ONCE per user.
-- useGameEngine.completeSession() guards in app code, but this partial
-- unique index makes it bulletproof against a concurrent double-complete:
-- the second insert hits a unique violation, the balance trigger never
-- fires for it, and no double-credit occurs.
--
-- Depends on: 002_coyyns.sql (coyyns_transactions)
-- ============================================================

create unique index if not exists coyyns_transactions_game_session_uniq
  on public.coyyns_transactions (user_id, (metadata ->> 'session_id'))
  where category = 'game';

comment on index public.coyyns_transactions_game_session_uniq is
  'At most one game-completion credit per (user, session). Backs the app-level idempotency guard in useGameEngine.completeSession().';
