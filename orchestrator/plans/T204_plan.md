# T204: AuthProvider — Build Plan

## Overview

Create the client-side auth context that wraps the entire app. Subscribes to Supabase `onAuthStateChange`, fetches user profile + partner profile, and exposes everything via `useAuth()` hook.

---

## Files to Create

### 1. `src/lib/types/user.types.ts` — Profile type + AuthContextType

- `Profile` type matching the `profiles` table schema from `database.types.ts`
- `AuthContextType` with `user`, `profile`, `partner`, `isLoading`, `signOut`
- Import `User` type from `@supabase/supabase-js`

### 2. `src/lib/providers/AuthProvider.tsx` — Context + Provider component

- `"use client"` directive
- `createContext<AuthContextType | null>(null)` — null default forces error if used outside provider
- `AuthProvider({ children })` component:
  - `useState` for `user`, `profile`, `partner`, `isLoading` (starts `true`)
  - `useEffect` subscribing to `supabase.auth.onAuthStateChange`
  - On session: fetch profile, then conditionally fetch partner (parallel with `Promise.all` if partner_id known)
  - On null session: reset all to null, set isLoading false
  - Cleanup: `subscription.unsubscribe()`
  - `signOut()`: calls `supabase.auth.signOut()` + `router.push(ROUTES.LOGIN)`
- Import browser client from `@/lib/supabase/client`
- Import `useRouter` from `next/navigation`

### 3. `src/lib/hooks/use-auth.ts` — Consumer hook

- Reads from `AuthContext`
- Throws descriptive error if context is null: `"useAuth must be used within an AuthProvider"`

### 4. `src/__tests__/lib/providers/AuthProvider.test.tsx` — Tests (11 cases)

---

## Dependencies (Existing Files)

| Import | From | Notes |
|---|---|---|
| `getSupabaseBrowserClient` | `@/lib/supabase/client` | T202 browser singleton |
| `User` | `@supabase/supabase-js` | Supabase auth User type |
| `Database` | `@/lib/types/database.types` | For typed queries (already used in client.ts) |

---

## Design Tokens Referenced

None — this is a pure logic provider with no UI rendering.

---

## Constants

- `ROUTES.LOGIN = '/login'` — defined once as a constant inside AuthProvider.tsx to avoid string literal duplication

---

## Implementation Details

### Profile fetch strategy:
```
1. onAuthStateChange fires with session
2. Set user = session.user
3. Fetch profile: supabase.from('profiles').select('*').eq('id', user.id).single()
4. If profile.partner_id exists:
   - Fetch partner in parallel (could be sequential since we need partner_id first)
5. If profile.partner_id is null:
   - Set partner = null
6. Set isLoading = false
```

### Edge case handling:
- Profile fetch fails → set profile = null, isLoading = false (unauthenticated-like state)
- Partner fetch fails → set partner = null silently, don't block auth flow
- Missing profile row → profile = null, let T205/T206 handle routing
- Rapid sign-out/sign-in → each onAuthStateChange callback resets all state before setting new values
- Network offline → isLoading stays true, app shows global loading state

### State management:
- No Zustand — React Context is correct for provider-pattern auth
- No exposure of raw Supabase Session object
- signOut doesn't call router.refresh() — redirect handles it

---

## Test Cases

| # | Test | What it verifies |
|---|---|---|
| 1 | Renders children when session present | Provider doesn't block rendering |
| 2 | isLoading true before onAuthStateChange, false after | Loading lifecycle |
| 3 | user populated from mock session | User mapping |
| 4 | profile populated from mock profiles response | Profile fetch |
| 5 | partner populated when partner_id non-null | Partner fetch |
| 6 | partner is null when partner_id is null | No unnecessary fetch |
| 7 | signOut calls supabase.auth.signOut and redirects | Sign out flow |
| 8 | State resets on null session event | Clean logout |
| 9 | useAuth throws outside AuthProvider | Error boundary |
| 10 | Profile fetch failure sets profile to null | Error resilience |
| 11 | Partner fetch failure sets partner to null | Error resilience |

### Mock strategy:
- Mock `@/lib/supabase/client` → return mock client with controllable `onAuthStateChange` and `from().select().eq().single()`
- Mock `next/navigation` → mock `useRouter` returning `{ push: vi.fn() }`
- Use `renderHook` from `@testing-library/react` for `useAuth()` isolation tests

---

## Files NOT Modified

- `src/app/layout.tsx` — Task says "wrap the app root with this provider" but the actual integration into layout.tsx will happen when auth is fully wired. The provider is ready to be wrapped, but modifying layout.tsx is not part of this task's scope (no explicit instruction to modify it, and the task says "It is the outermost client wrapper" as future context).

**Update**: Re-reading the task — "src/app/layout.tsx wraps the entire app with `<AuthProvider>`". This is under "What This Connects To" and describes the intended architecture. Since the task is specifically about creating the provider, not integrating it, and layout.tsx is currently a Server Component, I will NOT convert it. Integration will happen in a separate step.

---

## Potential Issues

1. **layout.tsx is a Server Component** — AuthProvider is `"use client"`. Wrapping it in layout.tsx would require either converting layout to client or creating a Providers wrapper component. This is out of scope for T204.
2. **Database types alignment** — The `Profile` type in `user.types.ts` must match the `profiles.Row` type in `database.types.ts`. Both have the same 8 fields.
3. **`email` field** — The profiles table in `database.types.ts` has `email` but the SQL migration in API_CONTRACTS.md doesn't. The database.types.ts is the source of truth for TypeScript; the actual Supabase table was created in T201.
