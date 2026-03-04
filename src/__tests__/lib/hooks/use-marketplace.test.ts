import { renderHook, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──────────────────────────────────────────────
const mockSpendCoyyns = vi.fn()

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-1" },
    partner: { id: "partner-1" },
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
const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockEq = vi.fn()
const mockInvoke = vi.fn()

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
}))

mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder })
mockEq.mockReturnValue({ order: mockOrder, data: [], error: null })
mockOrder.mockReturnValue({ limit: mockLimit, data: [], error: null })
mockLimit.mockReturnValue({ data: [], error: null })
mockInsert.mockReturnValue({ select: vi.fn(() => ({ single: mockSingle })) })
mockSingle.mockResolvedValue({ data: { id: "purchase-1" }, error: null })
mockInvoke.mockResolvedValue({ data: null, error: null })

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))
vi.mock("@/lib/hooks/use-coyyns", () => ({ useCoyyns }))
const mockSupabaseClient = {
  from: mockFrom,
  functions: { invoke: mockInvoke },
}
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}))

import { useMarketplace } from "@/lib/hooks/use-marketplace"

describe("useMarketplace", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSpendCoyyns.mockResolvedValue(undefined)
  })

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useMarketplace())
    expect(result.current.isLoading).toBe(true)
  })

  it("fetches items on mount", async () => {
    renderHook(() => useMarketplace())
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("marketplace_items")
    })
  })

  it("fetches purchases on mount", async () => {
    renderHook(() => useMarketplace())
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("purchases")
    })
  })

  it("returns inert state when user is null", () => {
    useAuth.mockReturnValue({
      user: null,
      partner: null,
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    const { result } = renderHook(() => useMarketplace())
    expect(result.current.items).toEqual([])
    expect(result.current.purchases).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("createPurchase throws when user is null", async () => {
    useAuth.mockReturnValue({
      user: null,
      partner: null,
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    const { result } = renderHook(() => useMarketplace())
    await expect(result.current.createPurchase("item-1")).rejects.toThrow("Not authenticated")
  })

  it("createPurchase throws when partner is null", async () => {
    useAuth.mockReturnValue({
      user: { id: "user-1" },
      partner: null,
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    // Return an item so it passes the item lookup
    mockOrder.mockReturnValueOnce({
      limit: mockLimit,
      data: [{ id: "item-1", name: "Test", price: 10, effect_type: "extra_ping", effect_config: {}, is_active: true, sort_order: 1, created_at: "" }],
      error: null,
    })

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await expect(result.current.createPurchase("item-1")).rejects.toThrow("No partner connected")
  })

  it("createPurchase calls spendCoyyns with item price and name", async () => {
    const testItem = {
      id: "item-1", name: "Extra Notification", description: "Send more",
      price: 10, icon: "🔔", effect_type: "extra_ping",
      effect_config: {}, is_active: true, sort_order: 1, created_at: "",
    }

    useAuth.mockReturnValue({
      user: { id: "user-1" },
      partner: { id: "partner-1" },
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    mockOrder.mockReturnValueOnce({
      limit: mockLimit,
      data: [testItem],
      error: null,
    })

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.createPurchase("item-1")
    expect(mockSpendCoyyns).toHaveBeenCalledWith(10, "Extra Notification", "marketplace")
  })

  it("createPurchase inserts purchase row with correct buyer, target, item, cost, and status", async () => {
    const testItem = {
      id: "item-1", name: "Extra Notification", description: "Send more",
      price: 10, icon: "🔔", effect_type: "extra_ping",
      effect_config: {}, is_active: true, sort_order: 1, created_at: "",
    }

    useAuth.mockReturnValue({
      user: { id: "user-1" },
      partner: { id: "partner-1" },
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    mockOrder.mockReturnValueOnce({
      limit: mockLimit,
      data: [testItem],
      error: null,
    })

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.createPurchase("item-1")

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        buyer_id: "user-1",
        target_id: "partner-1",
        item_id: "item-1",
        cost: 10,
        status: "pending",
      })
    )
  })
})
