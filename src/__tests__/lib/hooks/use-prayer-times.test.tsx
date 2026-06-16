import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "test@test.com" }
const mockRefreshProfile = vi.fn().mockResolvedValue(undefined)
const mockUseAuth: any = vi.fn()

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// supabase.from("profiles").update({...}).eq("id", ...) → { error }
const mockEq = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn((_values: Record<string, unknown>) => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ update: mockUpdate }))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from: mockFrom }),
}))

import { usePrayerTimes } from "@/lib/hooks/use-prayer-times"

const CAIRO = { latitude: 30.0444, longitude: 31.2357, prayer_method: "Egyptian", timezone: "Africa/Cairo" }

function authWith(profile: any) {
  mockUseAuth.mockReturnValue({ user: mockUser, profile, refreshProfile: mockRefreshProfile })
}

describe("usePrayerTimes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    authWith(null)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Unit: no-location case ──────────────────────────────────
  describe("unit", () => {
    it("reports needsLocation and null times when profile has no coords", () => {
      authWith({ id: "user-1" })
      const { result } = renderHook(() => usePrayerTimes())
      expect(result.current.needsLocation).toBe(true)
      expect(result.current.times).toBeNull()
      expect(result.current.rows).toEqual([])
      expect(result.current.next).toBeNull()
      expect(result.current.countdown).toBeNull()
    })

    it("computes rows + next + countdown when coords are set", () => {
      authWith({ id: "user-1", ...CAIRO })
      const { result } = renderHook(() => usePrayerTimes())
      expect(result.current.needsLocation).toBe(false)
      expect(result.current.times).not.toBeNull()
      expect(result.current.rows.map((r) => r.key)).toEqual([
        "fajr",
        "sunrise",
        "dhuhr",
        "asr",
        "maghrib",
        "isha",
      ])
      expect(result.current.next).not.toBeNull()
      expect(result.current.countdown).toMatch(/^\d+:\d{2}(:\d{2})?$/)
    })

    it("exactly one obligatory row is flagged isNext (sunrise never is)", () => {
      authWith({ id: "user-1", ...CAIRO })
      const { result } = renderHook(() => usePrayerTimes())
      const nextRows = result.current.rows.filter((r) => r.isNext)
      expect(nextRows.length).toBe(1)
      expect(nextRows[0].key).not.toBe("sunrise")
    })
  })

  // ── Integration: persisting location ────────────────────────
  describe("integration — setLocation", () => {
    it("updates profiles with lat/lng/timezone and refreshes profile", async () => {
      authWith({ id: "user-1" })
      const { result } = renderHook(() => usePrayerTimes())

      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.setLocation(40.7128, -74.006)
      })

      expect(ok).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith("profiles")
      const updateArg = mockUpdate.mock.calls[0][0]
      expect(updateArg.latitude).toBe(40.7128)
      expect(updateArg.longitude).toBe(-74.006)
      expect(updateArg).toHaveProperty("timezone")
      expect(mockEq).toHaveBeenCalledWith("id", "user-1")
      expect(mockRefreshProfile).toHaveBeenCalled()
    })

    it("surfaces an error and does not refresh when the update fails", async () => {
      mockEq.mockResolvedValueOnce({ error: { message: "denied" } })
      authWith({ id: "user-1" })
      const { result } = renderHook(() => usePrayerTimes())

      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.setLocation(1, 2)
      })

      expect(ok).toBe(false)
      expect(result.current.error).toBe("denied")
      expect(mockRefreshProfile).not.toHaveBeenCalled()
    })

    it("returns false without calling supabase when there is no user", async () => {
      mockUseAuth.mockReturnValue({ user: null, profile: null, refreshProfile: mockRefreshProfile })
      const { result } = renderHook(() => usePrayerTimes())
      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.setLocation(1, 2)
      })
      expect(ok).toBe(false)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  // ── Interaction: geolocation detection ──────────────────────
  describe("interaction — detectLocation", () => {
    it("reads navigator.geolocation and persists the coords", async () => {
      const getCurrentPosition = vi.fn((success: any) =>
        success({ coords: { latitude: 51.5074, longitude: -0.1278 } }),
      )
      vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } })

      authWith({ id: "user-1" })
      const { result } = renderHook(() => usePrayerTimes())

      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.detectLocation()
      })

      expect(getCurrentPosition).toHaveBeenCalled()
      expect(ok).toBe(true)
      const updateArg = mockUpdate.mock.calls[0][0]
      expect(updateArg.latitude).toBe(51.5074)
      expect(updateArg.longitude).toBe(-0.1278)
      vi.unstubAllGlobals()
    })

    it("errors gracefully when geolocation is denied", async () => {
      const getCurrentPosition = vi.fn((_s: any, failure: any) =>
        failure({ message: "User denied geolocation" }),
      )
      vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } })

      authWith({ id: "user-1" })
      const { result } = renderHook(() => usePrayerTimes())

      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.detectLocation()
      })

      expect(ok).toBe(false)
      expect(result.current.error).toBe("User denied geolocation")
      expect(mockUpdate).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })

    it("errors when geolocation is unavailable", async () => {
      vi.stubGlobal("navigator", {})
      authWith({ id: "user-1" })
      const { result } = renderHook(() => usePrayerTimes())
      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.detectLocation()
      })
      expect(ok).toBe(false)
      expect(result.current.error).toMatch(/not available/i)
      vi.unstubAllGlobals()
    })
  })
})
