import { renderHook, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──────────────────────────────────────────────
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

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockOrder = vi.fn()
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
mockOrder.mockReturnValue({ data: [], error: null })
mockInsert.mockResolvedValue({ data: null, error: null })
mockUpdate.mockReturnValue({ eq: mockEq })
mockEq.mockResolvedValue({ data: null, error: null })
mockRpc.mockResolvedValue({ data: null, error: null })
mockOn.mockReturnThis()
mockSubscribe.mockReturnValue({ unsubscribe: vi.fn() })

const channelObj = { on: mockOn, subscribe: mockSubscribe }
mockChannel.mockReturnValue(channelObj)

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
  channel: mockChannel,
  removeChannel: mockRemoveChannel,
}
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}))

import { useBounties } from "@/lib/hooks/use-bounties"

const SAMPLE_BOUNTIES = [
  {
    id: "b-1", creator_id: "user-1", title: "Cook dinner",
    trigger_description: "Cook a full dinner", reward: 15,
    is_recurring: true, is_active: true,
    created_at: "2026-01-01", updated_at: "2026-01-01",
  },
  {
    id: "b-2", creator_id: "partner-1", title: "Back rub",
    trigger_description: "Give a 10-min back rub", reward: 10,
    is_recurring: false, is_active: true,
    created_at: "2026-01-02", updated_at: "2026-01-02",
  },
  {
    id: "b-3", creator_id: "user-1", title: "Inactive",
    trigger_description: "Old bounty", reward: 5,
    is_recurring: false, is_active: false,
    created_at: "2025-12-01", updated_at: "2025-12-15",
  },
]

const SAMPLE_CLAIMS = [
  {
    id: "cl-1", bounty_id: "b-1", claimer_id: "partner-1",
    confirmed_by: null, status: "pending",
    created_at: "2026-01-05", updated_at: "2026-01-05",
  },
  {
    id: "cl-2", bounty_id: "b-2", claimer_id: "user-1",
    confirmed_by: "partner-1", status: "confirmed",
    created_at: "2026-01-03", updated_at: "2026-01-04",
  },
]

describe("useBounties", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Restore default mock implementations
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    }))
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockReturnValue({ data: [], error: null })
    mockEq.mockResolvedValue({ data: null, error: null })
    mockInsert.mockResolvedValue({ data: null, error: null })
    mockRpc.mockResolvedValue({ data: null, error: null })
    mockOn.mockReturnThis()
    mockSubscribe.mockReturnValue({ unsubscribe: vi.fn() })
    mockChannel.mockReturnValue(channelObj)

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

    const { result } = renderHook(() => useBounties())
    expect(result.current.activeBounties).toEqual([])
    expect(result.current.pendingClaims).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("returns isLoading=true initially", () => {
    const { result } = renderHook(() => useBounties())
    expect(result.current.isLoading).toBe(true)
  })

  it("filters activeBounties by is_active=true", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "bounties") {
        return { select: () => ({ order: () => ({ data: SAMPLE_BOUNTIES, error: null }) }) }
      }
      return { select: () => ({ order: () => ({ data: SAMPLE_CLAIMS, error: null }) }) }
    })

    const { result } = renderHook(() => useBounties())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.activeBounties).toHaveLength(2)
    expect(result.current.activeBounties.map(b => b.id)).toEqual(
      expect.arrayContaining(["b-1", "b-2"])
    )
  })

  it("filters pendingClaims by status=pending", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "bounties") {
        return { select: () => ({ order: () => ({ data: SAMPLE_BOUNTIES, error: null }) }) }
      }
      return { select: () => ({ order: () => ({ data: SAMPLE_CLAIMS, error: null }) }) }
    })

    const { result } = renderHook(() => useBounties())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.pendingClaims).toHaveLength(1)
    expect(result.current.pendingClaims[0].id).toBe("cl-1")
  })

  it("createBounty rejects reward <= 0", async () => {
    const { result } = renderHook(() => useBounties())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createBounty({
        title: "Bad", trigger_description: "...", reward: 0,
      })
    })

    expect(result.current.error).toBe("Reward must be greater than 0")
    expect(mockInsert).not.toHaveBeenCalled()
  })

  // ── Interaction Tests ───────────────────────────────────

  it("createBounty inserts with correct payload", async () => {
    const { result } = renderHook(() => useBounties())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createBounty({
        title: "Cook dinner",
        trigger_description: "Make a full meal",
        reward: 15,
        is_recurring: true,
      })
    })

    expect(mockFrom).toHaveBeenCalledWith("bounties")
    expect(mockInsert).toHaveBeenCalledWith({
      creator_id: "user-1",
      title: "Cook dinner",
      trigger_description: "Make a full meal",
      reward: 15,
      is_recurring: true,
    })
  })

  it("claimBounty inserts claim with claimer_id", async () => {
    const { result } = renderHook(() => useBounties())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.claimBounty("b-1")
    })

    expect(mockFrom).toHaveBeenCalledWith("bounty_claims")
    expect(mockInsert).toHaveBeenCalledWith({
      bounty_id: "b-1",
      claimer_id: "user-1",
    })
  })

  it("confirmClaim calls confirm_bounty_claim RPC", async () => {
    const { result } = renderHook(() => useBounties())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.confirmClaim("cl-1")
    })

    expect(mockRpc).toHaveBeenCalledWith("confirm_bounty_claim", {
      p_claim_id: "cl-1",
    })
  })

  it("denyClaim updates claim status to denied", async () => {
    const { result } = renderHook(() => useBounties())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.denyClaim("cl-1")
    })

    expect(mockUpdate).toHaveBeenCalledWith({ status: "denied" })
    expect(mockEq).toHaveBeenCalledWith("id", "cl-1")
  })

  // ── Integration Tests ───────────────────────────────────

  it("fetches from bounties and bounty_claims on mount", async () => {
    renderHook(() => useBounties())
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("bounties")
      expect(mockFrom).toHaveBeenCalledWith("bounty_claims")
    })
  })

  it("subscribes to realtime bounties channel", async () => {
    renderHook(() => useBounties())
    await waitFor(() => {
      expect(mockChannel).toHaveBeenCalledWith("bounties_user-1")
    })
    expect(mockOn).toHaveBeenCalled()
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it("cleans up realtime channel on unmount", async () => {
    const { unmount } = renderHook(() => useBounties())
    await waitFor(() => {
      expect(mockChannel).toHaveBeenCalled()
    })

    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  it("sets error when createBounty fails", async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: "DB error" } })

    const { result } = renderHook(() => useBounties())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createBounty({
        title: "Fail", trigger_description: "...", reward: 10,
      })
    })

    expect(result.current.error).toBe("Failed to create bounty")
  })
})
