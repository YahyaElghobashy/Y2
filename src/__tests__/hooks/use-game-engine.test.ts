import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

// ─── Mocks ───

const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockPartner = { id: "user-2", display_name: "Yara", email: "yara@test.com" }

// Chainable mock — every method returns `chain` (thenable last step)
let singleResult: any = { data: null, error: null }
let limitResult: any = { data: [], error: null }
let orderResult: any = { data: [], error: null }
let insertResult: any = { data: null, error: null }

const chain: any = {}
const methods = ["select", "insert", "update", "eq", "in", "or", "contains", "lte", "order", "limit", "filter"]
for (const m of methods) {
  chain[m] = vi.fn(() => chain)
}
chain.single = vi.fn(() => Promise.resolve(singleResult))
chain.maybeSingle = vi.fn(() => Promise.resolve(singleResult))
// thenable: allow `.then()` on the chain (used for queries that don't end with .single())
chain.then = vi.fn((resolve: any, reject?: any) => {
  return Promise.resolve(orderResult).then(resolve, reject)
})

const mockFrom = vi.fn(() => chain)

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

const mockSupabase = {
  from: mockFrom,
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn(),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    partner: mockPartner,
    profile: { display_name: "Yahya" },
    isLoading: false,
  }),
}))

// Import after mocks
import { useGameEngine } from "@/lib/hooks/use-game-engine"
import type { CheckInConfig } from "@/lib/types/game.types"

