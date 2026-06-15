import { renderHook, waitFor } from "@testing-library/react"
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
vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

// Chainable query mock — every builder method returns the chain; the chain is
// thenable so `await query` resolves to `queryResult`.
let queryResult: { data: unknown[]; error: unknown } = { data: [], error: null }

const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
for (const m of ["select", "or", "in", "order", "limit"]) {
  chain[m] = vi.fn(() => chain)
}
chain.then = vi.fn((resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
  Promise.resolve(queryResult).then(resolve, reject)
)

const mockFrom = vi.fn(() => chain)
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}
const mockSupabase = {
  from: mockFrom,
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
}
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

import { usePurchaseHistory } from "@/lib/hooks/use-purchase-history"

describe("usePurchaseHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryResult = { data: [], error: null }
    chain.then = vi.fn((resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(queryResult).then(resolve, reject)
    )
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

  // ── Unit ──────────────────────────────────────────────

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

    const { result } = renderHook(() => usePurchaseHistory())
    expect(result.current.history).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  // ── Integration ───────────────────────────────────────

  it("queries the purchases table on mount", async () => {
    renderHook(() => usePurchaseHistory())
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("purchases")
    })
  })

  it("filters to terminal statuses for both partners", async () => {
    renderHook(() => usePurchaseHistory())

    await waitFor(() => {
      expect(chain.in).toHaveBeenCalledWith("status", [
        "completed",
        "declined",
        "expired",
      ])
    })
    expect(chain.or).toHaveBeenCalledWith(
      "target_id.eq.user-1,buyer_id.eq.user-1"
    )
    // joins the marketplace_items so the UI can render item name/icon
    expect(chain.select).toHaveBeenCalledWith("*, marketplace_items(*)")
  })

  it("maps returned rows into history", async () => {
    queryResult = {
      data: [
        { id: "h-1", status: "completed", buyer_id: "user-1", target_id: "partner-1" },
      ],
      error: null,
    }
    chain.then = vi.fn((resolve: (v: unknown) => unknown) =>
      Promise.resolve(queryResult).then(resolve)
    )

    const { result } = renderHook(() => usePurchaseHistory())
    await waitFor(() => {
      expect(result.current.history).toHaveLength(1)
    })
    expect(result.current.history[0].id).toBe("h-1")
  })

  it("subscribes to realtime purchase changes", async () => {
    renderHook(() => usePurchaseHistory())
    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith("purchase_history_user-1")
    })
    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it("sets error when the query fails", async () => {
    queryResult = { data: [], error: { message: "boom" } }
    chain.then = vi.fn((resolve: (v: unknown) => unknown) =>
      Promise.resolve(queryResult).then(resolve)
    )

    const { result } = renderHook(() => usePurchaseHistory())
    await waitFor(() => {
      expect(result.current.error).toBe("Failed to load purchase history")
    })
  })
})
