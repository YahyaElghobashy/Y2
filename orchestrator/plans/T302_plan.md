# T302: useCoyyns Hook — Build Plan

## Files to Create
1. `src/lib/types/coyyns.types.ts` — CoyynsWallet and CoyynsTransaction types
2. `src/lib/hooks/use-coyyns.ts` — The useCoyyns hook (main deliverable)
3. `src/__tests__/lib/hooks/use-coyyns.test.ts` — Tests for the hook

## Files to Modify
1. `src/lib/types/database.types.ts` — Add coyyns_wallets and coyyns_transactions table definitions
2. `docs/COMPONENT_REGISTRY.md` — Register new hook and types
3. `docs/TASK_LOG.md` — Log task completion

## Dependencies on Existing Components
- `@/lib/supabase/client` → `getSupabaseBrowserClient()` (T202)
- `@/lib/providers/AuthProvider` → `useAuth()` for `user` and `partner` (T204)
- `@/lib/types/database.types` → `Database` type for typed Supabase client (T202)
- `@/lib/types/user.types` → `Profile` type (used by AuthProvider)

## Design Tokens Referenced
- None — this is a data-layer hook with no UI. No colors, spacing, or animation tokens needed.

## Implementation Approach

### Types (`coyyns.types.ts`)
- `CoyynsWallet`: id, user_id, balance, lifetime_earned, lifetime_spent (matches DB columns from T301 migration)
- `CoyynsTransaction`: id, user_id, amount, type ('earn'|'spend'), category, description, metadata, created_at

### Database Types Update
- Add `coyyns_wallets` and `coyyns_transactions` table definitions to `database.types.ts`
- Row/Insert/Update types for each table matching the migration schema

### Hook (`use-coyyns.ts`)
- No `"use client"` directive — it's a plain TS hook
- Imports: `useState`, `useEffect`, `useCallback` from React; Supabase client; useAuth; types
- State: `wallet`, `partnerWallet`, `transactions`, `isLoading`, `error`
- Initial load: `useEffect` with `user?.id` dep → `Promise.all` for 3 parallel fetches
- Early return pattern: if `user` is null, return zero/null state with no-op functions
- Realtime: `supabase.channel('coyyns_wallets_changes').on('postgres_changes', ...)` filtered to user_id and partner_id
- `addCoyyns(amount, description, category?)`: validates positive integer → inserts `type: 'earn'` → refreshWallet
- `spendCoyyns(amount, description, category?)`: validates positive integer → checks balance → inserts `type: 'spend'` with `-Math.abs(amount)` → refreshWallet
- `refreshWallet()`: re-fetches user wallet + last 50 transactions
- Cleanup: `useEffect` return removes realtime channel

### Key Constraints
- No optimistic updates — balance updates only after confirmed DB response
- `isLoading` only reflects initial page load, not mutations
- Category defaults to `'manual'` when not provided
- Amount validation: must be positive integer (> 0, Number.isInteger)
- Error is cleared to null at start of each mutation call

## Test Cases
1. Hook returns `isLoading: true` on initial render
2. Hook returns `isLoading: false` and populated wallet after fetch
3. `addCoyyns` calls Supabase insert with `type: 'earn'` and positive amount
4. `addCoyyns` calls `refreshWallet` after successful insert
5. `spendCoyyns` calls insert with `type: 'spend'` and negative amount when balance sufficient
6. `spendCoyyns` does NOT call insert when balance insufficient
7. `spendCoyyns` sets error to "Insufficient CoYYns balance" when balance insufficient
8. Error is cleared at start of each new `addCoyyns` or `spendCoyyns` call
9. `addCoyyns` sets error if amount is not a positive integer
10. Hook returns null wallet and empty transactions when user is null
11. Realtime subscription is established on mount
12. Realtime subscription is cleaned up on unmount

## Potential Issues / Edge Cases
- Auth not resolved (user null): return inert state, re-run effect when user becomes available
- Partner is null (solo session): partnerWallet stays null, no error
- Wallet row missing: wallet stays null, no error set
- Supabase write failures: set error string, no rollback needed (no optimistic updates)
- Rapid mutations: not guarded by isLoading — component-level responsibility
- Realtime disconnect: Supabase handles reconnection internally
- Channel naming: use unique channel name to avoid collisions
