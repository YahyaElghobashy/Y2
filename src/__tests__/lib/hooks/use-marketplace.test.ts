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

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockEq = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateEq = vi.fn()
const mockInvoke = vi.fn()
// The atomic purchase RPC replaces the old spendCoyyns + purchases.insert flow.
const mockRpc = vi.fn()

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
}))

mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder })
mockEq.mockReturnValue({ order: mockOrder, data: [], error: null })
mockOrder.mockReturnValue({ limit: mockLimit, data: [], error: null })
mockLimit.mockReturnValue({ data: [], error: null })
mockInsert.mockReturnValue({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })) })
mockUpdate.mockReturnValue({ eq: mockUpdateEq })
mockUpdateEq.mockResolvedValue({ data: null, error: null })
mockInvoke.mockResolvedValue({ data: null, error: null })

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))
const mockSupabaseClient = {
  from: mockFrom,
  functions: { invoke: mockInvoke },
  rpc: mockRpc,
}
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}))

import { useMarketplace } from "@/lib/hooks/use-marketplace"

const TEST_ITEM = {
  id: "item-1", name: "Extra Notification", description: "Send more",
  price: 10, icon: "🔔", effect_type: "extra_ping",
  effect_config: {}, is_active: true, sort_order: 1, created_at: "",
}

function authAs(user: unknown, partner: unknown) {
  useAuth.mockReturnValue({
    user, partner, profile: null, isLoading: false,
    profileNeedsSetup: false, signOut: vi.fn(), refreshProfile: vi.fn(),
  } as never)
}

describe("useMarketplace", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // RPC succeeds by default, returning the created purchase row.
    mockRpc.mockResolvedValue({ data: { id: "purchase-1" }, error: null })
    authAs({ id: "user-1" }, { id: "partner-1" })
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
    authAs(null, null)
    const { result } = renderHook(() => useMarketplace())
    expect(result.current.items).toEqual([])
    expect(result.current.purchases).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("createPurchase throws when user is null", async () => {
    authAs(null, null)
    const { result } = renderHook(() => useMarketplace())
    await expect(result.current.createPurchase("item-1")).rejects.toThrow("Not authenticated")
  })

  it("createPurchase throws when partner is null", async () => {
    authAs({ id: "user-1" }, null)
    mockOrder.mockReturnValueOnce({ limit: mockLimit, data: [TEST_ITEM], error: null })

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await expect(result.current.createPurchase("item-1")).rejects.toThrow("No partner connected")
  })

  it("createPurchase calls the atomic purchase RPC with item, target, and effect payload", async () => {
    mockOrder.mockReturnValueOnce({ limit: mockLimit, data: [TEST_ITEM], error: null })

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.createPurchase("item-1", { foo: "bar" })

    expect(mockRpc).toHaveBeenCalledWith("purchase_marketplace_item", {
      p_item_id: "item-1",
      p_target_id: "partner-1",
      p_effect_payload: { foo: "bar" },
    })
  })

  it("createPurchase returns the purchase row produced by the RPC", async () => {
    mockOrder.mockReturnValueOnce({ limit: mockLimit, data: [TEST_ITEM], error: null })
    mockRpc.mockResolvedValueOnce({ data: { id: "purchase-xyz" }, error: null })

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const purchase = await result.current.createPurchase("item-1")
    expect(purchase).toEqual({ id: "purchase-xyz" })
  })

  // ── P0 REGRESSION: no item delivered without a charge ──────────
  it("createPurchase REJECTS and never invokes the effect when the RPC reports INSUFFICIENT_FUNDS", async () => {
    mockOrder.mockReturnValueOnce({ limit: mockLimit, data: [TEST_ITEM], error: null })
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'INSUFFICIENT_FUNDS' },
    })

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(result.current.createPurchase("item-1")).rejects.toThrow(
      "Insufficient CoYYns balance"
    )

    // The effect must NOT run — the partner never receives an uncharged item.
    expect(mockInvoke).not.toHaveBeenCalled()
    // No purchase row written outside the (failed, atomic) RPC.
    expect(mockFrom).not.toHaveBeenCalledWith("notifications")
  })

  it("createPurchase REJECTS and never invokes the effect on a generic RPC failure", async () => {
    mockOrder.mockReturnValueOnce({ limit: mockLimit, data: [TEST_ITEM], error: null })
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } })

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(result.current.createPurchase("item-1")).rejects.toThrow(
      "Failed to complete purchase"
    )
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("createPurchase invokes the process-purchase edge function on success", async () => {
    const vetoItem = { ...TEST_ITEM, id: "item-1", name: "Movie Night Veto", price: 25, effect_type: "veto" }
    mockOrder.mockReturnValueOnce({ limit: mockLimit, data: [vetoItem], error: null })

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.createPurchase("item-1", { movie: "Inception" })

    expect(mockInvoke).toHaveBeenCalledWith(
      "process-purchase",
      expect.objectContaining({
        body: expect.objectContaining({
          purchase_id: "purchase-1",
          item_id: "item-1",
          effect_type: "veto",
          effect_payload: { movie: "Inception" },
          buyer_id: "user-1",
          target_id: "partner-1",
        }),
      })
    )
  })

  it("createPurchase falls back to an in-app notification + activates when the edge function fails", async () => {
    const taskItem = { ...TEST_ITEM, id: "item-1", name: "Breakfast in Bed", price: 40, icon: "🍳", effect_type: "task_order" }
    mockOrder.mockReturnValueOnce({ limit: mockLimit, data: [taskItem], error: null })
    // RPC (spend + purchase) succeeded; only the effect/push failed.
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: "push failed" } })

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await result.current.createPurchase("item-1")

    expect(mockFrom).toHaveBeenCalledWith("notifications")
    const notifInsert = mockInsert.mock.calls
      .map((c) => c[0])
      .find((row) => row && row.type === "marketplace_effect")
    expect(notifInsert).toBeTruthy()
    expect(notifInsert.recipient_id).toBe("partner-1")
    expect(notifInsert.metadata.fallback).toBe(true)
    expect(notifInsert.status).toBe("sent")

    expect(mockUpdate).toHaveBeenCalledWith({ status: "active" })

    warnSpy.mockRestore()
  })
})
