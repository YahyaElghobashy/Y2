import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockUser = { id: "user-1", email: "test@test.com" }
const mockUseAuth: any = vi.fn(() => ({ user: mockUser, partner: null }))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// Build a chainable mock that handles any sequence of .select().eq().eq().maybeSingle()
// and also .select().eq().gte().order()
function createSupabaseMock() {
  let todayResult: { data: unknown; error: unknown } = { data: null, error: null }
  let monthlyResult: { data: unknown; error: unknown } = { data: [], error: null }
  let upsertResult: { data: unknown; error: unknown } = { data: null, error: null }
  const upsertCalls: unknown[] = []

  const realtimeHandlers: Array<{
    config: { event: string }
    cb: (payload: { new: unknown }) => void
  }> = []
  const subscribeMock = vi.fn()
  const removeChannelMock = vi.fn()

  const mock = {
    emit: (event: "INSERT" | "UPDATE", row: unknown) => {
      for (const h of realtimeHandlers) {
        if (h.config.event === event) h.cb({ new: row })
      }
    },
    getSubscribe: () => subscribeMock,
    getRemoveChannel: () => removeChannelMock,
    channel: vi.fn(() => ({
      on: vi.fn(function (
        this: unknown,
        _event: string,
        config: { event: string },
        cb: (payload: { new: unknown }) => void
      ) {
        realtimeHandlers.push({ config, cb })
        return this
      }),
      subscribe: subscribeMock,
    })),
    removeChannel: removeChannelMock,
    setTodayResult: (r: { data: unknown; error: unknown }) => { todayResult = r },
    setMonthlyResult: (r: { data: unknown; error: unknown }) => { monthlyResult = r },
    setUpsertResult: (r: { data: unknown; error: unknown }) => { upsertResult = r },
    getUpsertCalls: () => upsertCalls,
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {}

      chain.select = vi.fn(() => {
        const selectChain: Record<string, unknown> = {}

        selectChain.eq = vi.fn(() => {
          const eq1Chain: Record<string, unknown> = {}

          // .eq().eq() → for today fetch (.eq("user_id").eq("date").maybeSingle())
          eq1Chain.eq = vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve(todayResult)),
              single: vi.fn(() => Promise.resolve(upsertResult)),
            })),
            maybeSingle: vi.fn(() => Promise.resolve(todayResult)),
          }))

          // .eq().gte() → for monthly fetch (.eq("user_id").gte("date").order())
          eq1Chain.gte = vi.fn(() => ({
            order: vi.fn(() => Promise.resolve(monthlyResult)),
          }))

          return eq1Chain
        })

        return selectChain
      })

      chain.upsert = vi.fn((...args: unknown[]) => {
        upsertCalls.push(args)
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve(upsertResult)),
          })),
          then: vi.fn((cb: (r: { error: unknown }) => void) => {
            cb({ error: upsertResult.error })
            return { catch: vi.fn() }
          }),
        }
      })

      return chain
    }),
  }

  return mock
}

let supabaseMock: ReturnType<typeof createSupabaseMock>

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => supabaseMock,
}))

import { useQuran } from "@/lib/hooks/use-quran"

