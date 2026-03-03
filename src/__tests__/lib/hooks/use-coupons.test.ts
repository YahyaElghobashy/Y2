import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mock data ---
const MOCK_USER = { id: "user-1" }
const MOCK_PARTNER = {
  id: "user-2",
  display_name: "Yara",
  email: "yara@test.com",
  avatar_url: null,
  partner_id: "user-1",
  role: "user",
  created_at: "",
  updated_at: "",
}

const MOCK_MY_COUPONS = [
  {
    id: "coupon-1",
    creator_id: "user-1",
    recipient_id: "user-2",
    title: "Breakfast in bed",
    description: "A lovely morning treat",
    emoji: null,
    category: "food",
    image_url: null,
    status: "active",
    is_surprise: false,
    surprise_revealed: true,
    redeemed_at: null,
    approved_at: null,
    rejected_at: null,
    rejection_reason: null,
    expires_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "coupon-2",
    creator_id: "user-1",
    recipient_id: "user-2",
    title: "Movie night",
    description: null,
    emoji: null,
    category: "fun",
    image_url: null,
    status: "pending_approval",
    is_surprise: false,
    surprise_revealed: true,
    redeemed_at: "2026-01-05T00:00:00Z",
    approved_at: null,
    rejected_at: null,
    rejection_reason: null,
    expires_at: null,
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-05T00:00:00Z",
  },
]

const MOCK_RECEIVED_COUPONS = [
  {
    id: "coupon-3",
    creator_id: "user-2",
    recipient_id: "user-1",
    title: "Spa day",
    description: null,
    emoji: null,
    category: "romantic",
    image_url: null,
    status: "active",
    is_surprise: false,
    surprise_revealed: true,
    redeemed_at: null,
    approved_at: null,
    rejected_at: null,
    rejection_reason: null,
    expires_at: null,
    created_at: "2026-01-03T00:00:00Z",
    updated_at: "2026-01-03T00:00:00Z",
  },
]

// --- Supabase mock ---
const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: mockSubscribe,
}

const mockUpdate = vi.fn(() => ({
  eq: vi.fn().mockResolvedValue({ error: null }),
}))

const mockInsertChain = {
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: {
      id: "coupon-new",
      creator_id: "user-1",
      recipient_id: "user-2",
      title: "New coupon",
      description: null,
      emoji: null,
      category: "general",
      image_url: null,
      status: "active",
      is_surprise: false,
      surprise_revealed: true,
      redeemed_at: null,
      approved_at: null,
      rejected_at: null,
      rejection_reason: null,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    error: null,
  }),
}
const mockInsert = vi.fn().mockReturnValue(mockInsertChain)

const mockFrom = vi.fn((table: string) => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn((col: string) => {
    if (table === "coupons") {
      if (col === "creator_id") {
        chain.order = vi.fn().mockResolvedValue({ data: MOCK_MY_COUPONS, error: null })
      } else if (col === "recipient_id") {
        chain.order = vi.fn().mockResolvedValue({ data: MOCK_RECEIVED_COUPONS, error: null })
      } else if (col === "id") {
        // For update operations
        return { eq: vi.fn().mockResolvedValue({ error: null }) }
      }
    }
    return chain
  })
  chain.order = vi.fn().mockResolvedValue({ data: [], error: null })
  chain.insert = mockInsert
  chain.update = mockUpdate

  return chain
})

const mockSupabase = {
  from: mockFrom,
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: mockRemoveChannel,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

let mockAuthReturn = {
  user: MOCK_USER as { id: string } | null,
  partner: MOCK_PARTNER as typeof MOCK_PARTNER | null,
  profile: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuthReturn,
}))

import { useCoupons } from "@/lib/hooks/use-coupons"

describe("useCoupons", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthReturn = {
      user: MOCK_USER as { id: string } | null,
      partner: MOCK_PARTNER as typeof MOCK_PARTNER | null,
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    }
  })

  it("myCoupons is populated from Supabase query where creator_id = user.id", async () => {
    const { result } = renderHook(() => useCoupons())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.myCoupons).toEqual(MOCK_MY_COUPONS)
  })

  it("receivedCoupons is populated from Supabase query where recipient_id = user.id", async () => {
    const { result } = renderHook(() => useCoupons())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.receivedCoupons).toEqual(MOCK_RECEIVED_COUPONS)
  })

  it("pendingApprovals equals myCoupons filtered to status === 'pending_approval'", async () => {
    const { result } = renderHook(() => useCoupons())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.pendingApprovals).toHaveLength(1)
    expect(result.current.pendingApprovals[0].id).toBe("coupon-2")
  })

  it("isLoading is true during fetch and false after resolution", async () => {
    const { result } = renderHook(() => useCoupons())

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it("createCoupon calls Supabase insert with correct fields", async () => {
    const { result } = renderHook(() => useCoupons())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createCoupon({ title: "New coupon" })
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        creator_id: "user-1",
        recipient_id: "user-2",
        title: "New coupon",
        status: "active",
        category: "general",
      })
    )
  })

  it("error is set when a Supabase query fails", async () => {
    mockFrom.mockImplementationOnce(() => {
      const chain: Record<string, ReturnType<typeof vi.fn>> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.order = vi.fn().mockResolvedValue({ data: null, error: { message: "Query failed" } })
      return chain
    })

    const { result } = renderHook(() => useCoupons())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("Query failed")
  })

  it("hook does not fetch when user is null (unauthenticated)", () => {
    mockAuthReturn.user = null

    const { result } = renderHook(() => useCoupons())

    expect(result.current.myCoupons).toEqual([])
    expect(result.current.receivedCoupons).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it("realtime subscription is cleaned up on unmount", async () => {
    const { unmount } = renderHook(() => useCoupons())

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled()
    })

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalled()
  })
})
