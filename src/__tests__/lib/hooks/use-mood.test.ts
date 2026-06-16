import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockPartner = { id: "partner-1", display_name: "Yara" }
const mockUseAuth: ReturnType<typeof vi.fn> = vi.fn(() => ({
  user: mockUser,
  partner: mockPartner,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Test Data ─────────────────────────────────────────────────

const MOCK_USER_MOOD = {
  id: "mood-1",
  user_id: "user-1",
  mood: "good",
  note: "Feeling great!",
  mood_date: "2026-03-05",
  logged_at: "2026-03-05T08:00:00Z",
}

const MOCK_PARTNER_MOOD = {
  id: "mood-2",
  user_id: "partner-1",
  mood: "calm",
  note: "Peaceful day",
  mood_date: "2026-03-05",
  logged_at: "2026-03-05T09:00:00Z",
}

// ── Mutable query result refs ─────────────────────────────────

let userMoodResult: { data: unknown; error: unknown } = { data: null, error: null }
let partnerMoodResult: { data: unknown; error: unknown } = { data: null, error: null }
let upsertResult: { data: unknown; error: unknown } = { data: null, error: null }

const upsertCalls: unknown[] = []

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()

// Capture each registered realtime listener so tests can assert filters and
// drive payloads through the exact handler.
type RealtimeHandler = {
  config: { event: string; filter?: string }
  cb: (payload: { new: unknown }) => void
}
const realtimeHandlers: RealtimeHandler[] = []
const mockChannelOn = vi.fn(function (
  this: unknown,
  _event: string,
  config: { event: string; filter?: string },
  cb: (payload: { new: unknown }) => void
) {
  realtimeHandlers.push({ config, cb })
  return this
})

function emitRealtime(filter: string, event: "INSERT" | "UPDATE", row: unknown) {
  for (const h of realtimeHandlers) {
    if (h.config.filter === filter && h.config.event === event) h.cb({ new: row })
  }
}

function buildChain() {
  const state = { userId: "" }
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn((field: string, value: string) => {
    if (field === "user_id") state.userId = value
    return chain
  })
  chain.maybeSingle = vi.fn(() => {
    if (state.userId === "user-1") return Promise.resolve(userMoodResult)
    if (state.userId === "partner-1") return Promise.resolve(partnerMoodResult)
    return Promise.resolve({ data: null, error: null })
  })
  chain.single = vi.fn(() => Promise.resolve(upsertResult))
  chain.upsert = vi.fn((data: unknown, opts: unknown) => {
    upsertCalls.push({ data, opts })
    return chain
  })

  return chain
}

const mockFrom = vi.fn(() => buildChain())

const stableSupabase = {
  from: mockFrom,
  channel: vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe })),
  removeChannel: mockRemoveChannel,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

import { useMood } from "@/lib/hooks/use-mood"

describe("useMood", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: mockPartner })
    userMoodResult = { data: MOCK_USER_MOOD, error: null }
    partnerMoodResult = { data: MOCK_PARTNER_MOOD, error: null }
    upsertResult = { data: MOCK_USER_MOOD, error: null }
    upsertCalls.length = 0
    realtimeHandlers.length = 0
    mockChannelOn.mockImplementation(function (
      this: unknown,
      _event: string,
      config: { event: string; filter?: string },
      cb: (payload: { new: unknown }) => void
    ) {
      realtimeHandlers.push({ config, cb })
      return this
    })
    // Reset mockFrom to default implementation
    mockFrom.mockImplementation(() => buildChain())
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("returns inert state when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useMood())

      expect(result.current.todayMood).toBeNull()
      expect(result.current.partnerMood).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("fetches today's mood for user from mood_log table", async () => {
      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(mockFrom).toHaveBeenCalledWith("mood_log")
      expect(result.current.todayMood).toEqual(MOCK_USER_MOOD)
    })

    it("fetches partner mood for today", async () => {
      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.partnerMood).toEqual(MOCK_PARTNER_MOOD)
    })

    it("isLoading transitions from true to false", async () => {
      const { result } = renderHook(() => useMood())

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      await waitFor(() => expect(result.current.isLoading).toBe(false))
    })

    it("sets error when user mood fetch fails", async () => {
      userMoodResult = { data: null, error: { message: "Network error" } }

      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.error).toBe("Network error"))
    })

    it("sets error when partner mood fetch fails", async () => {
      partnerMoodResult = { data: null, error: { message: "Partner fetch failed" } }

      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.error).toBe("Partner fetch failed"))
    })

    it("handles null partner gracefully", async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, partner: null })

      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.todayMood).toEqual(MOCK_USER_MOOD)
      expect(result.current.partnerMood).toBeNull()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("setMood calls upsert with onConflict user_id,mood_date", async () => {
      upsertResult = { data: { ...MOCK_USER_MOOD, mood: "calm" }, error: null }
      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.setMood("calm")
      })

      expect(upsertCalls).toHaveLength(1)
      expect(upsertCalls[0]).toEqual(
        expect.objectContaining({
          opts: { onConflict: "user_id,mood_date" },
        })
      )
    })

    it("setMood passes mood value correctly", async () => {
      upsertResult = { data: { ...MOCK_USER_MOOD, mood: "frustrated" }, error: null }
      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.setMood("frustrated")
      })

      expect(upsertCalls).toHaveLength(1)
      const upsertData = (upsertCalls[0] as { data: Record<string, unknown> }).data
      expect(upsertData.mood).toBe("frustrated")
      expect(upsertData.user_id).toBe("user-1")
    })

    it("setMood passes note when provided", async () => {
      upsertResult = { data: { ...MOCK_USER_MOOD, mood: "good", note: "Great day!" }, error: null }
      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.setMood("good", "Great day!")
      })

      expect(upsertCalls).toHaveLength(1)
      const upsertData = (upsertCalls[0] as { data: Record<string, unknown> }).data
      expect(upsertData.note).toBe("Great day!")
    })

    it("optimistic update sets todayMood immediately", async () => {
      // Make upsert hang to observe optimistic state
      let resolveUpsert!: (value: { data: unknown; error: unknown }) => void
      const pendingUpsert = new Promise<{ data: unknown; error: unknown }>((resolve) => {
        resolveUpsert = resolve
      })

      // Override chain to return pending promise for single
      const hangingChain: Record<string, ReturnType<typeof vi.fn>> = {}
      hangingChain.select = vi.fn(() => hangingChain)
      hangingChain.eq = vi.fn(() => hangingChain)
      hangingChain.single = vi.fn(() => pendingUpsert)
      hangingChain.upsert = vi.fn((data: unknown, opts: unknown) => {
        upsertCalls.push({ data, opts })
        return hangingChain
      })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        // First two calls are fetch (user mood, partner mood), rest are upsert
        if (callCount <= 2) return buildChain()
        return hangingChain
      })

      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Start setMood without awaiting
      let setMoodPromise: Promise<void>
      act(() => {
        setMoodPromise = result.current.setMood("loving")
      })

      // Optimistic update should be applied
      await waitFor(() => expect(result.current.todayMood?.mood).toBe("loving"))

      // Now resolve the upsert
      resolveUpsert({ data: { ...MOCK_USER_MOOD, mood: "loving" }, error: null })
      await act(async () => {
        await setMoodPromise
      })
    })

    it("rollback on upsert error", async () => {
      upsertResult = { data: null, error: { message: "Upsert failed" } }
      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Should start with the fetched mood
      expect(result.current.todayMood).toEqual(MOCK_USER_MOOD)

      await act(async () => {
        await result.current.setMood("low")
      })

      // Should rollback to original
      expect(result.current.todayMood).toEqual(MOCK_USER_MOOD)
      expect(result.current.error).toBe("Upsert failed")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("queries mood_log table on mount", async () => {
      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockFrom).toHaveBeenCalledWith("mood_log")
    })

    it("realtime subscription is scoped per user_id (user + partner)", async () => {
      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())

      // Channel is keyed by the user's id (not a shared global channel).
      expect(stableSupabase.channel).toHaveBeenCalledWith("mood_log_user-1")

      // Four filtered listeners: INSERT+UPDATE for self, INSERT+UPDATE for partner.
      const filters = realtimeHandlers.map((h) => `${h.config.filter}:${h.config.event}`)
      expect(filters).toContain("user_id=eq.user-1:INSERT")
      expect(filters).toContain("user_id=eq.user-1:UPDATE")
      expect(filters).toContain("user_id=eq.partner-1:INSERT")
      expect(filters).toContain("user_id=eq.partner-1:UPDATE")

      // Every listener MUST carry a user_id filter (no unfiltered global listener).
      expect(realtimeHandlers.every((h) => h.config.filter?.startsWith("user_id=eq."))).toBe(true)
    })

    it("only the user's own listeners are registered when there is no partner", async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, partner: null })

      const { result } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())

      const filters = realtimeHandlers.map((h) => h.config.filter)
      expect(filters).toEqual([
        "user_id=eq.user-1",
        "user_id=eq.user-1",
      ])
    })

    it("applies a realtime partner UPDATE (today) to partnerMood", async () => {
      partnerMoodResult = { data: MOCK_PARTNER_MOOD, error: null }
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())

      const { result } = renderHook(() => useMood())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const updated = { ...MOCK_PARTNER_MOOD, mood: "loving", mood_date: today }
      act(() => emitRealtime("user_id=eq.partner-1", "UPDATE", updated))

      expect(result.current.partnerMood?.mood).toBe("loving")
      // Partner event must NOT leak into the user's own mood.
      expect(result.current.todayMood?.user_id).toBe("user-1")
    })

    it("applies a realtime self UPDATE (today) to todayMood", async () => {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())

      const { result } = renderHook(() => useMood())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const updated = { ...MOCK_USER_MOOD, mood: "calm", mood_date: today }
      act(() => emitRealtime("user_id=eq.user-1", "UPDATE", updated))

      expect(result.current.todayMood?.mood).toBe("calm")
    })

    it("ignores a realtime event whose mood_date is not today", async () => {
      const { result } = renderHook(() => useMood())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      act(() =>
        emitRealtime("user_id=eq.user-1", "UPDATE", {
          ...MOCK_USER_MOOD,
          mood: "low",
          mood_date: "2000-01-01",
        })
      )

      // Unchanged — still the originally fetched mood.
      expect(result.current.todayMood).toEqual(MOCK_USER_MOOD)
    })

    it("channel cleanup on unmount", async () => {
      const { result, unmount } = renderHook(() => useMood())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())

      unmount()
      expect(mockRemoveChannel).toHaveBeenCalled()
    })
  })
})
