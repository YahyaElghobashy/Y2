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

let rpcResult: { data: unknown; error: unknown } = { data: null, error: null }
const rpcCalls: Array<{ fn: string; args: unknown }> = []
const mockRpc = vi.fn((fn: string, args: unknown) => {
  rpcCalls.push({ fn, args })
  return Promise.resolve(rpcResult)
})

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
  rpc: mockRpc,
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
    rpcResult = { data: null, error: null }
    rpcCalls.length = 0
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

  // ── recordOpened — atomic RPC delegation (race fix) ─────────

  it("recordOpened delegates to the atomic record_garden_open RPC", async () => {
    rpcResult = {
      data: { ...MOCK_GARDEN_DAY, id: "new-id", yahya_opened: true, yara_opened: false, flower_type: null },
      error: null,
    }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    // No client-side read-modify-write: never touches insert/update directly.
    expect(insertCalls).toHaveLength(0)
    expect(updateCalls).toHaveLength(0)
    expect(rpcCalls).toHaveLength(1)
    expect(rpcCalls[0].fn).toBe("record_garden_open")
    expect(rpcCalls[0].args).toEqual({ p_user_column: "yahya_opened" })
  })

  it("recordOpened merges the RPC-returned row into state (new day)", async () => {
    rpcResult = {
      data: { ...MOCK_GARDEN_DAY, id: "fresh-id", garden_date: "2026-04-01", flower_type: null },
      error: null,
    }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    expect(result.current.gardenDays.some((d) => d.id === "fresh-id")).toBe(true)
  })

  it("recordOpened reflects an atomically-bloomed flower from the RPC row", async () => {
    // The second concurrent open returns a row where the DB has already set
    // both columns and bloomed exactly one flower — no open was dropped.
    rpcResult = {
      data: {
        ...MOCK_PARTIAL_DAY,
        id: "gd-2",
        yahya_opened: true,
        yara_opened: true,
        flower_type: "🌻",
      },
      error: null,
    }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    const updated = result.current.gardenDays.find((d) => d.id === "gd-2")
    expect(updated?.yahya_opened).toBe(true)
    expect(updated?.yara_opened).toBe(true)
    expect(updated?.flower_type).toBe("🌻")
  })

  it("recordOpened sets error when the RPC fails", async () => {
    rpcResult = { data: null, error: { message: "rpc failed" } }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    expect(result.current.error).toBe("rpc failed")
  })

  it("recordOpened is a no-op when no user", async () => {
    mockUseAuth.mockReturnValue({ user: null, profile: null, partner: null })

    const { result } = renderHook(() => useGarden())

    await act(async () => {
      await result.current.recordOpened()
    })

    expect(rpcCalls).toHaveLength(0)
    expect(updateCalls).toHaveLength(0)
    expect(insertCalls).toHaveLength(0)
  })

  // ── Yara column detection ──────────────────────────────────

  it("calls the RPC with yara_opened for Yara's profile", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-2", email: "yara@test.com" },
      profile: { display_name: "Yara" },
      partner: { id: "partner-1", display_name: "Yahya" },
    })
    rpcResult = { data: { ...MOCK_GARDEN_DAY, id: "new-id", yara_opened: true }, error: null }

    const { result } = renderHook(() => useGarden())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.recordOpened()
    })

    expect(rpcCalls[0].args).toEqual({ p_user_column: "yara_opened" })
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
