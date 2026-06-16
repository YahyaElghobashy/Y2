import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "test@test.com" }
const mockUseAuth: any = vi.fn(() => ({ user: mockUser, partner: null }))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

const mockMaybeSingle = vi.fn()
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ maybeSingle: mockMaybeSingle, single: mockSingle }))
const mockEq2 = vi.fn(() => ({ select: mockSelect, maybeSingle: mockMaybeSingle }))
const mockEq = vi.fn(() => ({ eq: mockEq2 }))
const mockUpsertSelect = vi.fn(() => ({ single: mockSingle }))
const mockUpsert: any = vi.fn(() => ({ select: mockUpsertSelect, then: vi.fn((cb: (r: { error: null }) => void) => cb({ error: null })) }))
const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({ eq: mockEq })),
  upsert: mockUpsert,
}))

// ── Realtime channel mock ─────────────────────────────────────
type RealtimeHandler = { config: { event: string }; cb: (payload: { new: unknown }) => void }
const realtimeHandlers: RealtimeHandler[] = []
const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannelOn = vi.fn(function (
  this: unknown,
  _event: string,
  config: { event: string },
  cb: (payload: { new: unknown }) => void
) {
  realtimeHandlers.push({ config, cb })
  return this
})
const mockChannel = vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe }))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}))

import { usePrayer } from "@/lib/hooks/use-prayer"

function emitRealtime(event: "INSERT" | "UPDATE", row: unknown) {
  for (const h of realtimeHandlers) {
    if (h.config.event === event) h.cb({ new: row })
  }
}

