import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

// ── Mutable auth state (controlled per-test) ────────────────────
let mockAuth: { user: { id: string } | null; partner: { id: string; display_name: string } | null } = {
  user: { id: "u1" },
  partner: { id: "p1", display_name: "Yara" },
}

// ── Supabase CHAINABLE mock ─────────────────────────────────────
let singleResult: { data: unknown; error: { message: string } | null } = { data: null, error: null }
let orderResult: { data: unknown[]; error: { message: string } | null } = { data: [], error: null }

const chain: Record<string, ReturnType<typeof vi.fn>> = {}
for (const m of ["select", "insert", "update", "delete", "eq", "in", "or", "order", "limit", "filter"]) {
  chain[m] = vi.fn(() => chain)
}
chain.single = vi.fn(() => Promise.resolve(singleResult))
chain.maybeSingle = vi.fn(() => Promise.resolve(singleResult))
// thenable: `await supabase.from(...).select(...).order(...)` resolves to orderResult
chain.then = vi.fn((resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
  Promise.resolve(orderResult).then(resolve, reject),
)

const mockFrom = vi.fn(() => chain)
const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
const mockSupabase = {
  from: mockFrom,
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn(),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuth,
}))

// Import the hook AFTER the mocks are registered.
import { useDecisions } from "@/lib/hooks/use-decisions"
import type { SaveDecisionInput } from "@/lib/types/decisions.types"

// ── Fixtures ────────────────────────────────────────────────────
const RAW_ROW = {
  id: "d1",
  created_by: "u1",
  kind: "many",
  tool_id: "wheel",
  options: [{ id: "a", label: "Pizza" }],
  result: { winner: { id: "a", label: "Pizza" }, summary: "Pizza wins" },
  created_at: "2026-01-01T00:00:00Z",
}

const NEW_ROW = {
  id: "new1",
  created_by: "u1",
  kind: "binary",
  tool_id: "rps",
  options: [
    { id: "y", label: "Yes" },
    { id: "n", label: "No" },
  ],
  result: { winner: { id: "y", label: "Yes" }, summary: "Yes wins" },
  created_at: "2026-02-02T00:00:00Z",
}

const SAVE_INPUT: SaveDecisionInput = {
  kind: "binary",
  toolId: "rps",
  options: [
    { id: "y", label: "Yes" },
    { id: "n", label: "No" },
  ],
  result: { winner: { id: "y", label: "Yes" }, summary: "Yes wins" },
}

