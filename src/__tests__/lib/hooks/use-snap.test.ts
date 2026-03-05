import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Auth mock ─────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "test@y2.com" }
const mockPartner = { id: "partner-1", display_name: "Yara" }
const mockUseAuth: any = vi.fn(() => ({ user: mockUser, partner: mockPartner }))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Supabase mock ─────────────────────────────────────────────

let snapQueryResult: any = { data: [], error: null }
let scheduleQueryResult: any = { data: null, error: null }

const mockUpdateEq = vi.fn(() => Promise.resolve({ data: null, error: null }))
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }))
const mockInsertSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
const mockInsertSelect = vi.fn(() => ({ single: mockInsertSingle }))
const mockInsert = vi.fn(() => ({ select: mockInsertSelect }))

const mockLtOrderOrderLimit = vi.fn(() => Promise.resolve({ data: [], error: null }))
const mockLtOrderOrder = vi.fn(() => ({ limit: mockLtOrderOrderLimit }))
const mockLtOrder = vi.fn(() => ({ order: mockLtOrderOrder }))
const mockLt = vi.fn(() => ({ order: mockLtOrder }))

const mockChannelOn = vi.fn(function(this: any) { return this })
const mockChannelSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()

const mockChannelInstance = {
  on: mockChannelOn,
  subscribe: mockChannelSubscribe,
}

const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    if (table === "snap_schedule") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve(scheduleQueryResult)),
          })),
        })),
      }
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve(snapQueryResult)),
        })),
        order: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve(snapQueryResult)),
          })),
        })),
        lt: mockLt,
      })),
      update: mockUpdate,
      insert: mockInsert,
    }
  }),
  channel: vi.fn(() => mockChannelInstance),
  removeChannel: mockRemoveChannel,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

import { useSnap } from "@/lib/hooks/use-snap"

