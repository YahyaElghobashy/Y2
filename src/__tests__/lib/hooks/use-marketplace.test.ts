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
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: mockFrom,
    functions: { invoke: mockInvoke },
  }),
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
})