describe("useGameEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    singleResult = { data: null, error: null }
    limitResult = { data: [], error: null }
    orderResult = { data: [], error: null }
    insertResult = { data: null, error: null }
    // Re-wire .then default
    chain.then.mockImplementation((resolve: any, reject?: any) =>
      Promise.resolve(orderResult).then(resolve, reject)
    )
    chain.maybeSingle.mockImplementation(() => Promise.resolve(singleResult))
  })

  // ─── Unit Tests ───

  it("returns inert state when no session ID provided", () => {
    const { result } = renderHook(() => useGameEngine())

    expect(result.current.session).toBeNull()
    expect(result.current.rounds).toEqual([])
    expect(result.current.currentRound).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isWaitingForPartner).toBe(false)
    expect(result.current.partnerHasAnswered).toBe(false)
  })

  it("has all expected session lifecycle methods", () => {
    const { result } = renderHook(() => useGameEngine())

    expect(typeof result.current.createSession).toBe("function")
    expect(typeof result.current.startSession).toBe("function")
    expect(typeof result.current.pauseSession).toBe("function")
    expect(typeof result.current.resumeSession).toBe("function")
    expect(typeof result.current.completeSession).toBe("function")
    expect(typeof result.current.abandonSession).toBe("function")
  })

  it("has all expected round action methods", () => {
    const { result } = renderHook(() => useGameEngine())

    expect(typeof result.current.submitAnswer).toBe("function")
    expect(typeof result.current.submitJournal).toBe("function")
    expect(typeof result.current.completeDare).toBe("function")
    expect(typeof result.current.skipDare).toBe("function")
    expect(typeof result.current.skipRound).toBe("function")
    expect(typeof result.current.nextRound).toBe("function")
  })

  it("has all expected utility methods", () => {
    const { result } = renderHook(() => useGameEngine())

    expect(typeof result.current.saveCustomContent).toBe("function")
    expect(typeof result.current.getCustomContentStatus).toBe("function")
    expect(typeof result.current.getAnswerHistory).toBe("function")
    expect(typeof result.current.loadActiveSession).toBe("function")
  })

  it("starts with currentRoundIndex at 0", () => {
    const { result } = renderHook(() => useGameEngine())
    expect(result.current.currentRoundIndex).toBe(0)
  })

  it("getCustomContentStatus returns default counts", () => {
    const { result } = renderHook(() => useGameEngine())
    const status = result.current.getCustomContentStatus()
    expect(status).toEqual({ myCount: 0, partnerDone: false })
  })

  // ─── Session Creation Tests ───

  it("createSession inserts into game_sessions and returns session ID", async () => {
    singleResult = {
      data: { id: "session-123", mode: "check_in", status: "setup" },
      error: null,
    }

    const { result } = renderHook(() => useGameEngine())

    const config: CheckInConfig = {
      categories: ["communication", "finances"],
      questionCount: 10,
      intensity: "moderate",
      includeOpenDiscussion: false,
      shareResultsInstantly: false,
      relationshipPulse: 7,
    }

    let sessionId: string | null = null
    await act(async () => {
      sessionId = await result.current.createSession("check_in", config)
    })

    expect(sessionId).toBe("session-123")
    expect(mockFrom).toHaveBeenCalledWith("game_sessions")
    expect(chain.insert).toHaveBeenCalled()
    expect(chain.single).toHaveBeenCalled()
  })

  it("createSession returns null and sets error on failure", async () => {
    singleResult = {
      data: null,
      error: { message: "Insert failed" },
    }

    const { result } = renderHook(() => useGameEngine())

    const config: CheckInConfig = {
      categories: ["faith"],
      questionCount: 5,
      intensity: "light",
      includeOpenDiscussion: false,
      shareResultsInstantly: false,
      relationshipPulse: 5,
    }

    let sessionId: string | null = null
    await act(async () => {
      sessionId = await result.current.createSession("check_in", config)
    })

    expect(sessionId).toBeNull()
    expect(result.current.error).toBe("Insert failed")
  })

  // ─── Active Session Detection ───

  it("loadActiveSession queries game_sessions table", async () => {
    const { result } = renderHook(() => useGameEngine())

    await act(async () => {
      await result.current.loadActiveSession()
    })

    expect(mockFrom).toHaveBeenCalledWith("game_sessions")
  })

  // ─── Realtime Subscription ───

  it("sets up realtime subscription when sessionId provided", async () => {
    singleResult = {
      data: { id: "session-1", mode: "check_in", status: "playing" },
      error: null,
    }

    renderHook(() => useGameEngine("session-1"))

    // The subscription is set up synchronously in useEffect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(mockSupabase.channel).toHaveBeenCalledWith("game_rounds_session-1")
    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it("does not subscribe when no sessionId", () => {
    renderHook(() => useGameEngine())
    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })

  // ─── Answer History ───

  it("getAnswerHistory queries answer_history table", async () => {
    const { result } = renderHook(() => useGameEngine())

    await act(async () => {
      await result.current.getAnswerHistory("q-1")
    })

    expect(mockFrom).toHaveBeenCalledWith("answer_history")
    expect(chain.eq).toHaveBeenCalled()
  })

  // ─── Game → Wallet credit (T3) ───

  it("completeSession credits the local player's earned CoYYns to the wallet", async () => {
    singleResult = {
      data: {
        id: "s1",
        mode: "date_night",
        status: "playing",
        created_by: "user-1", // → isPlayer1 = true for user-1
        player1_score: 45,
        player2_score: 0,
        total_coyyns_earned: 45,
        started_at: new Date(Date.now() - 60000).toISOString(),
        alignment_score: null,
        category_scores: null,
      },
      error: null,
    }

    const { result } = renderHook(() => useGameEngine("s1"))

    // let the session load
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    // No prior credit row exists for this session
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    await act(async () => {
      await result.current.completeSession()
    })

    expect(mockFrom).toHaveBeenCalledWith("coyyns_transactions")

    const earnInsert = chain.insert.mock.calls
      .map((c: any[]) => c[0])
      .find((row: any) => row && row.type === "earn" && row.category === "game")

    expect(earnInsert).toBeTruthy()
    expect(earnInsert.amount).toBe(45)
    expect(earnInsert.user_id).toBe("user-1")
    expect(earnInsert.metadata.session_id).toBe("s1")
  })

  it("completeSession does NOT credit when no CoYYns were earned", async () => {
    singleResult = {
      data: {
        id: "s2",
        mode: "check_in",
        status: "playing",
        created_by: "user-1",
        player1_score: 0,
        player2_score: 0,
        total_coyyns_earned: 0,
        started_at: new Date(Date.now() - 60000).toISOString(),
        alignment_score: null,
        category_scores: null,
      },
      error: null,
    }

    const { result } = renderHook(() => useGameEngine("s2"))
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    await act(async () => {
      await result.current.completeSession()
    })

    const earnInsert = chain.insert.mock.calls
      .map((c: any[]) => c[0])
      .find((row: any) => row && row.type === "earn" && row.category === "game")

    expect(earnInsert).toBeFalsy()
  })

  it("completeSession does NOT double-credit when a session credit already exists", async () => {
    singleResult = {
      data: {
        id: "s3",
        mode: "date_night",
        status: "playing",
        created_by: "user-1",
        player1_score: 30,
        player2_score: 0,
        total_coyyns_earned: 30,
        started_at: new Date(Date.now() - 60000).toISOString(),
        alignment_score: null,
        category_scores: null,
      },
      error: null,
    }

    const { result } = renderHook(() => useGameEngine("s3"))
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    // A prior credit row for this session already exists → guard must skip insert
    chain.maybeSingle.mockResolvedValueOnce({ data: { id: "tx-existing" }, error: null })

    await act(async () => {
      await result.current.completeSession()
    })

    const earnInsert = chain.insert.mock.calls
      .map((c: any[]) => c[0])
      .find((row: any) => row && row.type === "earn" && row.category === "game")

    expect(earnInsert).toBeFalsy()
  })
})