describe("useSnap", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: mockPartner })
    snapQueryResult = { data: [], error: null }
    scheduleQueryResult = { data: null, error: null }
    // Re-wire mockChannelOn since clearAllMocks clears it
    mockChannelOn.mockImplementation(function(this: any) { return this })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("returns inert state when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useSnap())

      expect(result.current.todaySnap).toBeNull()
      expect(result.current.partnerTodaySnap).toBeNull()
      expect(result.current.snapFeed).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isWindowOpen).toBe(false)
      expect(result.current.windowTimeRemaining).toBeNull()
      expect(result.current.hasMore).toBe(false)
    })

    it("sets isLoading true initially then false after fetch", async () => {
      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
    })

    it("fetches today's snap for user from snaps table", async () => {
      const todaySnap = {
        id: "snap-1",
        user_id: "user-1",
        snap_date: new Intl.DateTimeFormat("en-CA", {
          timeZone: "Africa/Cairo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()),
        photo_url: null,
        caption: null,
        reaction_emoji: null,
        window_opened_at: null,
        created_at: new Date().toISOString(),
      }

      snapQueryResult = { data: [todaySnap], error: null }

      const { result } = renderHook(() => useSnap())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(mockSupabase.from).toHaveBeenCalledWith("snaps")
      expect(result.current.todaySnap).toEqual(todaySnap)
    })

    it("fetches snap schedule for today", async () => {
      scheduleQueryResult = {
        data: { id: "sched-1", schedule_date: "2026-03-05", trigger_time: "14:30:00", created_at: "" },
        error: null,
      }

      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockSupabase.from).toHaveBeenCalledWith("snap_schedule")
    })

    it("isWindowOpen is false when no schedule exists", async () => {
      scheduleQueryResult = { data: null, error: null }

      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.isWindowOpen).toBe(false)
    })

    it("isWindowOpen is false when snap already has photo_url", async () => {
      snapQueryResult = {
        data: [{
          id: "snap-1", user_id: "user-1", snap_date: "2026-03-05",
          photo_url: "https://example.com/photo.jpg",
          caption: null, reaction_emoji: null, window_opened_at: null, created_at: "",
        }],
        error: null,
      }
      scheduleQueryResult = {
        data: { id: "sched-1", schedule_date: "2026-03-05", trigger_time: "14:30:00", created_at: "" },
        error: null,
      }

      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.isWindowOpen).toBe(false)
    })

    it("hasMore starts true when feed returns full page", async () => {
      const fullFeed = Array.from({ length: 28 }, (_, i) => ({
        id: `snap-${i}`,
        user_id: i % 2 === 0 ? "user-1" : "partner-1",
        snap_date: `2026-02-${String(28 - Math.floor(i / 2)).padStart(2, "0")}`,
        photo_url: `https://example.com/${i}.jpg`,
        caption: null, reaction_emoji: null, window_opened_at: null, created_at: "",
      }))
      snapQueryResult = { data: fullFeed, error: null }

      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.hasMore).toBe(true)
    })

    it("sets error state on fetch failure", async () => {
      snapQueryResult = { data: null, error: { message: "Network error" } }

      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBe("Network error")
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("submitSnap updates existing placeholder snap row", async () => {
      snapQueryResult = {
        data: [{
          id: "snap-placeholder", user_id: "user-1", snap_date: "2026-03-05",
          photo_url: null, caption: null, reaction_emoji: null,
          window_opened_at: "2026-03-05T14:30:00Z", created_at: "",
        }],
        error: null,
      }

      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.submitSnap("https://example.com/snap.webp", "Hello!")
      })

      expect(mockUpdate).toHaveBeenCalled()
    })

    it("submitSnap with optimistic update sets todaySnap.photo_url", async () => {
      snapQueryResult = {
        data: [{
          id: "snap-placeholder", user_id: "user-1", snap_date: "2026-03-05",
          photo_url: null, caption: null, reaction_emoji: null,
          window_opened_at: null, created_at: "",
        }],
        error: null,
      }

      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.submitSnap("https://example.com/photo.webp")
      })

      expect(result.current.todaySnap?.photo_url).toBe("https://example.com/photo.webp")
    })

    it("reactToSnap updates snap with emoji", async () => {
      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.reactToSnap("snap-1", "❤️")
      })

      expect(mockUpdate).toHaveBeenCalled()
      expect(mockUpdateEq).toHaveBeenCalledWith("id", "snap-1")
    })

    it("reactToSnap with null emoji clears reaction", async () => {
      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.reactToSnap("snap-1", null)
      })

      expect(mockUpdate).toHaveBeenCalled()
    })

    it("loadMore fetches older snaps using lt filter", async () => {
      // Need 28 items (FEED_PAGE_SIZE * 2) to keep hasMore=true
      const fullFeed = Array.from({ length: 28 }, (_, i) => ({
        id: `snap-${i}`,
        user_id: i % 2 === 0 ? "user-1" : "partner-1",
        snap_date: `2026-03-${String(28 - Math.floor(i / 2)).padStart(2, "0")}`,
        photo_url: `https://example.com/${i}.jpg`,
        caption: null, reaction_emoji: null, window_opened_at: null, created_at: "",
      }))
      snapQueryResult = { data: fullFeed, error: null }

      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.loadMore()
      })

      expect(mockLt).toHaveBeenCalledWith("snap_date", "2026-03-15")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("creates realtime subscription for snaps table", async () => {
      const { result } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(mockSupabase.channel).toHaveBeenCalledWith("snaps_realtime")
      expect(mockChannelOn).toHaveBeenCalledTimes(2) // INSERT + UPDATE
      expect(mockChannelSubscribe).toHaveBeenCalled()
    })

    it("cleans up channel on unmount", async () => {
      const { result, unmount } = renderHook(() => useSnap())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      unmount()

      expect(mockRemoveChannel).toHaveBeenCalled()
    })
  })
})
