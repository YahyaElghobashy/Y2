import { renderHook, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Auth mock ──────────────────────────────────────────────
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

// ── Chainable Supabase query-builder mock ──────────────────
// Every builder method returns the same thenable `chain`, so any
// sequence (.select().order(), .insert().select().single(),
// .update().eq().select().single(), .delete().eq()) resolves to the
// currently configured `result`.
let result: { data: unknown; error: unknown } = { data: [], error: null }
const setResult = (v: { data: unknown; error: unknown }) => {
  result = v
}

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()

const chain: Record<string, unknown> = {}
Object.assign(chain, {
  select: mockSelect.mockImplementation(() => chain),
  insert: mockInsert.mockImplementation(() => chain),
  update: mockUpdate.mockImplementation(() => chain),
  delete: mockDelete.mockImplementation(() => chain),
  eq: mockEq.mockImplementation(() => chain),
  order: mockOrder.mockImplementation(() => chain),
  single: mockSingle.mockImplementation(() => Promise.resolve(result)),
  // Canonical synchronous thenable: `await chain` resolves to the current
  // result. Kept synchronous (no Promise chaining) to avoid a worker
  // microtask hang observed with the chained-Promise form.
  then: (resolve: (v: unknown) => unknown) => resolve(result),
})

const mockFrom = vi.fn(() => chain)
// Stable singleton — returning a fresh object each call would change the
// hook's `supabase` reference every render and churn the effect deps.
const supabaseClient = { from: mockFrom }
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => supabaseClient,
}))

import { useMarketplaceAdmin, validateItemInput, validateEffectConfig } from "@/lib/hooks/use-marketplace-admin"
import type { MarketplaceItemInput } from "@/lib/types/marketplace.types"

