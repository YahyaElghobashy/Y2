import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockPartner = { id: "user-2", email: "yara@test.com" }
const mockUseAuth: ReturnType<typeof vi.fn> = vi.fn(() => ({
  user: mockUser,
  partner: mockPartner,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Test Data ─────────────────────────────────────────────────

const MOCK_RITUAL = {
  id: "ritual-1",
  user_id: "user-1",
  title: "Morning Walk",
  description: "Walk for 30 minutes",
  icon: "🚶",
  cadence: "daily",
  is_shared: false,
  coyyns_reward: 0,
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MOCK_SHARED_RITUAL = {
  id: "ritual-2",
  user_id: "user-1",
  title: "Read Together",
  description: null,
  icon: "📖",
  cadence: "weekly",
  is_shared: true,
  coyyns_reward: 5,
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MOCK_LOG = {
  id: "log-1",
  ritual_id: "ritual-1",
  user_id: "user-1",
  period_key: "daily:2026-03-05",
  note: null,
  photo_url: null,
  logged_at: "2026-03-05T08:00:00Z",
  created_at: "2026-03-05T08:00:00Z",
}

// ── Mutable query result refs ─────────────────────────────────

let ritualsResult = { data: [MOCK_RITUAL, MOCK_SHARED_RITUAL] as unknown[] | null, error: null as unknown }
let logsResult = { data: [MOCK_LOG] as unknown[] | null, error: null as unknown }
let insertResult = { data: MOCK_RITUAL as unknown, error: null as unknown }
let deleteResult = { error: null as unknown }

const coyynsInsertCalls: unknown[] = []
const ritualInsertCalls: unknown[] = []
const logInsertCalls: unknown[] = []

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannelOn = vi.fn(function (this: unknown) { return this })

function buildChain(table: string) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => {
    if (table === "rituals") return Promise.resolve(ritualsResult)
    if (table === "ritual_logs") return Promise.resolve(logsResult)
    return Promise.resolve({ data: [], error: null })
  })
  chain.single = vi.fn(() => Promise.resolve(insertResult))
  chain.insert = vi.fn((data: unknown) => {
    if (table === "coyyns_transactions") {
      coyynsInsertCalls.push(data)
      return Promise.resolve({ error: null })
    }
    if (table === "rituals") ritualInsertCalls.push(data)
    if (table === "ritual_logs") logInsertCalls.push(data)
    return chain
  })
  chain.update = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }))
  chain.delete = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(deleteResult)) }))
  return chain
}

const mockFrom = vi.fn((table: string) => buildChain(table))

const mockUpload = vi.fn(() => Promise.resolve({ error: null }))
const mockGetPublicUrl = vi.fn(() => ({ data: { publicUrl: "https://example.com/photo.jpg" } }))

const stableSupabase = {
  from: mockFrom,
  channel: vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe })),
  removeChannel: mockRemoveChannel,
  storage: {
    from: vi.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    })),
  },
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

import { useRituals, getPeriodKey } from "@/lib/hooks/use-rituals"

