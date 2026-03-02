# T202: Supabase Client Setup — Build Plan

## Files to Create

| # | Path | Purpose |
|---|---|---|
| 1 | `src/lib/types/database.types.ts` | Generated DB types placeholder (profiles table from T201) |
| 2 | `src/lib/supabase/client.ts` | Browser singleton client via `createBrowserClient` |
| 3 | `src/lib/supabase/server.ts` | Per-request server client via `createServerClient` + `cookies()` |
| 4 | `src/lib/supabase/middleware.ts` | Session refresh middleware helper (`updateSession`) |
| 5 | `src/__tests__/lib/supabase/client.test.ts` | Browser client tests (singleton, shape) |
| 6 | `src/__tests__/lib/supabase/middleware.test.ts` | Middleware tests (returns NextResponse, calls getUser) |

## Files NOT Created (already exist)

- `.env.local.example` — Skipped. `.env.example` already exists at project root with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Dependencies

- `@supabase/ssr` (v0.8.0 — already in package.json)
- `@supabase/supabase-js` (v2.98.0 — already in package.json)
- `next/headers` (cookies) — for server.ts
- `next/server` (NextRequest, NextResponse) — for middleware.ts
- No new packages needed

## Design Tokens Referenced

None — this is infrastructure, no UI.

## Test Cases

### `client.test.ts`
1. `getSupabaseBrowserClient()` returns an object with `.auth`, `.from`, `.channel` (duck-type shape)
2. Calling `getSupabaseBrowserClient()` twice returns the exact same reference (singleton)
3. Tests run with mocked env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### `middleware.test.ts`
1. `updateSession` returns a `NextResponse` object
2. `updateSession` calls `supabase.auth.getUser()` (mock + verify)

### Skipped
- `server.ts` — relies on `cookies()` from `next/headers` which is hard to unit test. Integration coverage via T203/T204.

## Build Order

1. `database.types.ts` first (no dependencies, everything else imports it)
2. `client.ts` (imports only types)
3. `server.ts` (imports types + next/headers)
4. `middleware.ts` (imports types + next/server)
5. Tests
6. `npm run build`

## Edge Cases Addressed

- Missing env vars → `!` non-null assertion fails loudly at runtime (intentional)
- `cookies()` is async in Next.js 15 → `getSupabaseServerClient()` is `async`
- `setAll` in server.ts wrapped in try/catch → silent fail in Server Components (cookies read-only)
- Singleton pattern in client.ts → prevents multiple WebSocket connections
- Server client is NOT a singleton → fresh per request for correct cookie scoping

## Potential Issues

- Next.js 16 (in package.json) may have changed `cookies()` API — will verify during build
- `@supabase/ssr` v0.8.0 may have slightly different API than shown in task spec — will check actual exports
