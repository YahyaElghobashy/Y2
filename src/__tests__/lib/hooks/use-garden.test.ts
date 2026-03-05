import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockProfile = { display_name: "Yahya" }
const mockUseAuth: ReturnType<typeof vi.fn> = vi.fn(() => ({
  user: mockUser,
  profile: mockProfile,
  partner: { id: "partner-1", display_name: "Yara" },
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Test Data ─────────────────────────────────────────────────

const MOCK_GARDEN_DAY = {
  id: "gd-1",
  garden_date: "2026-03-05",
  yahya_opened: true,
  yara_opened: true,
  flower_type: "🌸",
  created_at: "2026-03-05T08:00:00Z",
}

const MOCK_PARTIAL_DAY = {
  id: "gd-2",
  garden_date: "2026-03-04",
  yahya_opened: true,
  yara_opened: false,
  flower_type: null,
  created_at: "2026-03-04T08:00:00Z",
}

// ── Mutable query result refs ─────────────────────────────────

let fetchLimitResult: { data: unknown; error: unknown } = { data: [MOCK_GARDEN_DAY, MOCK_PARTIAL_DAY], error: null }
let maybeSingleResult: { data: unknown; error: unknown } = { data: null, error: null }
let singleResult: { data: unknown; error: unknown } = { data: null, error: null }

const updateCalls: unknown[] = []
const insertCalls: unknown[] = []

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannelOn = vi.fn(function (this: unknown) { return this })

function buildChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}

  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.is = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.limit = vi.fn(() => Promise.resolve(fetchLimitResult))
  chain.maybeSingle = vi.fn(() => Promise.resolve(maybeSingleResult))
  chain.single = vi.fn(() => Promise.resolve(singleResult))
  chain.update = vi.fn((data: unknown) => {
    updateCalls.push(data)
    return chain
  })
  chain.insert = vi.fn((data: unknown) => {
    insertCalls.push(data)
    return chain
  })

  return chain
}

const mockFrom = vi.fn(() => buildChain())

// Stable singleton — prevents infinite useEffect loops
const stableSupabase = {
  from: mockFrom,
  channel: vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe })),
  removeChannel: mockRemoveChannel,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

import { useGarden } from "@/lib/hooks/use-garden"

// ── Tests ─────────────────────────────────────────────────────

