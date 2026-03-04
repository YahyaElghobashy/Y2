import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock environment
vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "test-client-id-123")

import { getGoogleAuthUrl, disconnectGoogleCalendar } from "@/lib/google-calendar"

describe("google-calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── getGoogleAuthUrl ──

  describe("getGoogleAuthUrl", () => {
    it("returns a Google OAuth URL", () => {
      const url = getGoogleAuthUrl()
      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth")
    })

    it("includes client_id parameter", () => {
      const url = getGoogleAuthUrl()
      expect(url).toContain("client_id=test-client-id-123")
    })

    it("includes calendar.events scope", () => {
      const url = getGoogleAuthUrl()
      expect(url).toContain("calendar.events")
    })

    it("requests offline access", () => {
      const url = getGoogleAuthUrl()
      expect(url).toContain("access_type=offline")
    })

    it("includes response_type=code", () => {
      const url = getGoogleAuthUrl()
      expect(url).toContain("response_type=code")
    })

    it("forces consent prompt", () => {
      const url = getGoogleAuthUrl()
      expect(url).toContain("prompt=consent")
    })
  })

  // ── disconnectGoogleCalendar ──

  describe("disconnectGoogleCalendar", () => {
    it("calls supabase update with null token fields", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      const mockSupabase = {
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      }

      const result = await disconnectGoogleCalendar(
        mockSupabase as never,
        "user-123"
      )

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles")
      expect(mockUpdate).toHaveBeenCalledWith({
        google_calendar_refresh_token: null,
        google_calendar_connected_at: null,
      })
      expect(mockEq).toHaveBeenCalledWith("id", "user-123")
      expect(result.error).toBeNull()
    })

    it("returns error message on failure", async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: { message: "Update failed" },
      })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
      const mockSupabase = {
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      }

      const result = await disconnectGoogleCalendar(
        mockSupabase as never,
        "user-123"
      )

      expect(result.error).toBe("Update failed")
    })
  })
})
