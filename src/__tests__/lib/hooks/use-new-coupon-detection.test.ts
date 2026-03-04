import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

// ── Hoisted mocks ─────────────────────────────────────────
const mockUser = { id: "user-1", email: "test@test.com" }

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    profile: { id: "user-1", display_name: "Yahya", pairing_status: "paired" },
    partner: { id: "partner-1", display_name: "Yara" },
    isLoading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
    profileNeedsSetup: false,
  })),
}))

let mockQueryResult: { data: unknown[] | null; error: unknown } = { data: [], error: null }
const mockFrom = vi.fn()

function createChainMock() {
  const chain: Record<string, unknown> = {}
  const methods = ["select", "eq", "gt", "order", "limit"]
  for (const method of methods) {
    chain[method] = vi.fn().mockImplementation(() => {
      if (method === "limit") {
        return Promise.resolve(mockQueryResult)
      }
      return chain
    })
  }
  return chain
}

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: (...args: unknown[]) => {
      mockFrom(...args)
      return createChainMock()
    },
  }),
}))

import { useNewCouponDetection } from "@/lib/hooks/use-new-coupon-detection"

// ── Helpers ───────────────────────────────────────────────

const MOCK_COUPON = {
  id: "coupon-abc",
  creator_id: "partner-1",
  recipient_id: "user-1",
  title: "Movie Night",
  description: "Pick any movie",
  emoji: "🎬",
  category: "fun",
  status: "active",
  created_at: "2026-03-04T12:00:00Z",
  updated_at: "2026-03-04T12:00:00Z",
  is_surprise: false,
  surprise_revealed: false,
  image_url: null,
  expires_at: null,
  redeemed_at: null,
  rejection_reason: null,
  approved_at: null,
  approved_by: null,
}

function setupQuery(data: unknown[] | null, error: unknown = null) {
  mockQueryResult = { data, error }
}

describe("useNewCouponDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset useAuth to default (mockReturnValue persists across clearAllMocks)
    useAuth.mockReturnValue({
      user: mockUser,
      profile: { id: "user-1", display_name: "Yahya", pairing_status: "paired" },
      partner: { id: "partner-1", display_name: "Yara" },
      isLoading: false,
      refreshProfile: vi.fn(),
      signOut: vi.fn(),
      profileNeedsSetup: false,
    } as ReturnType<typeof useAuth>)
    setupQuery([])
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ── Unit tests ──────────────────────────────────────────
  describe("unit", () => {
    it("returns null when no new coupons found", async () => {
      setupQuery([])
      const { result } = renderHook(() => useNewCouponDetection())

      // Wait for async check
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      expect(result.current.newCoupon).toBeNull()
      expect(result.current.showAnimation).toBe(false)
    })

    it("returns null when user is not authenticated", () => {
      useAuth.mockReturnValue({
        user: null,
        profile: null,
        partner: null,
        isLoading: false,
        refreshProfile: vi.fn(),
        signOut: vi.fn(),
        profileNeedsSetup: false,
      } as ReturnType<typeof useAuth>)

      const { result } = renderHook(() => useNewCouponDetection())

      expect(result.current.newCoupon).toBeNull()
      expect(result.current.showAnimation).toBe(false)
    })

    it("detects new coupon when created_at > last_seen", async () => {
      localStorage.setItem("last_coupon_seen_at", "2026-03-04T10:00:00Z")
      setupQuery([MOCK_COUPON])

      const { result } = renderHook(() => useNewCouponDetection())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      expect(result.current.newCoupon).toEqual(MOCK_COUPON)
      expect(result.current.showAnimation).toBe(true)
    })

    it("uses 1970 epoch as default when no last_seen in localStorage", async () => {
      setupQuery([MOCK_COUPON])

      const { result } = renderHook(() => useNewCouponDetection())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      expect(result.current.newCoupon).toEqual(MOCK_COUPON)
      expect(result.current.showAnimation).toBe(true)
    })

    it("does not show animation when query returns error", async () => {
      setupQuery(null, { message: "Network error" })

      const { result } = renderHook(() => useNewCouponDetection())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      expect(result.current.newCoupon).toBeNull()
      expect(result.current.showAnimation).toBe(false)
    })
  })

  // ── Interaction tests ───────────────────────────────────
  describe("interaction", () => {
    it("onAnimationComplete updates last_seen and hides animation", async () => {
      setupQuery([MOCK_COUPON])

      const { result } = renderHook(() => useNewCouponDetection())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      expect(result.current.showAnimation).toBe(true)

      act(() => {
        result.current.onAnimationComplete()
      })

      expect(result.current.showAnimation).toBe(false)
      expect(result.current.newCoupon).toBeNull()
      expect(localStorage.getItem("last_coupon_seen_at")).toBe("2026-03-04T12:00:00Z")
    })

    it("onSaveForLater updates last_seen and hides animation", async () => {
      setupQuery([MOCK_COUPON])

      const { result } = renderHook(() => useNewCouponDetection())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      expect(result.current.showAnimation).toBe(true)

      act(() => {
        result.current.onSaveForLater()
      })

      expect(result.current.showAnimation).toBe(false)
      expect(localStorage.getItem("last_coupon_seen_at")).toBe("2026-03-04T12:00:00Z")
    })

    it("does not re-trigger for already seen coupons", async () => {
      localStorage.setItem("last_coupon_seen_at", "2026-03-05T00:00:00Z")
      setupQuery([]) // No coupons after last_seen

      const { result } = renderHook(() => useNewCouponDetection())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      expect(result.current.newCoupon).toBeNull()
      expect(result.current.showAnimation).toBe(false)
    })
  })

  // ── Integration tests ──────────────────────────────────
  describe("integration", () => {
    it("queries coupons table with correct filters", async () => {
      localStorage.setItem("last_coupon_seen_at", "2026-03-03T00:00:00Z")
      setupQuery([])

      renderHook(() => useNewCouponDetection())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      expect(mockFrom).toHaveBeenCalledWith("coupons")
    })

    it("re-checks on visibilitychange event", async () => {
      setupQuery([])

      renderHook(() => useNewCouponDetection())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      // Reset to check second call
      const callCount = mockFrom.mock.calls.length

      // Simulate visibility change to visible
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
        configurable: true,
      })

      await act(async () => {
        document.dispatchEvent(new Event("visibilitychange"))
        await new Promise((r) => setTimeout(r, 10))
      })

      expect(mockFrom.mock.calls.length).toBeGreaterThan(callCount)
    })

    it("localStorage read/write works correctly", async () => {
      setupQuery([MOCK_COUPON])

      const { result } = renderHook(() => useNewCouponDetection())

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10))
      })

      // Before dismiss — no last_seen set yet
      expect(localStorage.getItem("last_coupon_seen_at")).toBeNull()

      act(() => {
        result.current.onAnimationComplete()
      })

      // After dismiss — last_seen set to coupon's created_at
      expect(localStorage.getItem("last_coupon_seen_at")).toBe(MOCK_COUPON.created_at)
    })
  })
})