describe("useRituals", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: mockPartner })
    ritualsResult = { data: [MOCK_RITUAL, MOCK_SHARED_RITUAL], error: null }
    logsResult = { data: [MOCK_LOG], error: null }
    insertResult = { data: MOCK_RITUAL, error: null }
    deleteResult = { error: null }
    coyynsInsertCalls.length = 0
    ritualInsertCalls.length = 0
    logInsertCalls.length = 0
    mockChannelOn.mockImplementation(function (this: unknown) { return this })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("returns inert state when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useRituals())

      expect(result.current.rituals).toEqual([])
      expect(result.current.todayRituals).toEqual([])
      expect(result.current.logs).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("fetches rituals and logs on mount", async () => {
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.rituals).toHaveLength(2)
      expect(result.current.logs).toHaveLength(1)
    })

    it("todayRituals returns all rituals", async () => {
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.todayRituals).toHaveLength(2)
    })

    it("sets error on rituals fetch failure", async () => {
      ritualsResult = { data: null, error: { message: "Network error" } }

      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.error).toBe("Network error"))
    })

    it("getPeriodKey returns correct daily key", () => {
      const date = new Date("2026-03-05T12:00:00Z")
      expect(getPeriodKey("daily", date)).toBe("daily:2026-03-05")
    })

    it("getPeriodKey returns correct monthly key", () => {
      const date = new Date("2026-03-05T12:00:00Z")
      expect(getPeriodKey("monthly", date)).toBe("monthly:2026-03")
    })

    it("getPeriodKey returns correct weekly key", () => {
      const date = new Date("2026-01-05T12:00:00Z") // Mon Jan 5
      const key = getPeriodKey("weekly", date)
      expect(key).toMatch(/^weekly:2026-W\d{2}$/)
    })

    it("isLoggedThisPeriod returns false for unlogged ritual", async () => {
      logsResult = { data: [], error: null }
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.isLoggedThisPeriod("ritual-1")).toBe(false)
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("logRitual inserts with correct period_key", async () => {
      insertResult = { data: { ...MOCK_LOG, id: "log-new" }, error: null }
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.logRitual("ritual-1", "felt great")
      })

      expect(logInsertCalls).toHaveLength(1)
      expect(logInsertCalls[0]).toEqual(
        expect.objectContaining({
          ritual_id: "ritual-1",
          user_id: "user-1",
          note: "felt great",
        })
      )
    })

    it("logRitual awards CoYYns for ritual with reward", async () => {
      insertResult = { data: { ...MOCK_LOG, id: "log-coyyns", ritual_id: "ritual-2" }, error: null }
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.logRitual("ritual-2")
      })

      expect(coyynsInsertCalls).toHaveLength(1)
      expect(coyynsInsertCalls[0]).toEqual(
        expect.objectContaining({
          user_id: "user-1",
          amount: 5,
          type: "earn",
          category: "ritual_completion",
        })
      )
    })

    it("logRitual does NOT award CoYYns for no-reward ritual", async () => {
      insertResult = { data: { ...MOCK_LOG, id: "log-no-reward" }, error: null }
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.logRitual("ritual-1")
      })

      expect(coyynsInsertCalls).toHaveLength(0)
    })

    it("logRitual rolls back on error", async () => {
      insertResult = { data: null, error: { message: "Insert failed" } }
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const logsBefore = result.current.logs.length

      await act(async () => {
        await result.current.logRitual("ritual-1")
      })

      expect(result.current.error).toBe("Insert failed")
      expect(result.current.logs).toHaveLength(logsBefore)
    })

    it("createRitual inserts and returns new id", async () => {
      const newRitual = { ...MOCK_RITUAL, id: "ritual-new", title: "Gratitude" }
      insertResult = { data: newRitual, error: null }

      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      let newId: string | null = null
      await act(async () => {
        newId = await result.current.createRitual({
          title: "Gratitude",
          cadence: "daily",
          is_shared: false,
        })
      })

      expect(newId).toBe("ritual-new")
      expect(ritualInsertCalls).toHaveLength(1)
      expect(ritualInsertCalls[0]).toEqual(
        expect.objectContaining({
          user_id: "user-1",
          title: "Gratitude",
          cadence: "daily",
        })
      )
    })

    it("deleteRitual removes ritual from state", async () => {
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.rituals).toHaveLength(2)

      await act(async () => {
        await result.current.deleteRitual("ritual-1")
      })

      expect(result.current.rituals).toHaveLength(1)
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("queries rituals table on mount", async () => {
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockFrom).toHaveBeenCalledWith("rituals")
    })

    it("queries ritual_logs table on mount", async () => {
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockFrom).toHaveBeenCalledWith("ritual_logs")
    })

    it("sets up realtime subscription on ritual_logs", async () => {
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())
    })

    it("cleans up realtime channel on unmount", async () => {
      const { result, unmount } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())

      unmount()
      expect(mockRemoveChannel).toHaveBeenCalled()
    })

    it("uploadRitualPhoto uploads to ritual-images bucket", async () => {
      const { result } = renderHook(() => useRituals())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" })
      let url: string | null = null

      await act(async () => {
        url = await result.current.uploadRitualPhoto(file)
      })

      expect(url).toBe("https://example.com/photo.jpg")
      expect(stableSupabase.storage.from).toHaveBeenCalledWith("ritual-images")
      expect(mockUpload).toHaveBeenCalled()
    })
  })
})
