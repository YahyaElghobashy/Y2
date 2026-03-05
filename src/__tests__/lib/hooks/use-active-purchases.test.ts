import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useActivePurchases } from "@/lib/hooks/use-active-purchases"
import type { ActivePurchaseWithItem } from "@/lib/hooks/use-active-purchases"

// ── Mocks ──────────────────────────────────────────────

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))
vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

let mockQueryResult: { data: unknown[] | null; error: unknown } = { data: [], error: null }
let mockUpdateResult: { error: unknown } = { error: null }

function createSelectChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const intermediates = ["select", "or", "in", "eq"]
  for (const m of intermediates) {
    chain[m] = vi.fn().mockImplementation(() => chain)
  }
  chain.order = vi.fn().mockImplementation(() => Promise.resolve(mockQueryResult))
  return chain
}

function createUpdateChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.update = vi.fn().mockImplementation(() => chain)
  chain.eq = vi.fn().mockImplementation(() => Promise.resolve(mockUpdateResult))
  return chain
}

const mockSelectChain = createSelectChain()
const mockUpdateChain = createUpdateChain()

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
}
const mockRemoveChannel = vi.fn()

const mockFrom = vi.fn().mockImplementation(() => ({
  ...mockSelectChain,
  ...mockUpdateChain,
}))

// CRITICAL: Must return the SAME object every call so `supabase` is referentially
// stable in useEffect dependency arrays — otherwise infinite re-render loop.
const mockSupabaseClient = {
  from: mockFrom,
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: mockRemoveChannel,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}))

// ── Helpers ────────────────────────────────────────────

const mockUser = { id: "user-1", email: "test@test.com" }
const mockPartnerUser = { id: "partner-1", email: "partner@test.com" }

function makePurchase(overrides: Partial<ActivePurchaseWithItem> = {}): ActivePurchaseWithItem {
  return {
    id: "purchase-1",
    buyer_id: mockPartnerUser.id,
    target_id: mockUser.id,
    item_id: "item-1",
    status: "pending",
    effect_payload: null,
    created_at: new Date().toISOString(),
    completed_at: null,
    marketplace_items: {
      id: "item-1",
      name: "Test Item",
      description: "A test item",
      price: 50,
      effect_type: "task_order",
      effect_config: { task_description: "Do the dishes" },
      category: "fun",
      is_active: true,
      created_at: new Date().toISOString(),
    },
    ...overrides,
  } as ActivePurchaseWithItem
}

function setupQuery(data: unknown[] | null, error: unknown = null) {
  mockQueryResult = { data, error }
}

function setupUpdate(error: unknown = null) {
  mockUpdateResult = { error }
}

// ── Tests ──────────────────────────────────────────────

