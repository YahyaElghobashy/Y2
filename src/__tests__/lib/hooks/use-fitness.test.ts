import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { WeightLog } from "@/lib/types/health.types"

// ── Auth mock ─────────────────────────────────────────────────
const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockUseAuth = vi.fn<() => { user: { id: string; email: string } | null }>(() => ({ user: mockUser }))
vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth: () => mockUseAuth() }))

// ── Test data ─────────────────────────────────────────────────
const MOCK_HISTORY: WeightLog[] = [
  { id: "w-2", user_id: "user-1", weight_kg: 90, logged_at: "2026-06-08", note: null, created_at: "2026-06-08T07:00:00Z" },
  { id: "w-1", user_id: "user-1", weight_kg: 93, logged_at: "2026-06-01", note: null, created_at: "2026-06-01T07:00:00Z" },
]

// ── Supabase mock ─────────────────────────────────────────────
let selectResult = { data: MOCK_HISTORY as unknown[] | null, error: null as unknown }
let upsertResult = { error: null as unknown }
let deleteResult = { error: null as unknown }

const upsertCalls: unknown[] = []
const upsertOptions: unknown[] = []
const deleteEqCalls: Array<[string, unknown]> = []
const fromCalls: string[] = []

function buildChain(table: string) {
  fromCalls.push(table)
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  // terminal for select: .order() resolves
  chain.order = vi.fn(() => Promise.resolve(selectResult))
  chain.upsert = vi.fn((data: unknown, options: unknown) => {
    upsertCalls.push(data)
    upsertOptions.push(options)
    return Promise.resolve(upsertResult)
  })
  chain.delete = vi.fn(() => {
    const del: Record<string, ReturnType<typeof vi.fn>> = {}
    del.eq = vi.fn((col: string, val: unknown) => {
      deleteEqCalls.push([col, val])
      // second .eq is terminal
      return deleteEqCalls.length % 2 === 0 ? Promise.resolve(deleteResult) : del
    })
    return del
  })
  return chain
}

const mockFrom = vi.fn((table: string) => buildChain(table))
const stableSupabase = { from: mockFrom }
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

import { useFitness } from "@/lib/hooks/use-fitness"

describe("useFitness", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser })
    selectResult = { data: MOCK_HISTORY, error: null }
    upsertResult = { error: null }
    deleteResult = { error: null }
    upsertCalls.length = 0
    upsertOptions.length = 0
    deleteEqCalls.length = 0
    fromCalls.length = 0
  })

  // ── Unit: null user ──
  it("returns inert state when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null })
    const { result } = renderHook(() => useFitness())
    expect(result.current.history).toEqual([])
    expect(result.current.latest).toBeNull()
    expect(result.current.trend.direction).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it("does not call supabase when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null })
    renderHook(() => useFitness())
    expect(mockFrom).not.toHaveBeenCalled()
  })

  // ── Integration: fetch ──
  it("fetches own weight_logs ordered by logged_at desc on mount", async () => {
    const { result } = renderHook(() => useFitness())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fromCalls).toContain("weight_logs")
    expect(result.current.history).toHaveLength(2)
    expect(result.current.latest?.id).toBe("w-2")
    // trend derived: 90 - 93 over range = -3 down
    expect(result.current.trend.deltaOverRange).toBe(-3)
    expect(result.current.trend.direction).toBe("down")
  })

  it("surfaces an error when the fetch fails", async () => {
    selectResult = { data: null, error: { message: "boom" } }
    const { result } = renderHook(() => useFitness())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe("Failed to load weight history")
  })

  // ── Integration: logWeight upserts correct payload ──
  it("upserts with user_id, weight_kg, logged_at and the conflict target", async () => {
    const { result } = renderHook(() => useFitness())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.logWeight({ weightKg: 89.5, loggedAt: "2026-06-15" })
    })

    expect(upsertCalls[0]).toMatchObject({
      user_id: "user-1",
      weight_kg: 89.5,
      logged_at: "2026-06-15",
      note: null,
    })
    expect(upsertOptions[0]).toEqual({ onConflict: "user_id,logged_at" })
  })

  it("defaults logged_at to today when omitted", async () => {
    const { result } = renderHook(() => useFitness())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.logWeight({ weightKg: 88 })
    })

    const payload = upsertCalls[0] as { logged_at: string }
    expect(payload.logged_at).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("sets an error when upsert fails", async () => {
    upsertResult = { error: { message: "nope" } }
    const { result } = renderHook(() => useFitness())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.logWeight({ weightKg: 90 })
    })
    expect(result.current.error).toBe("Failed to save weight")
  })

  // ── Integration: deleteWeight scopes to id AND user_id (RLS-shaped) ──
  it("deletes by id scoped to the owner's user_id", async () => {
    const { result } = renderHook(() => useFitness())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deleteWeight("w-2")
    })

    expect(deleteEqCalls).toContainEqual(["id", "w-2"])
    expect(deleteEqCalls).toContainEqual(["user_id", "user-1"])
  })

  it("sets an error when delete fails", async () => {
    deleteResult = { error: { message: "denied" } }
    const { result } = renderHook(() => useFitness())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deleteWeight("w-2")
    })
    expect(result.current.error).toBe("Failed to delete entry")
  })

  // ── Empty history → empty trend ──
  it("derives an empty trend when there is no history", async () => {
    selectResult = { data: [], error: null }
    const { result } = renderHook(() => useFitness())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.latest).toBeNull()
    expect(result.current.trend.direction).toBeNull()
  })
})
