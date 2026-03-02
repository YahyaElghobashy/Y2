import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks (hoisted) ---
const { mockUpdateSession, mockRedirect, mockNext } = vi.hoisted(() => ({
  mockUpdateSession: vi.fn(),
  mockRedirect: vi.fn(),
  mockNext: vi.fn(() => ({ type: "next" })),
}))

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}))

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: mockRedirect,
    next: mockNext,
  },
}))

import { middleware } from "@/middleware"

function createMockRequest(pathname: string) {
  return {
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
  } as Parameters<typeof middleware>[0]
}

describe("middleware", () => {
  const mockResponse = { type: "supabase-response", cookies: { set: vi.fn() } }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateSession.mockResolvedValue({ response: mockResponse, user: null })
    mockRedirect.mockImplementation((url: URL) => ({
      type: "redirect",
      url: url.toString(),
    }))
  })

  it("redirects unauthenticated user from / to /login", async () => {
    const request = createMockRequest("/")
    await middleware(request)

    expect(mockRedirect).toHaveBeenCalledOnce()
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL
    expect(redirectUrl.pathname).toBe("/login")
    expect(redirectUrl.searchParams.get("redirectTo")).toBe("/")
  })

  it("redirects unauthenticated user from /health to /login", async () => {
    const request = createMockRequest("/health")
    await middleware(request)

    expect(mockRedirect).toHaveBeenCalledOnce()
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL
    expect(redirectUrl.pathname).toBe("/login")
  })

  it("redirects unauthenticated user from /settings to /login", async () => {
    const request = createMockRequest("/settings")
    await middleware(request)

    expect(mockRedirect).toHaveBeenCalledOnce()
  })

  it("allows authenticated user to access protected routes", async () => {
    mockUpdateSession.mockResolvedValue({
      response: mockResponse,
      user: { id: "user-1" },
    })

    const request = createMockRequest("/")
    const result = await middleware(request)

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(result).toBe(mockResponse)
  })

  it("redirects authenticated user from /login to /", async () => {
    mockUpdateSession.mockResolvedValue({
      response: mockResponse,
      user: { id: "user-1" },
    })

    const request = createMockRequest("/login")
    await middleware(request)

    expect(mockRedirect).toHaveBeenCalledOnce()
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL
    expect(redirectUrl.pathname).toBe("/")
  })

  it("allows unauthenticated user to access /login", async () => {
    const request = createMockRequest("/login")
    const result = await middleware(request)

    expect(mockRedirect).not.toHaveBeenCalled()
    expect(result).toBe(mockResponse)
  })

  it("calls updateSession with request", async () => {
    const request = createMockRequest("/login")
    await middleware(request)

    expect(mockUpdateSession).toHaveBeenCalledWith(request)
  })

  it("preserves supabase response cookies for authenticated routes", async () => {
    mockUpdateSession.mockResolvedValue({
      response: mockResponse,
      user: { id: "user-1" },
    })

    const request = createMockRequest("/health")
    const result = await middleware(request)

    expect(result).toBe(mockResponse)
  })

  it("fails open on network error", async () => {
    mockUpdateSession.mockRejectedValue(new Error("Network error"))

    const request = createMockRequest("/")
    await middleware(request)

    expect(mockNext).toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("redirects unauthenticated user from nested protected routes", async () => {
    const request = createMockRequest("/us/marketplace")
    await middleware(request)

    expect(mockRedirect).toHaveBeenCalledOnce()
  })

  it("includes redirectTo param in login redirect", async () => {
    const request = createMockRequest("/spirit")
    await middleware(request)

    const redirectUrl = mockRedirect.mock.calls[0][0] as URL
    expect(redirectUrl.searchParams.get("redirectTo")).toBe("/spirit")
  })
})
