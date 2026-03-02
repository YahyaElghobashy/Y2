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

const MOCK_WALLET = {
  id: "wallet-1",
  user_id: "user-1",
  balance: 100,
  lifetime_earned: 200,
  lifetime_spent: 100,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const MOCK_PARTNER_WALLET = {
  id: "wallet-2",
  user_id: "user-2",
  balance: 50,
  lifetime_earned: 80,
  lifetime_spent: 30,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const MOCK_TRANSACTIONS = [
  {
    id: "tx-1",
    user_id: "user-1",
    amount: 10,
    type: "earn",
    category: "manual",
    description: "Test earn",
    metadata: {},
    created_at: "2026-01-02T00:00:00Z",
  },
]

// --- Mocks ---
const mockInsert = vi.fn()
const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()

let realtimeCallbacks: Array<{
  filter: string
  callback: (payload: { new: Record<string, unknown> }) => void
}> = []

const mockChannel = {
  on: vi.fn(function (this: typeof mockChannel, _event: string, opts: { filter: string }, cb: (payload: { new: Record<string, unknown> }) => void) {
    realtimeCallbacks.push({ filter: opts.filter, callback: cb })
    return this
  }),
  subscribe: mockSubscribe,
}

// Build chainable query mock
function buildQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    insert: mockInsert,
  }
  // Make each method return the chain for chaining
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  chain.limit.mockReturnValue(chain)
  return chain
}

let queryResults: Map<string, { data: unknown; error: unknown }>

function setupQueryResults() {
  queryResults = new Map([
    ["coyyns_wallets", { data: MOCK_WALLET, error: null }],
    ["coyyns_transactions", { data: MOCK_TRANSACTIONS, error: null }],
  ])
}

const mockFrom = vi.fn((table: string) => {
  // For wallet queries: single() returns wallet
  // For transaction queries: limit() returns array
  const isWallet = table === "coyyns_wallets"
  const result = queryResults.get(table) ?? { data: null, error: null }

  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn((col: string, val: string) => {
    // If querying partner wallet
    if (isWallet && col === "user_id" && val === MOCK_PARTNER.id) {
      chain.single = vi.fn().mockResolvedValue({ data: MOCK_PARTNER_WALLET, error: null })
    }
    return chain
  })
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockResolvedValue(result)
  chain.single = vi.fn().mockResolvedValue(result)
  chain.insert = mockInsert

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

// Import after mocks
import { useCoyyns } from "@/lib/hooks/use-coyyns"

describe("useCoyyns", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    realtimeCallbacks = []
    setupQueryResults()
    mockInsert.mockResolvedValue({ error: null })
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

  it("returns isLoading: true on initial render before data resolves", () => {
    const { result } = renderHook(() => useCoyyns())
    // isLoading starts true (before the useEffect resolves)
    expect(result.current.isLoading).toBe(true)
  })

  it("returns isLoading: false and populated wallet after successful fetch", async () => {
    const { result } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.wallet).toEqual(MOCK_WALLET)
    expect(result.current.partnerWallet).toEqual(MOCK_PARTNER_WALLET)
    expect(result.current.transactions).toEqual(MOCK_TRANSACTIONS)
  })

  it("addCoyyns calls Supabase insert with type 'earn' and positive amount", async () => {
    const { result } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.addCoyyns(10, "Test earn", "challenge")
    })

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      amount: 10,
      type: "earn",
      category: "challenge",
      description: "Test earn",
    })
  })

  it("addCoyyns calls refreshWallet after a successful insert", async () => {
    const { result } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Clear mock calls from initial load
    mockFrom.mockClear()

    await act(async () => {
      await result.current.addCoyyns(5, "Earn some")
    })

    // refreshWallet re-fetches wallet and transactions
    expect(mockFrom).toHaveBeenCalledWith("coyyns_wallets")
    expect(mockFrom).toHaveBeenCalledWith("coyyns_transactions")
  })

  it("spendCoyyns calls Supabase insert with type 'spend' and negative amount when balance is sufficient", async () => {
    const { result } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.spendCoyyns(20, "Buy something", "marketplace")
    })

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      amount: -20,
      type: "spend",
      category: "marketplace",
      description: "Buy something",
    })
  })

  it("spendCoyyns does NOT call Supabase insert when balance is insufficient", async () => {
    const { result } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.spendCoyyns(999, "Too expensive")
    })

    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("spendCoyyns sets error to 'Insufficient CoYYns balance' when balance is insufficient", async () => {
    const { result } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.spendCoyyns(999, "Too expensive")
    })

    expect(result.current.error).toBe("Insufficient CoYYns balance")
  })

  it("error is cleared to null at the start of each new addCoyyns or spendCoyyns call", async () => {
    const { result } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Trigger an error first
    await act(async () => {
      await result.current.spendCoyyns(999, "Too expensive")
    })
    expect(result.current.error).toBe("Insufficient CoYYns balance")

    // Now call addCoyyns — error should clear
    await act(async () => {
      await result.current.addCoyyns(5, "Some earn")
    })
    expect(result.current.error).toBeNull()
  })

  it("addCoyyns sets error if the amount is not a positive integer", async () => {
    const { result } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Test non-integer
    await act(async () => {
      await result.current.addCoyyns(1.5, "Fractional")
    })
    expect(result.current.error).toBe("Amount must be a positive integer")

    // Test zero
    await act(async () => {
      await result.current.addCoyyns(0, "Zero")
    })
    expect(result.current.error).toBe("Amount must be a positive integer")

    // Test negative
    await act(async () => {
      await result.current.addCoyyns(-5, "Negative")
    })
    expect(result.current.error).toBe("Amount must be a positive integer")

    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("returns null wallet and empty transactions when user is null (unauthenticated)", () => {
    mockAuthReturn.user = null
    mockAuthReturn.partner = null

    const { result } = renderHook(() => useCoyyns())

    expect(result.current.wallet).toBeNull()
    expect(result.current.partnerWallet).toBeNull()
    expect(result.current.transactions).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("establishes realtime subscription on mount", async () => {
    renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        expect.stringContaining("coyyns_wallets_")
      )
    })

    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it("cleans up realtime subscription on unmount", async () => {
    const { unmount } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled()
    })

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
  })

  it("uses 'manual' as default category when not provided", async () => {
    const { result } = renderHook(() => useCoyyns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.addCoyyns(10, "No category")
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: "manual" })
    )
  })
})