const ITEM = {
  id: "item-1",
  name: "Extra Notification",
  description: "Send more",
  price: 10,
  icon: "🔔",
  effect_type: "extra_ping",
  effect_config: { extra_sends: 1 },
  is_active: true,
  sort_order: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const VALID_INPUT: MarketplaceItemInput = {
  name: "Coffee Run",
  description: "Bring me a coffee",
  price: 20,
  icon: "☕",
  effect_type: "task_order",
  effect_config: { deadline_hours: 12, task_description: "Bring me a coffee" },
  is_active: true,
  sort_order: 10,
}

function resetAuthed() {
  useAuth.mockReturnValue({
    user: { id: "user-1" },
    partner: { id: "partner-1" },
    profile: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  })
}

describe("validateItemInput (unit)", () => {
  it("accepts a valid payload", () => {
    expect(validateItemInput(VALID_INPUT)).toBeNull()
  })
  it("rejects an empty name", () => {
    expect(validateItemInput({ name: "   " })).toBe("Name is required")
  })
  it("rejects price <= 0 (matches DB price > 0 CHECK)", () => {
    expect(validateItemInput({ price: 0 })).toBe("Price must be a whole number greater than 0")
    expect(validateItemInput({ price: -5 })).toBe("Price must be a whole number greater than 0")
  })
  it("rejects a non-integer price (DB column is integer — would silently round)", () => {
    expect(validateItemInput({ price: 10.5 })).toBe("Price must be a whole number greater than 0")
  })
  it("rejects a non-integer sort_order", () => {
    expect(validateItemInput({ sort_order: 2.5 })).toBe("Sort order must be a whole number")
  })
  it("rejects an invalid effect_type (matches DB effect_type CHECK)", () => {
    expect(validateItemInput({ effect_type: "bogus" as never })).toBe("Invalid effect type")
  })
  it("rejects an empty icon", () => {
    expect(validateItemInput({ icon: "" })).toBe("Icon is required")
  })
  it("rejects a zero/NaN numeric effect_config (cleared form field) per effect type", () => {
    expect(
      validateItemInput({ effect_type: "extra_ping", effect_config: { extra_sends: 0 } }),
    ).toBe("Extra sends must be a whole number ≥ 1")
    expect(
      validateItemInput({ effect_type: "dnd_timer", effect_config: { duration_minutes: 0 } }),
    ).toBe("Duration (minutes) must be a whole number ≥ 1")
  })
})

describe("validateEffectConfig (unit)", () => {
  it("requires a positive integer for the type's numeric field", () => {
    expect(validateEffectConfig("extra_ping", { extra_sends: 2 })).toBeNull()
    expect(validateEffectConfig("dnd_timer", { duration_minutes: 60 })).toBeNull()
    expect(validateEffectConfig("task_order", { deadline_hours: 12 })).toBeNull()
    expect(validateEffectConfig("extra_ping", { extra_sends: 0 })).toBeTruthy()
    expect(validateEffectConfig("dnd_timer", {})).toBeTruthy()
  })
  it("accepts veto/wildcard (text-only prompt, no numeric requirement)", () => {
    expect(validateEffectConfig("veto", { input_prompt: "x" })).toBeNull()
    expect(validateEffectConfig("wildcard", {})).toBeNull()
  })
})

describe("useMarketplaceAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelect.mockImplementation(() => chain)
    mockInsert.mockImplementation(() => chain)
    mockUpdate.mockImplementation(() => chain)
    mockDelete.mockImplementation(() => chain)
    mockEq.mockImplementation(() => chain)
    mockOrder.mockImplementation(() => chain)
    mockSingle.mockImplementation(() => Promise.resolve(result))
    resetAuthed()
    setResult({ data: [ITEM, { ...ITEM, id: "item-2", is_active: false }], error: null })
  })

  it("loads ALL items (active + inactive) on mount", async () => {
    const { result: hook } = renderHook(() => useMarketplaceAdmin())
    await waitFor(() => expect(hook.current.isLoading).toBe(false))
    expect(mockFrom).toHaveBeenCalledWith("marketplace_items")
    expect(mockSelect).toHaveBeenCalledWith("*")
    expect(hook.current.items).toHaveLength(2)
    // Crucially does NOT filter is_active — inactive item present.
    expect(hook.current.items.some((i) => !i.is_active)).toBe(true)
  })

  it("createItem inserts the correct fields and returns the row", async () => {
    const { result: hook } = renderHook(() => useMarketplaceAdmin())
    await waitFor(() => expect(hook.current.isLoading).toBe(false))

    setResult({ data: { ...VALID_INPUT, id: "new-1", created_at: "", updated_at: "" }, error: null })
    await act(async () => {
      await hook.current.createItem(VALID_INPUT)
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Coffee Run",
        price: 20,
        icon: "☕",
        effect_type: "task_order",
        is_active: true,
        sort_order: 10,
      }),
    )
  })

  it("createItem rejects an invalid payload BEFORE hitting the network", async () => {
    const { result: hook } = renderHook(() => useMarketplaceAdmin())
    await waitFor(() => expect(hook.current.isLoading).toBe(false))
    mockInsert.mockClear()

    await expect(
      hook.current.createItem({ ...VALID_INPUT, price: 0 }),
    ).rejects.toThrow("Price must be a whole number greater than 0")
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("createItem maps a unique-name violation to a friendly message", async () => {
    const { result: hook } = renderHook(() => useMarketplaceAdmin())
    await waitFor(() => expect(hook.current.isLoading).toBe(false))

    setResult({ data: null, error: { message: "duplicate key value violates unique constraint \"marketplace_items_name_unique\"" } })
    await expect(hook.current.createItem(VALID_INPUT)).rejects.toThrow(
      "An item with that name already exists",
    )
  })

  it("updateItem patches only the supplied fields and targets the row id", async () => {
    const { result: hook } = renderHook(() => useMarketplaceAdmin())
    await waitFor(() => expect(hook.current.isLoading).toBe(false))

    setResult({ data: { ...ITEM, price: 99 }, error: null })
    await act(async () => {
      await hook.current.updateItem("item-1", { price: 99 })
    })

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ price: 99 }))
    // Did not include unrelated fields.
    expect(mockUpdate.mock.calls.at(-1)?.[0]).not.toHaveProperty("name")
    expect(mockEq).toHaveBeenCalledWith("id", "item-1")
  })

  it("toggleActive updates is_active for the row", async () => {
    const { result: hook } = renderHook(() => useMarketplaceAdmin())
    await waitFor(() => expect(hook.current.isLoading).toBe(false))

    setResult({ data: null, error: null })
    await act(async () => {
      await hook.current.toggleActive("item-1", false)
    })

    expect(mockUpdate).toHaveBeenCalledWith({ is_active: false })
    expect(mockEq).toHaveBeenCalledWith("id", "item-1")
    expect(hook.current.items.find((i) => i.id === "item-1")?.is_active).toBe(false)
  })

  it("deleteItem removes the row and maps an FK violation to a deactivate hint", async () => {
    const { result: hook } = renderHook(() => useMarketplaceAdmin())
    await waitFor(() => expect(hook.current.isLoading).toBe(false))

    setResult({ data: null, error: { code: "23503", message: "violates foreign key constraint" } })
    await expect(hook.current.deleteItem("item-1")).rejects.toThrow(
      "This item has been purchased — deactivate it instead",
    )

    // Successful delete drops it from state.
    setResult({ data: null, error: null })
    await act(async () => {
      await hook.current.deleteItem("item-2")
    })
    expect(mockDelete).toHaveBeenCalled()
    expect(hook.current.items.some((i) => i.id === "item-2")).toBe(false)
  })

  it("is inert when no user (auth-safe), mutations throw", async () => {
    useAuth.mockReturnValue({
      user: null,
      partner: null,
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })
    const { result: hook } = renderHook(() => useMarketplaceAdmin())
    expect(hook.current.items).toEqual([])
    expect(hook.current.isLoading).toBe(false)
    await expect(hook.current.createItem(VALID_INPUT)).rejects.toThrow("Not authenticated")
    await expect(hook.current.deleteItem("x")).rejects.toThrow("Not authenticated")
  })
})