describe("useDecisions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // reset mutable state
    mockAuth = { user: { id: "u1" }, partner: { id: "p1", display_name: "Yara" } }
    singleResult = { data: null, error: null }
    orderResult = { data: [], error: null }
    // re-bind chain methods (clearAllMocks wipes vi.fn impls)
    for (const m of ["select", "insert", "update", "delete", "eq", "in", "or", "order", "limit", "filter"]) {
      chain[m].mockImplementation(() => chain)
    }
    chain.single.mockImplementation(() => Promise.resolve(singleResult))
    chain.maybeSingle.mockImplementation(() => Promise.resolve(singleResult))
    chain.then.mockImplementation((resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(orderResult).then(resolve, reject),
    )
    mockChannel.on.mockReturnThis()
    mockChannel.subscribe.mockReturnThis()
    mockSupabase.channel.mockReturnValue(mockChannel)
  })

  // ════════════════════════════════════════════════════════════════
  // UNIT — NO USER (inert branch)
  // ════════════════════════════════════════════════════════════════
  describe("no user", () => {
    it("returns inert state: not loading, empty decisions, no DB call; saveDecision resolves null", async () => {
      mockAuth = { user: null, partner: null }

      const { result } = renderHook(() => useDecisions())

      // Inert return: loading false, empty list, no error
      expect(result.current.isLoading).toBe(false)
      expect(result.current.decisions).toEqual([])
      expect(result.current.error).toBeNull()

      // No fetch should have been attempted at all
      expect(mockFrom).not.toHaveBeenCalled()

      // saveDecision is a no-op that resolves to null
      let saved: string | null = "sentinel"
      await act(async () => {
        saved = await result.current.saveDecision(SAVE_INPUT)
      })
      expect(saved).toBeNull()

      // clearDecision is a no-op too — still no DB call
      await act(async () => {
        await result.current.clearDecision("anything")
      })
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })

  // ════════════════════════════════════════════════════════════════
  // UNIT + INTEGRATION — WITH USER: fetch + narrow/map
  // ════════════════════════════════════════════════════════════════
  describe("with user — fetch + map", () => {
    it("queries decision_history, narrows jsonb columns, and exposes mapped decisions", async () => {
      orderResult = { data: [RAW_ROW], error: null }

      const { result } = renderHook(() => useDecisions())

      // mount-effect fetch resolves asynchronously
      await act(async () => {})

      // INTEGRATION: correct table + ordering
      expect(mockFrom).toHaveBeenCalledWith("decision_history")
      expect(chain.select).toHaveBeenCalledWith("*")
      expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false })

      // state transition: loading → done
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()

      // UNIT: jsonb columns narrowed to contract types
      expect(result.current.decisions).toHaveLength(1)
      const d = result.current.decisions[0]
      expect(d.id).toBe("d1")
      expect(d.created_by).toBe("u1")
      expect(d.kind).toBe("many")
      expect(d.tool_id).toBe("wheel")
      expect(Array.isArray(d.options)).toBe(true)
      expect(d.options[0].label).toBe("Pizza")
      expect(d.result.winner?.label).toBe("Pizza")
      expect(d.result.summary).toBe("Pizza wins")
    })

    it("sets error and stops loading when the fetch returns an error", async () => {
      orderResult = { data: [], error: { message: "fetch failed" } }

      const { result } = renderHook(() => useDecisions())
      await act(async () => {})

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe("fetch failed")
      expect(result.current.decisions).toEqual([])
    })
  })

  // ════════════════════════════════════════════════════════════════
  // INTEGRATION + INTERACTION — saveDecision success
  // ════════════════════════════════════════════════════════════════
  describe("saveDecision — success", () => {
    it("inserts the correct row, returns the new id, and reflects the saved decision", async () => {
      orderResult = { data: [], error: null }
      singleResult = { data: NEW_ROW, error: null }

      const { result } = renderHook(() => useDecisions())
      await act(async () => {}) // settle initial fetch (empty)

      expect(result.current.decisions).toHaveLength(0)

      let returned: string | null = null
      await act(async () => {
        returned = await result.current.saveDecision(SAVE_INPUT)
      })

      // INTEGRATION: insert chain hit with the exact persisted fields
      expect(chain.insert).toHaveBeenCalledTimes(1)
      const insertArg = chain.insert.mock.calls[0][0] as Record<string, unknown>
      expect(insertArg.created_by).toBe("u1")
      expect(insertArg.kind).toBe("binary")
      expect(insertArg.tool_id).toBe("rps")
      expect(insertArg.options).toBeDefined()
      expect(insertArg.result).toBeDefined()
      // jsonb columns are deep-cloned (structural) copies of the input
      expect(insertArg.options).toEqual(SAVE_INPUT.options)
      expect(insertArg.result).toEqual(SAVE_INPUT.result)

      // select("*").single() were part of the chain
      expect(chain.select).toHaveBeenCalledWith("*")
      expect(chain.single).toHaveBeenCalled()

      // returns the server id
      expect(returned).toBe("new1")

      // INTERACTION: optimistic row reconciled to the saved row (no dupes)
      expect(result.current.decisions).toHaveLength(1)
      expect(result.current.decisions[0].id).toBe("new1")
      expect(result.current.decisions[0].result.winner?.label).toBe("Yes")
      expect(result.current.error).toBeNull()
    })
  })

  // ════════════════════════════════════════════════════════════════
  // UNIT — saveDecision error path (optimistic rollback)
  // ════════════════════════════════════════════════════════════════
  describe("saveDecision — error path", () => {
    it("rolls back the optimistic row, sets error, and returns null", async () => {
      orderResult = { data: [RAW_ROW], error: null } // baseline length = 1
      singleResult = { data: null, error: { message: "boom" } }

      const { result } = renderHook(() => useDecisions())
      await act(async () => {}) // settle initial fetch

      expect(result.current.decisions).toHaveLength(1) // baseline

      let returned: string | null = "sentinel"
      await act(async () => {
        returned = await result.current.saveDecision(SAVE_INPUT)
      })

      // insert was attempted
      expect(chain.insert).toHaveBeenCalledTimes(1)

      // failure → null return + error surfaced
      expect(returned).toBeNull()
      expect(result.current.error).toBe("boom")

      // optimistic row rolled back → length back to baseline
      expect(result.current.decisions).toHaveLength(1)
      expect(result.current.decisions[0].id).toBe("d1")
    })
  })

  // ════════════════════════════════════════════════════════════════
  // INTEGRATION — clearDecision
  // ════════════════════════════════════════════════════════════════
  describe("clearDecision", () => {
    it("deletes by id from decision_history and removes the row locally", async () => {
      orderResult = { data: [RAW_ROW], error: null }
      singleResult = { data: null, error: null } // delete has no .single, error null on chain

      const { result } = renderHook(() => useDecisions())
      await act(async () => {}) // settle initial fetch

      expect(result.current.decisions).toHaveLength(1)

      // clear the cumulative call record from the mount fetch so we assert
      // only against the clearDecision invocation
      mockFrom.mockClear()
      chain.delete.mockClear()
      chain.eq.mockClear()

      await act(async () => {
        await result.current.clearDecision("d1")
      })

      // INTEGRATION: correct table + delete().eq("id", id)
      expect(mockFrom).toHaveBeenCalledWith("decision_history")
      expect(chain.delete).toHaveBeenCalledTimes(1)
      expect(chain.eq).toHaveBeenCalledWith("id", "d1")

      // INTERACTION: row removed optimistically
      expect(result.current.decisions).toHaveLength(0)
      expect(result.current.error).toBeNull()
    })

    it("rolls back and sets error when the delete fails", async () => {
      orderResult = { data: [RAW_ROW], error: null }

      const { result } = renderHook(() => useDecisions())
      await act(async () => {}) // settle initial fetch
      expect(result.current.decisions).toHaveLength(1)

      // make the delete().eq(...) chain reject with an error result.
      // delete returns chain; the awaited value comes from chain.then → orderResult,
      // so override chain.then for this delete to resolve { error }.
      chain.then.mockImplementationOnce((resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: null, error: { message: "delete boom" } }).then(resolve),
      )

      await act(async () => {
        await result.current.clearDecision("d1")
      })

      // rolled back: the removed row is restored
      expect(result.current.decisions).toHaveLength(1)
      expect(result.current.decisions[0].id).toBe("d1")
      expect(result.current.error).toBe("delete boom")
    })
  })
})