describe("usePrayer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    realtimeHandlers.length = 0
    mockChannelOn.mockImplementation(function (
      this: unknown,
      _event: string,
      config: { event: string },
      cb: (payload: { new: unknown }) => void
    ) {
      realtimeHandlers.push({ config, cb })
      return this
    })
    mockUseAuth.mockReturnValue({ user: mockUser, partner: null })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("returns inert state when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => usePrayer())

      expect(result.current.today).toBeNull()
      expect(result.current.completedCount).toBe(0)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("starts with isLoading true when user is present", () => {
      mockMaybeSingle.mockReturnValue(new Promise(() => {})) // never resolves
      const { result } = renderHook(() => usePrayer())
      expect(result.current.isLoading).toBe(true)
    })

    it("fetches today's prayer log on mount", async () => {
      const todayRow = {
        id: "row-1",
        user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        fajr: true,
        dhuhr: false,
        asr: false,
        maghrib: true,
        isha: false,
        created_at: "",
        updated_at: "",
      }
      mockMaybeSingle.mockResolvedValue({ data: todayRow, error: null })

      const { result } = renderHook(() => usePrayer())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.today).toEqual(todayRow)
      expect(result.current.completedCount).toBe(2)
    })

    it("upserts a new row when no data exists for today", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })
      const newRow = {
        id: "row-new",
        user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
        created_at: "",
        updated_at: "",
      }
      mockSingle.mockResolvedValue({ data: newRow, error: null })

      const { result } = renderHook(() => usePrayer())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockUpsert).toHaveBeenCalled()
      expect(result.current.today).toEqual(newRow)
    })

    it("sets error on fetch failure", async () => {
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: { message: "Network error" },
      })

      const { result } = renderHook(() => usePrayer())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe("Network error")
    })

    it("completedCount counts true prayer values", async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: "row-1",
          user_id: "user-1",
          date: "2026-03-04",
          fajr: true,
          dhuhr: true,
          asr: true,
          maghrib: true,
          isha: true,
          created_at: "",
          updated_at: "",
        },
        error: null,
      })

      const { result } = renderHook(() => usePrayer())

      await waitFor(() => {
        expect(result.current.completedCount).toBe(5)
      })
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("togglePrayer optimistically updates state", async () => {
      const todayRow = {
        id: "row-1",
        user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
        created_at: "",
        updated_at: "",
      }
      mockMaybeSingle.mockResolvedValue({ data: todayRow, error: null })

      // Make upsert return a thenable that resolves
      mockUpsert.mockReturnValue({
        select: mockUpsertSelect,
        then: (cb: (r: { error: null }) => void) => {
          cb({ error: null })
          return { catch: vi.fn() }
        },
      })

      const { result } = renderHook(() => usePrayer())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.togglePrayer("fajr")
      })

      expect(result.current.today?.fajr).toBe(true)
      expect(result.current.completedCount).toBe(1)
    })

    it("togglePrayer is a no-op when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => usePrayer())

      // Should not throw
      act(() => {
        result.current.togglePrayer("fajr")
      })

      expect(result.current.today).toBeNull()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("queries the prayer_log table", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })
      mockSingle.mockResolvedValue({
        data: {
          id: "r",
          user_id: "user-1",
          date: "2026-03-04",
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
          created_at: "",
          updated_at: "",
        },
        error: null,
      })

      renderHook(() => usePrayer())

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith("prayer_log")
      })
    })

    it("upserts with correct user_id and date", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null })
      mockSingle.mockResolvedValue({
        data: {
          id: "r",
          user_id: "user-1",
          date: "2026-03-04",
          fajr: false,
          dhuhr: false,
          asr: false,
          maghrib: false,
          isha: false,
          created_at: "",
          updated_at: "",
        },
        error: null,
      })

      renderHook(() => usePrayer())

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: "user-1",
            date: expect.any(String),
          }),
          { onConflict: "user_id,date" }
        )
      })
    })

    it("togglePrayer upserts with the prayer name and new value", async () => {
      const todayRow = {
        id: "row-1",
        user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
        created_at: "",
        updated_at: "",
      }
      mockMaybeSingle.mockResolvedValue({ data: todayRow, error: null })
      mockUpsert.mockReturnValue({
        select: mockUpsertSelect,
        then: vi.fn((cb: (r: { error: null }) => void) => {
          cb({ error: null })
          return { catch: vi.fn() }
        }),
      })

      const { result } = renderHook(() => usePrayer())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.togglePrayer("asr")
      })

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          asr: true,
        }),
        { onConflict: "user_id,date" }
      )
    })
  })

  // ── Realtime Tests ──────────────────────────────────────────

  describe("realtime", () => {
    const today = new Date().toISOString().split("T")[0]
    const baseRow = {
      id: "row-1",
      user_id: "user-1",
      date: today,
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
      created_at: "",
      updated_at: "",
    }

    it("subscribes to prayer_log INSERT and UPDATE on mount", async () => {
      mockMaybeSingle.mockResolvedValue({ data: baseRow, error: null })

      renderHook(() => usePrayer())

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled()
      })
      expect(mockChannel).toHaveBeenCalled()
      expect(mockChannelOn).toHaveBeenCalledTimes(2)
    })

    it("applies a realtime UPDATE for today's row to local state", async () => {
      mockMaybeSingle.mockResolvedValue({ data: baseRow, error: null })

      const { result } = renderHook(() => usePrayer())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        emitRealtime("UPDATE", { ...baseRow, fajr: true, dhuhr: true })
      })

      expect(result.current.today?.fajr).toBe(true)
      expect(result.current.completedCount).toBe(2)
    })

    it("ignores realtime events for a different date", async () => {
      mockMaybeSingle.mockResolvedValue({ data: baseRow, error: null })

      const { result } = renderHook(() => usePrayer())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        emitRealtime("UPDATE", {
          ...baseRow,
          id: "row-other",
          date: "2000-01-01",
          fajr: true,
        })
      })

      expect(result.current.today?.fajr).toBe(false)
    })

    it("removes the channel on unmount", async () => {
      mockMaybeSingle.mockResolvedValue({ data: baseRow, error: null })

      const { unmount } = renderHook(() => usePrayer())

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled()
      })

      unmount()
      expect(mockRemoveChannel).toHaveBeenCalled()
    })
  })
})
