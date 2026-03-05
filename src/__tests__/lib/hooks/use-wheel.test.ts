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

const MOCK_ITEMS = [
  { id: "i1", label: "Pizza", weight: 1 },
  { id: "i2", label: "Sushi", weight: 1 },
  { id: "i3", label: "Tacos", weight: 1 },
  { id: "i4", label: "Pasta", weight: 1 },
]

const MOCK_PRESET = {
  id: "preset-1",
  user_id: "user-1",
  name: "Restaurant Picker",
  icon: "🍕",
  items: MOCK_ITEMS,
  is_shared: true,
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MOCK_PRESET_2 = {
  id: "preset-2",
  user_id: "user-2",
  name: "Movie Night",
  icon: "🎬",
  items: [
    { id: "m1", label: "Action", weight: 1 },
    { id: "m2", label: "Comedy", weight: 2 },
  ],
  is_shared: true,
  created_at: "2026-03-04T00:00:00Z",
  updated_at: "2026-03-04T00:00:00Z",
}

const MOCK_ACTIVE_SESSION = {
  id: "session-1",
  preset_id: "preset-1",
  started_by: "user-1",
  mode: "selection",
  best_of_target: null,
  best_of_rounds: 0,
  status: "active",
  winner_label: null,
  created_at: "2026-03-05T10:00:00Z",
  updated_at: "2026-03-05T10:00:00Z",
}

const MOCK_COMPLETED_SESSION = {
  id: "session-2",
  preset_id: "preset-1",
  started_by: "user-1",
  mode: "selection",
  best_of_target: null,
  best_of_rounds: 0,
  status: "completed",
  winner_label: "Pizza",
  created_at: "2026-03-04T10:00:00Z",
  updated_at: "2026-03-04T10:30:00Z",
}

const MOCK_SPIN = {
  id: "spin-1",
  session_id: "session-1",
  spin_number: 1,
  spun_by: "user-1",
  result_label: "Pizza",
  result_index: 0,
  remaining_items: null,
  eliminated_item: null,
  spin_duration_ms: 3500,
  created_at: "2026-03-05T10:05:00Z",
}

// ── Mutable query result refs ─────────────────────────────────

let presetsResult = {
  data: [MOCK_PRESET, MOCK_PRESET_2] as unknown[] | null,
  error: null as unknown,
}
let sessionsResult = {
  data: [MOCK_COMPLETED_SESSION] as unknown[] | null,
  error: null as unknown,
}
let spinsResult = {
  data: [] as unknown[] | null,
  error: null as unknown,
}
let insertResult = { data: MOCK_PRESET as unknown, error: null as unknown }
let updateResult = { error: null as unknown }
let deleteResult = { error: null as unknown }

const insertCalls: unknown[] = []

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannelOn = vi.fn(function (this: unknown) { return this })

function buildChain(table: string) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => {
    if (table === "wheel_spins") return { order: vi.fn(() => Promise.resolve(spinsResult)) }
    return chain
  })
  chain.order = vi.fn(() => {
    if (table === "wheel_presets") return Promise.resolve(presetsResult)
    if (table === "wheel_sessions") return Promise.resolve(sessionsResult)
    if (table === "wheel_spins") return Promise.resolve(spinsResult)
    return Promise.resolve({ data: [], error: null })
  })
  chain.single = vi.fn(() => Promise.resolve(insertResult))
  chain.insert = vi.fn((data: unknown) => {
    insertCalls.push({ table, data })
    return chain
  })
  chain.update = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve(updateResult)),
  }))
  chain.delete = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve(deleteResult)),
  }))
  return chain
}

const mockFrom = vi.fn((table: string) => buildChain(table))

const stableSupabase = {
  from: mockFrom,
  channel: vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe })),
  removeChannel: mockRemoveChannel,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

import { useWheel } from "@/lib/hooks/use-wheel"

