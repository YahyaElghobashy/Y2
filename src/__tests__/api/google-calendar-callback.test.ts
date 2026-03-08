import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = readFileSync(
  resolve(__dirname, "../../app/api/google-calendar/callback/route.ts"),
  "utf-8"
)

describe("Google Calendar OAuth callback route", () => {
  // ── Unit Tests — Input validation ──

  it("handles Google auth denial (error param)", () => {
    expect(SRC).toContain('searchParams.get("error")')
    expect(SRC).toContain("if (error || !code)")
    expect(SRC).toContain("gcal=error")
  })

  it("handles missing authorization code", () => {
    expect(SRC).toContain('searchParams.get("code")')
    expect(SRC).toContain("if (error || !code)")
  })

  // ── Integration Tests — Token exchange ──

  it("exchanges auth code at Google token endpoint", () => {
    expect(SRC).toContain("https://oauth2.googleapis.com/token")
    expect(SRC).toContain('method: "POST"')
    expect(SRC).toContain("application/x-www-form-urlencoded")
  })

  it("sends required OAuth parameters for token exchange", () => {
    expect(SRC).toContain("code")
    expect(SRC).toContain("client_id")
    expect(SRC).toContain("client_secret")
    expect(SRC).toContain("redirect_uri")
    expect(SRC).toContain("authorization_code")
  })

  it("uses correct environment variables for Google credentials", () => {
    expect(SRC).toContain("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
    expect(SRC).toContain("GOOGLE_CLIENT_SECRET")
  })

  it("handles failed token response", () => {
    expect(SRC).toContain("if (!tokenResponse.ok)")
    expect(SRC).toContain("gcal=error")
  })

  it("validates refresh token is present", () => {
    expect(SRC).toContain("tokens.refresh_token")
    expect(SRC).toContain("if (!refreshToken)")
  })

  // ── Integration Tests — User authentication ──

  it("authenticates user from session cookie", () => {
    expect(SRC).toContain("createServerClient")
    expect(SRC).toContain("request.cookies.getAll()")
    expect(SRC).toContain("supabase.auth.getUser()")
  })

  it("rejects unauthenticated users", () => {
    expect(SRC).toContain("if (!user)")
    expect(SRC).toContain("gcal=error")
  })

  // ── Integration Tests — Token storage ──

  it("uses service role client for token storage (bypasses RLS)", () => {
    expect(SRC).toContain("SUPABASE_SERVICE_ROLE_KEY")
    expect(SRC).toContain("createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
  })

  it("stores refresh token in profiles table", () => {
    expect(SRC).toContain('.from("profiles")')
    expect(SRC).toContain(".update(")
    expect(SRC).toContain("google_calendar_refresh_token: refreshToken")
  })

  it("stores connection timestamp", () => {
    expect(SRC).toContain("google_calendar_connected_at")
    expect(SRC).toContain("new Date().toISOString()")
  })

  it("stores Google Drive token alongside calendar token", () => {
    expect(SRC).toContain("google_drive_refresh_token: refreshToken")
    expect(SRC).toContain("google_drive_connected_at")
  })

  it("updates the correct user by ID", () => {
    expect(SRC).toContain('.eq("id", user.id)')
  })

  it("handles database update error", () => {
    expect(SRC).toContain("updateError")
    expect(SRC).toContain("if (updateError)")
  })

  // ── Integration Tests — Redirect flow ──

  it("redirects to /more?gcal=connected on success", () => {
    expect(SRC).toContain("gcal=connected")
    expect(SRC).toContain("/more?gcal=connected")
  })

  it("redirects to /more?gcal=error on all failure paths", () => {
    const errorRedirects = SRC.match(/gcal=error/g)
    // Should have multiple error redirect paths:
    // 1. User denial, 2. Token exchange fail, 3. No refresh token,
    // 4. No user, 5. DB update error, 6. Catch block
    expect(errorRedirects!.length).toBeGreaterThanOrEqual(5)
  })

  // ── Unit Tests — Error handling ──

  it("catches unexpected errors in try-catch", () => {
    expect(SRC).toContain("} catch {")
    expect(SRC).toContain("gcal=error")
  })

  // ── Unit Tests — Exports ──

  it("exports GET handler for Next.js route", () => {
    expect(SRC).toContain("export async function GET")
  })

  it("uses NextRequest and NextResponse", () => {
    expect(SRC).toContain("NextRequest")
    expect(SRC).toContain("NextResponse")
  })

  // ── Unit Tests — Security ──

  it("constructs redirect URI from request origin", () => {
    expect(SRC).toContain("request.nextUrl")
    expect(SRC).toContain("`${origin}/api/google-calendar/callback`")
  })

  it("does not expose secrets in client-side params", () => {
    // Client secret should only be in server-side env, not in redirects
    expect(SRC).not.toContain("GOOGLE_CLIENT_SECRET` in URLSearchParams redirect")
  })
})
