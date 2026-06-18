import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks (hoisted) ---
const { mockExchange, mockCreateServerClient, mockRedirect, redirectResponses } =
  vi.hoisted(() => ({
    mockExchange: vi.fn(),
    mockCreateServerClient: vi.fn(),
    mockRedirect: vi.fn(),
    redirectResponses: [] as Array<{ url: string; cookies: { set: ReturnType<typeof vi.fn> } }>,
  }))

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}))

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: string) => {
      mockRedirect(url)
      const res = { type: "redirect", url, cookies: { set: vi.fn() } }
      redirectResponses.push(res)
      return res
    },
  },
}))

import { GET } from "@/app/auth/callback/route"

const ORIGIN = "https://y2-two.vercel.app"

function createMockRequest(query: Record<string, string>) {
  const searchParams = new URLSearchParams(query)
  return {
    nextUrl: { searchParams, origin: ORIGIN },
    cookies: { getAll: vi.fn(() => []) },
  } as unknown as Parameters<typeof GET>[0]
}

describe("auth/callback route (PKCE confirmation)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    redirectResponses.length = 0
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key")
    mockExchange.mockResolvedValue({ data: {}, error: null })
    mockCreateServerClient.mockReturnValue({
      auth: { exchangeCodeForSession: mockExchange },
    })
  })

  // ── Unit — exports ──
  it("exports a GET handler", () => {
    expect(typeof GET).toBe("function")
  })

  // ── Interaction — happy path ──
  it("exchanges the code for a session", async () => {
    await GET(createMockRequest({ code: "abc-123", next: "/" }))
    expect(mockExchange).toHaveBeenCalledWith("abc-123")
  })

  it("redirects to next on success", async () => {
    await GET(createMockRequest({ code: "abc-123", next: "/us" }))
    expect(mockRedirect).toHaveBeenLastCalledWith(`${ORIGIN}/us`)
  })

  it("defaults next to / when absent", async () => {
    await GET(createMockRequest({ code: "abc-123" }))
    expect(mockRedirect).toHaveBeenLastCalledWith(`${ORIGIN}/`)
  })

  // ── Unit — failure paths ──
  it("redirects to /login?error when code is missing", async () => {
    await GET(createMockRequest({ next: "/" }))
    expect(mockExchange).not.toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith(
      `${ORIGIN}/login?error=auth_callback_failed`
    )
  })

  it("redirects to /login?error when exchange fails", async () => {
    mockExchange.mockResolvedValueOnce({ data: null, error: { message: "bad code" } })
    await GET(createMockRequest({ code: "bad", next: "/" }))
    expect(mockRedirect).toHaveBeenLastCalledWith(
      `${ORIGIN}/login?error=auth_callback_failed`
    )
  })

  // ── Security — open redirect guard ──
  it("ignores absolute-URL next (open redirect) and uses /", async () => {
    await GET(createMockRequest({ code: "abc-123", next: "https://evil.com" }))
    expect(mockRedirect).toHaveBeenLastCalledWith(`${ORIGIN}/`)
  })

  it("ignores protocol-relative next (//evil.com) and uses /", async () => {
    await GET(createMockRequest({ code: "abc-123", next: "//evil.com" }))
    expect(mockRedirect).toHaveBeenLastCalledWith(`${ORIGIN}/`)
  })

  // ── Integration — server client wiring ──
  it("builds a server client that reads request cookies", async () => {
    const req = createMockRequest({ code: "abc-123" })
    await GET(req)
    expect(mockCreateServerClient).toHaveBeenCalledOnce()
    const config = mockCreateServerClient.mock.calls[0][2] as {
      cookies: { getAll: () => unknown }
    }
    config.cookies.getAll()
    expect(
      (req as unknown as { cookies: { getAll: ReturnType<typeof vi.fn> } }).cookies
        .getAll
    ).toHaveBeenCalled()
  })

  it("forwards refreshed cookies onto the redirect response via setAll", async () => {
    await GET(createMockRequest({ code: "abc-123", next: "/" }))
    const config = mockCreateServerClient.mock.calls[0][2] as {
      cookies: { setAll: (c: Array<{ name: string; value: string; options: object }>) => void }
    }
    // The success redirect response is the one cookies should land on.
    const successResponse = redirectResponses[redirectResponses.length - 1]
    config.cookies.setAll([{ name: "sb-access-token", value: "tok", options: {} }])
    expect(successResponse.cookies.set).toHaveBeenCalledWith(
      "sb-access-token",
      "tok",
      {}
    )
  })
})
