# T202: Supabase Client Setup — Build Plan

## Files to Create

| # | File | Purpose |
|---|---|---|
| 1 | `src/lib/types/database.types.ts` | Generated DB types placeholder (profiles table from T201) |
| 2 | `src/lib/supabase/client.ts` | Browser singleton client using `@supabase/ssr` |
| 3 | `src/lib/supabase/server.ts` | Server client (per-request, async cookies) |
| 4 | `src/lib/supabase/middleware.ts` | Middleware client (session refresh via `updateSession`) |
| 5 | `.env.local.example` | Environment variable template (no real values) |
| 6 | `src/__tests__/lib/supabase/client.test.ts` | Singleton + duck-type tests for browser client |
| 7 | `src/__tests__/lib/supabase/middleware.test.ts` | updateSession returns NextResponse, calls getUser |

## Dependencies on Existing Code

- `@supabase/ssr` (v0.8.0) — already in `package.json`
- `@supabase/supabase-js` (v2.98.0) — already in `package.json`
- `next/headers` (cookies) — built into Next.js 15
- `next/server` (NextRequest, NextResponse) — built into Next.js 15
- No new packages to install

## Design Tokens Referenced

None — this is infrastructure, no UI.

## Implementation Order

1. **`database.types.ts`** first — all three clients import `Database` type
2. **`client.ts`** — browser singleton, simplest of the three
3. **`server.ts`** — server client, async cookies pattern
4. **`middleware.ts`** — middleware client, session refresh
5. **`.env.local.example`** — env template
6. **Tests** — client.test.ts and middleware.test.ts
7. **Build verification** — `npm run build`

## Test Cases

### `client.test.ts`
- Returns object with `.auth`, `.from`, `.channel` (duck-type shape)
- Calling twice returns exact same reference (singleton)
- Uses mocked env vars: `NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key`

### `middleware.test.ts`
- `updateSession` returns a NextResponse object
- `updateSession` calls `supabase.auth.getUser()` (mock + verify)

## Edge Cases

- Missing env vars → `!` assertion throws at runtime, intentional
- Server client from client component → `cookies()` throws, file separation enforces
- Multiple `getSupabaseBrowserClient()` calls → singleton prevents duplicate WebSocket connections
- `cookies()` is async in Next.js 15 → `getSupabaseServerClient` must be async
- Middleware on static routes → matcher logic is T205's responsibility, not ours

## Potential Issues

- The `@supabase/ssr` v0.8.0 API may differ from the task spec — will verify imports work at build time
- Vitest may need special handling for Next.js server imports (`next/headers`) — tests will mock these
- `.env.local` already exists and is gitignored — `.env.local.example` is the committed template