describe("useWheel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: mockPartner })
    presetsResult = { data: [MOCK_PRESET, MOCK_PRESET_2], error: null }
    sessionsResult = { data: [MOCK_COMPLETED_SESSION], error: null }
    spinsResult = { data: [], error: null }
    insertResult = { data: MOCK_PRESET, error: null }
    updateResult = { error: null }
    deleteResult = { error: null }
    insertCalls.length = 0
    mockChannelOn.mockImplementation(function (this: unknown) { return this })
  })

  // ── UNIT: Null user ───────────────────────────────────────

  it("returns inert state when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null, partner: null })
    const { result } = renderHook(() => useWheel())

    expect(result.current.presets).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.activeSession).toBeNull()
    expect(result.current.tally).toEqual({})
    expect(result.current.sessionHistory).toEqual([])
  })

  // ── UNIT: Presets loading ──────────────────────────────────

  it("loads presets from Supabase", async () => {
    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.presets).toHaveLength(2)
    expect(result.current.presets[0].name).toBe("Restaurant Picker")
    expect(result.current.presets[1].name).toBe("Movie Night")
  })

  it("sets error when preset fetch fails", async () => {
    presetsResult = { data: null, error: { message: "Presets fetch failed" } }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe("Presets fetch failed")
  })

  // ── UNIT: Session history ──────────────────────────────────

  it("derives session history from non-active sessions", async () => {
    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sessionHistory).toHaveLength(1)
    expect(result.current.sessionHistory[0].winner_label).toBe("Pizza")
  })

  // ── UNIT: Active session ──────────────────────────────────

  it("identifies active session", async () => {
    sessionsResult = { data: [MOCK_ACTIVE_SESSION, MOCK_COMPLETED_SESSION], error: null }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.activeSession).not.toBeNull()
    expect(result.current.activeSession!.id).toBe("session-1")
  })

  it("returns null activeSession when none active", async () => {
    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.activeSession).toBeNull()
  })

  // ── UNIT: Tally computation ────────────────────────────────

  it("computes tally from current spins", async () => {
    sessionsResult = { data: [MOCK_ACTIVE_SESSION], error: null }
    spinsResult = {
      data: [
        MOCK_SPIN,
        { ...MOCK_SPIN, id: "spin-2", spin_number: 2, result_label: "Sushi" },
        { ...MOCK_SPIN, id: "spin-3", spin_number: 3, result_label: "Pizza" },
      ],
      error: null,
    }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.currentSpins.length).toBeGreaterThan(0))

    expect(result.current.tally).toEqual({ Pizza: 2, Sushi: 1 })
  })

  // ── UNIT: Winner ──────────────────────────────────────────

  it("returns null winner when no active session", async () => {
    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.winner).toBeNull()
  })

  it("returns winner_label from active session when set", async () => {
    sessionsResult = {
      data: [{ ...MOCK_ACTIVE_SESSION, winner_label: "Tacos" }],
      error: null,
    }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.winner).toBe("Tacos")
  })

  // ── UNIT: Spin function — weighted random ──────────────────

  it("spin returns a valid result from remaining items", async () => {
    sessionsResult = { data: [MOCK_ACTIVE_SESSION], error: null }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.remainingItems.length).toBeGreaterThan(0))

    const spinResult = result.current.spin()
    expect(spinResult.resultIndex).toBeGreaterThanOrEqual(0)
    expect(spinResult.resultIndex).toBeLessThan(MOCK_ITEMS.length)
    expect(MOCK_ITEMS.map((i) => i.label)).toContain(spinResult.label)
    expect(spinResult.angle).toBeGreaterThan(360 * 3) // at least 3 rotations
  })

  it("spin returns empty result when no items", async () => {
    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const spinResult = result.current.spin()
    expect(spinResult.label).toBe("")
    expect(spinResult.angle).toBe(0)
  })

  it("spin respects weighted distribution", async () => {
    // Preset 2 has Comedy with weight 2 vs Action weight 1
    sessionsResult = {
      data: [{ ...MOCK_ACTIVE_SESSION, preset_id: "preset-2" }],
      error: null,
    }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.remainingItems.length).toBe(2))

    // Run 300 spins and verify Comedy appears more often
    let comedyCount = 0
    for (let i = 0; i < 300; i++) {
      const r = result.current.spin()
      if (r.label === "Comedy") comedyCount++
    }

    // Comedy should appear ~200/300 times (66%), accept 50-90% range
    expect(comedyCount).toBeGreaterThan(150)
    expect(comedyCount).toBeLessThan(270)
  })

  // ── INTERACTION: Create preset ─────────────────────────────

  it("creates a preset and adds it to the list", async () => {
    insertResult = {
      data: {
        id: "preset-new",
        user_id: "user-1",
        name: "Date Night",
        icon: "💑",
        items: [
          { id: "d1", label: "Dinner", weight: 1 },
          { id: "d2", label: "Movie", weight: 1 },
        ],
        is_shared: true,
        created_at: "2026-03-05T12:00:00Z",
        updated_at: "2026-03-05T12:00:00Z",
      },
      error: null,
    }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let newId: string | null = null
    await act(async () => {
      newId = await result.current.createPreset({
        name: "Date Night",
        icon: "💑",
        items: [
          { label: "Dinner", weight: 1 },
          { label: "Movie", weight: 1 },
        ],
      })
    })

    expect(newId).toBe("preset-new")
    expect(result.current.presets[0].name).toBe("Date Night")

    const call = insertCalls.find((c: any) => c.table === "wheel_presets") as any
    expect(call).toBeDefined()
    expect(call.data.name).toBe("Date Night")
    expect(call.data.user_id).toBe("user-1")
  })

  it("returns null from createPreset on error", async () => {
    insertResult = { data: null, error: { message: "Insert failed" } }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let newId: string | null = null
    await act(async () => {
      newId = await result.current.createPreset({
        name: "Broken",
        items: [{ label: "A" }, { label: "B" }],
      })
    })

    expect(newId).toBeNull()
    expect(result.current.error).toBe("Insert failed")
  })

  // ── INTERACTION: Delete preset ─────────────────────────────

  it("deletes a preset optimistically", async () => {
    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.presets).toHaveLength(2)

    await act(async () => {
      await result.current.deletePreset("preset-1")
    })

    expect(result.current.presets).toHaveLength(1)
    expect(result.current.presets[0].name).toBe("Movie Night")
  })

  it("rolls back delete on error", async () => {
    deleteResult = { error: { message: "Delete failed" } }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deletePreset("preset-1")
    })

    // Rollback re-adds the deleted preset, so back to original length
    expect(result.current.presets).toHaveLength(2)
    expect(result.current.error).toBe("Delete failed")
    // Verify the deleted item was restored
    expect(result.current.presets.find((p) => p.id === "preset-1")).toBeDefined()
  })

  // ── INTERACTION: Start session ─────────────────────────────

  it("starts a selection session", async () => {
    insertResult = {
      data: {
        id: "session-new",
        preset_id: "preset-1",
        started_by: "user-1",
        mode: "selection",
        best_of_target: null,
        best_of_rounds: 0,
        status: "active",
        winner_label: null,
        created_at: "2026-03-05T12:00:00Z",
        updated_at: "2026-03-05T12:00:00Z",
      },
      error: null,
    }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.startSession("preset-1", "selection")
    })

    expect(result.current.activeSession).not.toBeNull()
    expect(result.current.activeSession!.mode).toBe("selection")

    const call = insertCalls.find((c: any) => c.table === "wheel_sessions") as any
    expect(call).toBeDefined()
    expect(call.data.mode).toBe("selection")
    expect(call.data.best_of_target).toBeNull()
  })

  it("starts a best_of session with target", async () => {
    insertResult = {
      data: {
        id: "session-bo",
        preset_id: "preset-1",
        started_by: "user-1",
        mode: "best_of",
        best_of_target: 5,
        best_of_rounds: 0,
        status: "active",
        winner_label: null,
        created_at: "2026-03-05T12:00:00Z",
        updated_at: "2026-03-05T12:00:00Z",
      },
      error: null,
    }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.startSession("preset-1", "best_of", 5)
    })

    const call = insertCalls.find((c: any) => c.table === "wheel_sessions") as any
    expect(call.data.best_of_target).toBe(5)
    expect(call.data.mode).toBe("best_of")
  })

  // ── INTERACTION: Abandon session ───────────────────────────

  it("abandons active session optimistically", async () => {
    sessionsResult = { data: [MOCK_ACTIVE_SESSION], error: null }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.activeSession).not.toBeNull()

    await act(async () => {
      await result.current.abandonSession()
    })

    expect(result.current.activeSession).toBeNull()
    expect(result.current.sessionHistory).toHaveLength(1)
    expect(result.current.sessionHistory[0].status).toBe("abandoned")
  })

  // ── INTERACTION: Complete session ──────────────────────────

  it("completes session and moves it to session history", async () => {
    sessionsResult = { data: [MOCK_ACTIVE_SESSION], error: null }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.activeSession).not.toBeNull()

    await act(async () => {
      await result.current.completeSession("Pizza")
    })

    // Session moves from active to history
    expect(result.current.activeSession).toBeNull()
    expect(result.current.sessionHistory).toHaveLength(1)
    expect(result.current.sessionHistory[0].winner_label).toBe("Pizza")
    expect(result.current.sessionHistory[0].status).toBe("completed")
  })

  // ── INTERACTION: Record spin ───────────────────────────────

  it("records a spin and adds to currentSpins", async () => {
    sessionsResult = { data: [MOCK_ACTIVE_SESSION], error: null }
    insertResult = { data: MOCK_SPIN, error: null }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.remainingItems.length).toBeGreaterThan(0))

    await act(async () => {
      await result.current.recordSpin({
        resultIndex: 0,
        angle: 1440,
        label: "Pizza",
        spinDurationMs: 3500,
      })
    })

    expect(result.current.currentSpins).toHaveLength(1)
    expect(result.current.currentSpins[0].result_label).toBe("Pizza")

    const call = insertCalls.find((c: any) => c.table === "wheel_spins") as any
    expect(call).toBeDefined()
    expect(call.data.result_label).toBe("Pizza")
    expect(call.data.session_id).toBe("session-1")
  })

  it("elimination spin removes item from remaining", async () => {
    sessionsResult = {
      data: [{ ...MOCK_ACTIVE_SESSION, mode: "elimination" }],
      error: null,
    }
    insertResult = { data: MOCK_SPIN, error: null }

    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.remainingItems.length).toBe(4))

    await act(async () => {
      await result.current.recordSpin({
        resultIndex: 0,
        angle: 1440,
        label: "Pizza",
      })
    })

    expect(result.current.remainingItems).toHaveLength(3)
    expect(result.current.remainingItems.map((i) => i.label)).not.toContain("Pizza")
  })

  // ── INTEGRATION: Supabase calls ────────────────────────────

  it("fetches from wheel_presets and wheel_sessions tables", async () => {
    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const fromCalls = mockFrom.mock.calls.map((c: unknown[]) => c[0])
    expect(fromCalls).toContain("wheel_presets")
    expect(fromCalls).toContain("wheel_sessions")
  })

  // ── INTEGRATION: Realtime ──────────────────────────────────

  it("subscribes to realtime for presets, sessions, and spins", async () => {
    const { result } = renderHook(() => useWheel())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(stableSupabase.channel).toHaveBeenCalledWith("wheel_realtime")
    expect(mockSubscribe).toHaveBeenCalled()
    // 3 .on() calls: presets, sessions, spins
    expect(mockChannelOn).toHaveBeenCalledTimes(3)
  })
})
