import { renderHook, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──────────────────────────────────────────────
const mockSpendCoyyns = vi.fn()

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-1" } as { id: string } | null,
    partner: { id: "partner-1" } as { id: string } | null,
    profile: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  })),
}))

const { useCoyyns } = vi.hoisted(() => ({
  useCoyyns: vi.fn(() => ({
    wallet: { balance: 100 },
    partnerWallet: null,
    transactions: [],
    isLoading: false,
    error: null,
    addCoyyns: vi.fn(),
    spendCoyyns: mockSpendCoyyns,
    refreshWallet: vi.fn(),
  })),
}))

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockEq = vi.fn()
const mockRpc = vi.fn()
const mockChannel = vi.fn()
const mockOn = vi.fn()
const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
}))

mockSelect.mockReturnValue({ order: mockOrder })
mockOrder.mockReturnValue({ limit: mockLimit })
mockLimit.mockReturnValue({ data: [], error: null })
mockInsert.mockResolvedValue({ data: null, error: null })
mockUpdate.mockReturnValue({ eq: mockEq })
mockEq.mockResolvedValue({ data: null, error: null })
mockRpc.mockResolvedValue({ data: null, error: null })
mockOn.mockReturnThis()
mockSubscribe.mockReturnValue({ unsubscribe: vi.fn() })

const channelObj = { on: mockOn, subscribe: mockSubscribe }
mockChannel.mockReturnValue(channelObj)

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))
vi.mock("@/lib/hooks/use-coyyns", () => ({ useCoyyns }))

const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
  channel: mockChannel,
  removeChannel: mockRemoveChannel,
}
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}))

import { useChallenges } from "@/lib/hooks/use-challenges"

const SAMPLE_CHALLENGES = [
  {
    id: "ch-1", creator_id: "user-1", title: "Push-ups", description: null, emoji: "💪",
    stakes: 10, deadline: null, status: "active", claimed_by: null, winner_id: null,
    actual_transfer: null, acceptor_id: "partner-1", resolution_note: null,
    created_at: "2026-01-01", updated_at: "2026-01-01",
  },
  {
    id: "ch-2", creator_id: "partner-1", title: "Read a book", description: null, emoji: "📚",
    stakes: 20, deadline: null, status: "pending_acceptance", claimed_by: null, winner_id: null,
    actual_transfer: null, acceptor_id: null, resolution_note: null,
    created_at: "2026-01-02", updated_at: "2026-01-02",
  },
  {
    id: "ch-3", creator_id: "user-1", title: "Old challenge", description: null, emoji: null,
    stakes: 5, deadline: null, status: "resolved", claimed_by: "user-1", winner_id: "user-1",
    actual_transfer: 10, acceptor_id: "partner-1", resolution_note: null,
    created_at: "2025-12-01", updated_at: "2025-12-15",
  },
  {
    id: "ch-4", creator_id: "user-1", title: "Disputed", description: null, emoji: null,
    stakes: 15, deadline: null, status: "disputed", claimed_by: "partner-1", winner_id: null,
    actual_transfer: null, acceptor_id: "partner-1", resolution_note: "No way",
    created_at: "2025-12-10", updated_at: "2025-12-20",
  },
  {
    id: "ch-5", creator_id: "user-1", title: "Pending res", description: null, emoji: null,
    stakes: 10, deadline: null, status: "pending_resolution", claimed_by: "partner-1",
    winner_id: null, actual_transfer: null, acceptor_id: "partner-1", resolution_note: null,
    created_at: "2026-01-03", updated_at: "2026-01-03",
  },
]