describe("useQuran", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = createSupabaseMock()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: null })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("returns inert state when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useQuran())

      expect(result.current.today).toBeNull()
      expect(result.current.monthlyTotal).toBe(0)
      expect(result.current.dailyGoal).toBe(2)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("starts with isLoading true when user exists", () => {
      // Never resolve so loading stays true
      supabaseMock.setTodayResult({ data: null, error: null })
      const { result } = renderHook(() => useQuran())
      expect(result.current.isLoading).toBe(true)
    })

    it("fetches today's quran log on mount", async () => {
      const todayRow = {
        id: "row-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        pages_read: 3, daily_goal: 5, notes: null,
        created_at: "", updated_at: "",
      }
      supabaseMock.setTodayResult({ data: todayRow, error: null })
      supabaseMock.setMonthlyResult({ data: [todayRow], error: null })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.today).toEqual(todayRow)
      expect(result.current.dailyGoal).toBe(5)
    })

    it("upserts new row when no data exists for today", async () => {
      const newRow = {
        id: "row-new", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        pages_read: 0, daily_goal: 2, notes: null,
        created_at: "", updated_at: "",
      }
      supabaseMock.setTodayResult({ data: null, error: null })
      supabaseMock.setUpsertResult({ data: newRow, error: null })
      supabaseMock.setMonthlyResult({ data: [], error: null })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(supabaseMock.from).toHaveBeenCalled()
      expect(result.current.today).toEqual(newRow)
    })

    it("sets error on fetch failure", async () => {
      supabaseMock.setTodayResult({ data: null, error: { message: "DB error" } })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.error).toBe("DB error")
      })
    })

    it("defaults dailyGoal to 2 when no data", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useQuran())
      expect(result.current.dailyGoal).toBe(2)
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("logPages optimistically increments pages_read", async () => {
      const todayRow = {
        id: "row-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        pages_read: 2, daily_goal: 5, notes: null,
        created_at: "", updated_at: "",
      }
      supabaseMock.setTodayResult({ data: todayRow, error: null })
      supabaseMock.setMonthlyResult({ data: [todayRow], error: null })
      supabaseMock.setUpsertResult({ data: null, error: null })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.logPages(1)
      })

      expect(result.current.today?.pages_read).toBe(3)
    })

    it("logPages rejects negative values", async () => {
      const todayRow = {
        id: "row-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        pages_read: 2, daily_goal: 5, notes: null,
        created_at: "", updated_at: "",
      }
      supabaseMock.setTodayResult({ data: todayRow, error: null })
      supabaseMock.setMonthlyResult({ data: [todayRow], error: null })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.logPages(-3)
      })

      expect(result.current.today?.pages_read).toBe(2)
    })

    it("logPages is no-op when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useQuran())

      act(() => {
        result.current.logPages(1)
      })

      expect(result.current.today).toBeNull()
    })

    it("setDailyGoal rejects values less than 1", async () => {
      const todayRow = {
        id: "row-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        pages_read: 0, daily_goal: 2, notes: null,
        created_at: "", updated_at: "",
      }
      supabaseMock.setTodayResult({ data: todayRow, error: null })
      supabaseMock.setMonthlyResult({ data: [], error: null })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.setDailyGoal(0)
      })

      expect(result.current.dailyGoal).toBe(2)
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("queries the quran_log table", async () => {
      supabaseMock.setTodayResult({ data: null, error: null })
      supabaseMock.setUpsertResult({
        data: { id: "r", user_id: "user-1", date: "2026-03-04", pages_read: 0, daily_goal: 2, notes: null, created_at: "", updated_at: "" },
        error: null,
      })
      supabaseMock.setMonthlyResult({ data: [], error: null })

      renderHook(() => useQuran())

      await waitFor(() => {
        expect(supabaseMock.from).toHaveBeenCalledWith("quran_log")
      })
    })

    it("logPages upserts with correct pages_read value", async () => {
      const todayRow = {
        id: "row-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        pages_read: 5, daily_goal: 10, notes: null,
        created_at: "", updated_at: "",
      }
      supabaseMock.setTodayResult({ data: todayRow, error: null })
      supabaseMock.setMonthlyResult({ data: [todayRow], error: null })
      supabaseMock.setUpsertResult({ data: null, error: null })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.logPages(3)
      })

      const calls = supabaseMock.getUpsertCalls()
      const lastCall = calls[calls.length - 1] as [Record<string, unknown>, unknown]
      expect(lastCall[0]).toMatchObject({
        user_id: "user-1",
        pages_read: 8,
      })
    })
  })

  // ── Realtime Tests ──────────────────────────────────────────

  describe("realtime", () => {
    const today = new Date().toISOString().split("T")[0]
    const baseRow = {
      id: "row-1",
      user_id: "user-1",
      date: today,
      pages_read: 2,
      daily_goal: 5,
      notes: null,
      created_at: "",
      updated_at: "",
    }

    it("subscribes to quran_log INSERT and UPDATE on mount", async () => {
      supabaseMock.setTodayResult({ data: baseRow, error: null })
      supabaseMock.setMonthlyResult({ data: [baseRow], error: null })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(supabaseMock.channel).toHaveBeenCalled()
      expect(supabaseMock.getSubscribe()).toHaveBeenCalled()
    })

    it("applies a realtime UPDATE for today's row and recomputes monthly total", async () => {
      supabaseMock.setTodayResult({ data: baseRow, error: null })
      supabaseMock.setMonthlyResult({ data: [baseRow], error: null })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.monthlyTotal).toBe(2)

      act(() => {
        supabaseMock.emit("UPDATE", { ...baseRow, pages_read: 9 })
      })

      expect(result.current.today?.pages_read).toBe(9)
      expect(result.current.monthlyTotal).toBe(9)
    })

    it("ignores realtime UPDATE for a different date (today unchanged)", async () => {
      supabaseMock.setTodayResult({ data: baseRow, error: null })
      supabaseMock.setMonthlyResult({ data: [baseRow], error: null })

      const { result } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        supabaseMock.emit("UPDATE", {
          ...baseRow,
          id: "row-old",
          date: "2000-01-01",
          pages_read: 99,
        })
      })

      expect(result.current.today?.pages_read).toBe(2)
    })

    it("removes the channel on unmount", async () => {
      supabaseMock.setTodayResult({ data: baseRow, error: null })
      supabaseMock.setMonthlyResult({ data: [baseRow], error: null })

      const { unmount } = renderHook(() => useQuran())

      await waitFor(() => {
        expect(supabaseMock.getSubscribe()).toHaveBeenCalled()
      })

      unmount()
      expect(supabaseMock.getRemoveChannel()).toHaveBeenCalled()
    })
  })
})
