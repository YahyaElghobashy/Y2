import { renderHook, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockUser = { id: "u1", email: "test@test.com" }
const mockSelect = vi.fn()
const mockInsert = vi.fn()

let mockAuthReturn = {
  user: mockUser as { id: string; email: string } | null,
  profile: null,
  partner: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuthReturn,
}))

// Build a chainable mock for supabase queries
function buildSelectChain(data: unknown[], error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: (table: string) => {
      if (table === "coyyns_transactions") {
        return {
          select: mockSelect,
          insert: mockInsert,
        }
      }
      return { select: vi.fn(), insert: vi.fn() }
    },
  }),
}))

import { useDailyBonus } from "@/lib/hooks/use-daily-bonus"

describe("useDailyBonus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthReturn = {
      ...mockAuthReturn,
      user: mockUser,
    }

    // Default: no existing bonus today
    const selectChain = buildSelectChain([])
    mockSelect.mockReturnValue(selectChain)

    // Default: insert succeeds
    mockInsert.mockResolvedValue({ error: null })
  })

  it("returns inert state when user is null", () => {
    mockAuthReturn = { ...mockAuthReturn, user: null }
    const { result } = renderHook(() => useDailyBonus())
    expect(result.current.claimed).toBe(false)
    expect(result.current.justClaimed).toBe(false)
  })

  it("claims bonus when none exists today", async () => {
    const selectChain = buildSelectChain([])
    mockSelect.mockReturnValue(selectChain)
    mockInsert.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useDailyBonus())

    await waitFor(() => {
      expect(result.current.claimed).toBe(true)
      expect(result.current.justClaimed).toBe(true)
    })

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "u1",
      amount: 5,
      type: "earn",
      category: "daily_bonus",
      description: "Daily login bonus",
    })
  })

  it("does not claim again when bonus already exists today", async () => {
    const selectChain = buildSelectChain([{ id: "existing-tx" }])
    mockSelect.mockReturnValue(selectChain)

    const { result } = renderHook(() => useDailyBonus())

    await waitFor(() => {
      expect(result.current.claimed).toBe(true)
    })

    expect(result.current.justClaimed).toBe(false)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("handles check error gracefully", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: "Network error" } }),
    }
    mockSelect.mockReturnValue(chain)

    const { result } = renderHook(() => useDailyBonus())

    // Should not crash — silently fails
    await waitFor(() => {
      expect(result.current.claimed).toBe(false)
      expect(result.current.justClaimed).toBe(false)
    })
  })

  it("handles insert error gracefully", async () => {
    const selectChain = buildSelectChain([])
    mockSelect.mockReturnValue(selectChain)
    mockInsert.mockResolvedValue({ error: { message: "Insert failed" } })

    const { result } = renderHook(() => useDailyBonus())

    // Should not crash — silently fails
    await waitFor(() => {
      expect(result.current.claimed).toBe(false)
    })
  })

  it("only checks once per mount (idempotent)", async () => {
    const selectChain = buildSelectChain([])
    mockSelect.mockReturnValue(selectChain)
    mockInsert.mockResolvedValue({ error: null })

    const { result, rerender } = renderHook(() => useDailyBonus())

    await waitFor(() => {
      expect(result.current.claimed).toBe(true)
    })

    rerender()
    rerender()

    // Should still only have been called once
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })
})