describe("useChallenges", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSpendCoyyns.mockResolvedValue(undefined)
    mockLimit.mockReturnValue({ data: [], error: null })
    mockEq.mockResolvedValue({ data: null, error: null })
    mockInsert.mockResolvedValue({ data: null, error: null })
    mockRpc.mockResolvedValue({ data: null, error: null })

    useAuth.mockReturnValue({
      user: { id: "user-1" },
      partner: { id: "partner-1" },
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })
  })

  // ── Unit Tests ──────────────────────────────────────────

  it("returns inert state when user is null", () => {
    useAuth.mockReturnValue({
      user: null, partner: null, profile: null,
      isLoading: false, profileNeedsSetup: false,
      signOut: vi.fn(), refreshProfile: vi.fn(),
    })

    const { result } = renderHook(() => useChallenges())
    expect(result.current.activeChallenges).toEqual([])
    expect(result.current.pendingChallenges).toEqual([])
    expect(result.current.historyChallenges).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("returns isLoading=true initially", () => {
    const { result } = renderHook(() => useChallenges())
    expect(result.current.isLoading).toBe(true)
  })

  it("categorizes challenges into active, pending, and history", async () => {
    mockLimit.mockReturnValue({ data: SAMPLE_CHALLENGES, error: null })

    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // active includes: active, pending_resolution, disputed
    expect(result.current.activeChallenges).toHaveLength(3)
    expect(result.current.activeChallenges.map(c => c.id)).toEqual(
      expect.arrayContaining(["ch-1", "ch-4", "ch-5"])
    )

    // pending_acceptance
    expect(result.current.pendingChallenges).toHaveLength(1)
    expect(result.current.pendingChallenges[0].id).toBe("ch-2")

    // history: resolved
    expect(result.current.historyChallenges).toHaveLength(1)
    expect(result.current.historyChallenges[0].id).toBe("ch-3")
  })

  it("createChallenge rejects stakes < 5", async () => {
    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createChallenge({
        title: "Test", stakes: 3,
      })
    })

    expect(result.current.error).toBe("Minimum stake is 5 CoYYns")
    expect(mockSpendCoyyns).not.toHaveBeenCalled()
  })

  it("createChallenge calls spendCoyyns with correct args", async () => {
    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createChallenge({
        title: "Push-ups", stakes: 10, emoji: "💪",
      })
    })

    expect(mockSpendCoyyns).toHaveBeenCalledWith(10, "Challenge: Push-ups", "challenge_stake")
  })

  it("acceptChallenge calls spendCoyyns then updates status", async () => {
    mockLimit.mockReturnValue({ data: SAMPLE_CHALLENGES, error: null })

    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.acceptChallenge("ch-2")
    })

    expect(mockSpendCoyyns).toHaveBeenCalledWith(20, "Challenge: Read a book", "challenge_stake")
    expect(mockUpdate).toHaveBeenCalledWith({
      status: "active",
      acceptor_id: "user-1",
    })
  })

  it("claimVictory updates status to pending_resolution with claimed_by", async () => {
    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.claimVictory("ch-1")
    })

    expect(mockUpdate).toHaveBeenCalledWith({
      status: "pending_resolution",
      claimed_by: "user-1",
    })
  })

  it("disputeChallenge updates status to disputed with reason", async () => {
    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.disputeChallenge("ch-5", "I don't agree")
    })

    expect(mockUpdate).toHaveBeenCalledWith({
      status: "disputed",
      resolution_note: "I don't agree",
    })
  })

  // ── Interaction Tests ───────────────────────────────────

  it("confirmVictory calls resolve_challenge_payout RPC with correct params", async () => {
    mockLimit.mockReturnValue({ data: SAMPLE_CHALLENGES, error: null })

    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.confirmVictory("ch-5")
    })

    expect(mockRpc).toHaveBeenCalledWith("resolve_challenge_payout", {
      p_challenge_id: "ch-5",
      p_winner_id: "partner-1",
      p_amount: 20, // stakes * 2
    })
  })

  it("declineChallenge calls refund_challenge_stake RPC", async () => {
    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.declineChallenge("ch-2")
    })

    expect(mockRpc).toHaveBeenCalledWith("refund_challenge_stake", {
      p_challenge_id: "ch-2",
    })
  })

  // ── Integration Tests ───────────────────────────────────

  it("fetches from challenges table on mount", async () => {
    renderHook(() => useChallenges())
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("challenges")
    })
  })

  it("creates challenge with correct insert payload", async () => {
    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createChallenge({
        title: "Run 5k", stakes: 15, emoji: "🏃", description: "First to finish",
      })
    })

    expect(mockInsert).toHaveBeenCalledWith({
      creator_id: "user-1",
      title: "Run 5k",
      description: "First to finish",
      emoji: "🏃",
      stakes: 15,
      deadline: null,
      status: "pending_acceptance",
    })
  })

  it("subscribes to realtime challenges channel", async () => {
    renderHook(() => useChallenges())
    await waitFor(() => {
      expect(mockChannel).toHaveBeenCalledWith("challenges_user-1")
    })
    expect(mockOn).toHaveBeenCalled()
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it("cleans up realtime channel on unmount", async () => {
    const { unmount } = renderHook(() => useChallenges())
    await waitFor(() => {
      expect(mockChannel).toHaveBeenCalled()
    })

    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  it("sets error when createChallenge insert fails", async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: "DB error" } })

    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createChallenge({ title: "Fail", stakes: 10 })
    })

    expect(result.current.error).toBe("Failed to create challenge")
  })

  it("acceptChallenge sets error when challenge not found", async () => {
    const { result } = renderHook(() => useChallenges())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.acceptChallenge("nonexistent")
    })

    expect(result.current.error).toBe("Challenge not found")
  })
})