describe("useActivePurchases", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: [], error: null }
    mockUpdateResult = { error: null }
    useAuth.mockReturnValue({
      user: mockUser,
      profile: { id: mockUser.id, display_name: "Test", pairing_status: "paired" },
      partner: null,
      isLoading: false,
      refreshProfile: vi.fn(),
      signOut: vi.fn(),
      profileNeedsSetup: false,
    })
  })

  // ── Unit ────────────────────────────────────────────

  describe("unit", () => {
    it("returns inert state when user is null", () => {
      useAuth.mockReturnValue({
        user: null, profile: null, partner: null,
        isLoading: false, refreshProfile: vi.fn(), signOut: vi.fn(), profileNeedsSetup: false,
      })

      const { result } = renderHook(() => useActivePurchases())

      expect(result.current.activePurchases).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("starts with isLoading true when user exists", () => {
      setupQuery([])
      const { result } = renderHook(() => useActivePurchases())
      // Initially loading (before the async resolves)
      expect(result.current.isLoading).toBe(true)
    })

    it("loads active purchases on mount", async () => {
      const purchase = makePurchase()
      setupQuery([purchase])

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.activePurchases).toHaveLength(1)
      expect(result.current.activePurchases[0].id).toBe("purchase-1")
    })

    it("sets error on fetch failure", async () => {
      setupQuery(null, { message: "DB error" })

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe("Failed to load purchases")
      expect(result.current.activePurchases).toEqual([])
    })

    it("handles null data gracefully", async () => {
      setupQuery(null)

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.activePurchases).toEqual([])
    })
  })

  // ── Interaction ─────────────────────────────────────

  describe("interaction", () => {
    it("acknowledgePurchase optimistically updates status to active", async () => {
      const purchase = makePurchase({ status: "pending" })
      setupQuery([purchase])

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      setupUpdate()

      await act(async () => {
        await result.current.acknowledgePurchase("purchase-1")
      })

      expect(result.current.activePurchases[0].status).toBe("active")
    })

    it("completePurchase removes from active list", async () => {
      const purchase = makePurchase({ status: "active" })
      setupQuery([purchase])

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.activePurchases).toHaveLength(1)
      })

      setupUpdate()

      await act(async () => {
        await result.current.completePurchase("purchase-1")
      })

      expect(result.current.activePurchases).toHaveLength(0)
    })

    it("declinePurchase removes from active list", async () => {
      const purchase = makePurchase({ status: "pending" })
      setupQuery([purchase])

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.activePurchases).toHaveLength(1)
      })

      setupUpdate()

      await act(async () => {
        await result.current.declinePurchase("purchase-1")
      })

      expect(result.current.activePurchases).toHaveLength(0)
    })

    it("sets error when acknowledge fails", async () => {
      const purchase = makePurchase()
      setupQuery([purchase])

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      setupUpdate({ message: "Update error" })

      await act(async () => {
        await result.current.acknowledgePurchase("purchase-1")
      })

      expect(result.current.error).toBe("Failed to acknowledge purchase")
    })

    it("actions are no-ops when user is null", async () => {
      useAuth.mockReturnValue({
        user: null, profile: null, partner: null,
        isLoading: false, refreshProfile: vi.fn(), signOut: vi.fn(), profileNeedsSetup: false,
      })

      const { result } = renderHook(() => useActivePurchases())

      await act(async () => {
        await result.current.acknowledgePurchase("purchase-1")
      })

      expect(mockFrom).not.toHaveBeenCalled()
    })
  })

  // ── Integration ─────────────────────────────────────

  describe("integration", () => {
    it("queries purchases table with correct filters", async () => {
      setupQuery([])

      renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith("purchases")
      })

      expect(mockSelectChain.select).toHaveBeenCalledWith("*, marketplace_items(*)")
      expect(mockSelectChain.or).toHaveBeenCalledWith(
        `target_id.eq.${mockUser.id},buyer_id.eq.${mockUser.id}`
      )
      expect(mockSelectChain.in).toHaveBeenCalledWith("status", ["pending", "active"])
    })

    it("acknowledgePurchase calls update with correct status", async () => {
      const purchase = makePurchase()
      setupQuery([purchase])

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      setupUpdate()

      await act(async () => {
        await result.current.acknowledgePurchase("purchase-1")
      })

      expect(mockUpdateChain.update).toHaveBeenCalledWith({ status: "active" })
      expect(mockUpdateChain.eq).toHaveBeenCalledWith("id", "purchase-1")
    })

    it("completePurchase calls update with completed status and timestamp", async () => {
      const purchase = makePurchase({ status: "active" })
      setupQuery([purchase])

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      setupUpdate()

      await act(async () => {
        await result.current.completePurchase("purchase-1")
      })

      expect(mockUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed", completed_at: expect.any(String) })
      )
    })

    it("declinePurchase calls update with declined status", async () => {
      const purchase = makePurchase()
      setupQuery([purchase])

      const { result } = renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      setupUpdate()

      await act(async () => {
        await result.current.declinePurchase("purchase-1")
      })

      expect(mockUpdateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "declined", completed_at: expect.any(String) })
      )
    })

    it("subscribes to realtime purchases channel", async () => {
      setupQuery([])

      renderHook(() => useActivePurchases())

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled()
      })

      expect(mockChannel.on).toHaveBeenCalledWith(
        "postgres_changes",
        expect.objectContaining({
          event: "*",
          schema: "public",
          table: "purchases",
        }),
        expect.any(Function)
      )
    })
  })
})