describe("useGarden", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchLimitResult = { data: [MOCK_GARDEN_DAY, MOCK_PARTIAL_DAY], error: null }
    maybeSingleResult = { data: null, error: null }
    singleResult = { data: null, error: null }
    updateCalls.length = 0
    insertCalls.length = 0
    mockFrom.mockImplementation(() => buildChain())
    mockChannelOn.mockImplementation(function (this: unknown) { return this })
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      partner: { id: "partner-1", display_name: "Yara" },
    })
  })

  // ── Inert state ──────────────────────────────────────────────

  it("returns inert state when no user", () => {
    mockUseAuth.mockReturnValue({ user: null, profile: null, partner: null })

    const { result } = renderHook(() => useGarden())

    expect(result.current.gardenDays).toEqual([])
    expect(result.current.recentFlowers).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  // ── Fetch on mount ──────────────────────────────────────────

  it("fetches garden days on mount", async () => {
    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.gardenDays).toHaveLength(2)
    expect(result.current.gardenDays[0].garden_date).toBe("2026-03-05")
  })

  it("calls from with garden_days table", async () => {
    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFrom).toHaveBeenCalledWith("garden_days")
  })

  it("sets error on fetch failure", async () => {
    fetchLimitResult = { data: null, error: { message: "Network error" } }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("Network error")
  })

  // ── recentFlowers derived ───────────────────────────────────

  it("recentFlowers filters to only days with flower_type", async () => {
    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.recentFlowers).toHaveLength(1)
    expect(result.current.recentFlowers[0].flower_type).toBe("🌸")
  })

  it("recentFlowers caps at 8 items", async () => {
    const manyFlowers = Array.from({ length: 12 }, (_, i) => ({
      ...MOCK_GARDEN_DAY,
      id: `gd-${i}`,
      garden_date: `2026-03-${String(i + 1).padStart(2, "0")}`,
    }))
    fetchLimitResult = { data: manyFlowers, error: null }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.recentFlowers).toHaveLength(8)
  })

  // ── recordOpened — insert new day ───────────────────────────

  it("recordOpened inserts new row when today doesn't exist", async () => {
    maybeSingleResult = { data: null, error: null }
    singleResult = { data: { ...MOCK_GARDEN_DAY, id: "new-id", yahya_opened: true }, error: null }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    expect(insertCalls.length).toBeGreaterThanOrEqual(1)
    const lastInsert = insertCalls[insertCalls.length - 1] as Record<string, unknown>
    expect(lastInsert.yahya_opened).toBe(true)
  })

  // ── recordOpened — update existing day ──────────────────────

  it("recordOpened updates existing row", async () => {
    maybeSingleResult = {
      data: { ...MOCK_PARTIAL_DAY, yahya_opened: false },
      error: null,
    }
    singleResult = {
      data: { ...MOCK_PARTIAL_DAY, yahya_opened: true },
      error: null,
    }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    expect(updateCalls.length).toBeGreaterThanOrEqual(1)
    const lastUpdate = updateCalls[updateCalls.length - 1] as Record<string, unknown>
    expect(lastUpdate.yahya_opened).toBe(true)
  })

  it("recordOpened skips if user already opened", async () => {
    maybeSingleResult = {
      data: { ...MOCK_PARTIAL_DAY, yahya_opened: true },
      error: null,
    }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    expect(updateCalls).toHaveLength(0)
  })

  // ── recordOpened — flower bloom ─────────────────────────────

  it("includes flower_type when both users opened", async () => {
    maybeSingleResult = {
      data: { ...MOCK_PARTIAL_DAY, yahya_opened: false, yara_opened: true, flower_type: null },
      error: null,
    }
    singleResult = {
      data: { ...MOCK_PARTIAL_DAY, yahya_opened: true, yara_opened: true, flower_type: "🌻" },
      error: null,
    }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    const lastUpdate = updateCalls[updateCalls.length - 1] as Record<string, unknown>
    expect(lastUpdate.yahya_opened).toBe(true)
    expect(lastUpdate.flower_type).toBeDefined()
    const flowerEmojis = ["🌸", "🌻", "🌹", "🌺", "🌷", "🌼", "💐", "🌿", "🍀", "🌵", "🪻", "🪷"]
    expect(flowerEmojis).toContain(lastUpdate.flower_type)
  })

  // ── recordOpened — error handling ───────────────────────────

  it("recordOpened sets error on maybeSingle failure", async () => {
    maybeSingleResult = { data: null, error: { message: "Fetch error" } }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    expect(result.current.error).toBe("Fetch error")
  })

  it("recordOpened is a no-op when no user", async () => {
    mockUseAuth.mockReturnValue({ user: null, profile: null, partner: null })

    const { result } = renderHook(() => useGarden())

    await act(async () => {
      await result.current.recordOpened()
    })

    expect(updateCalls).toHaveLength(0)
    expect(insertCalls).toHaveLength(0)
  })

  // ── Yara column detection ──────────────────────────────────

  it("uses yara_opened column for Yara's profile", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-2", email: "yara@test.com" },
      profile: { display_name: "Yara" },
      partner: { id: "partner-1", display_name: "Yahya" },
    })
    maybeSingleResult = { data: null, error: null }
    singleResult = { data: { ...MOCK_GARDEN_DAY, id: "new-id", yara_opened: true }, error: null }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    const lastInsert = insertCalls[insertCalls.length - 1] as Record<string, unknown>
    expect(lastInsert.yara_opened).toBe(true)
  })

  // ── Realtime subscription ──────────────────────────────────

  it("sets up realtime subscription on mount", async () => {
    renderHook(() => useGarden())

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled()
    })

    expect(mockChannelOn).toHaveBeenCalledTimes(2)
  })
})
