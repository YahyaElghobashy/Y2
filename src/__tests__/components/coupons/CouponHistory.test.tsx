import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com" },
    profile: null,
    partner: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

const mockUseCoupons = vi.fn()
vi.mock("@/lib/hooks/use-coupons", () => ({
  useCoupons: () => mockUseCoupons(),
}))

vi.mock("framer-motion", () => ({
  motion: {
    button: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <button ref={ref} {...rest}>{children}</button>
    }),
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, variants, ...rest } = props
      void initial; void animate; void exit; void transition; void variants
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  StaggerList: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  FadeIn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

import { CouponHistory } from "@/components/coupons/CouponHistory"

const baseCoupon = {
  id: "c1",
  creator_id: "u1",
  recipient_id: "u2",
  title: "Movie Night",
  description: "Pick any movie",
  emoji: "🎬",
  category: "fun",
  image_url: null,
  status: "redeemed",
  is_surprise: false,
  surprise_revealed: true,
  redeemed_at: "2026-03-01T10:00:00Z",
  approved_at: "2026-03-01T12:00:00Z",
  rejected_at: null,
  rejection_reason: null,
  expires_at: null,
  created_at: "2026-02-15T00:00:00Z",
  updated_at: "2026-03-01T12:00:00Z",
}

const defaultHookReturn = {
  myCoupons: [],
  receivedCoupons: [],
  pendingApprovals: [],
  isLoading: false,
  error: null,
  createCoupon: vi.fn(),
  redeemCoupon: vi.fn(),
  approveCoupon: vi.fn(),
  rejectCoupon: vi.fn(),
  revealSurprise: vi.fn(),
  refreshCoupons: vi.fn(),
}

describe("CouponHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCoupons.mockReturnValue(defaultHookReturn)
  })

  it("renders empty state when no history coupons exist", () => {
    render(<CouponHistory />)
    expect(screen.getByText("No history yet")).toBeInTheDocument()
    expect(screen.getByText("Redeemed and expired coupons will appear here")).toBeInTheDocument()
  })

  it("renders loading skeleton while loading", () => {
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, isLoading: true })
    render(<CouponHistory />)
    expect(screen.queryByTestId("coupon-history")).not.toBeInTheDocument()
  })

  it("renders month dividers correctly", () => {
    const marchCoupon = { ...baseCoupon, id: "c1", approved_at: "2026-03-10T00:00:00Z" }
    const febCoupon = { ...baseCoupon, id: "c2", approved_at: "2026-02-15T00:00:00Z", updated_at: "2026-02-15T00:00:00Z" }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      myCoupons: [marchCoupon, febCoupon],
    })
    render(<CouponHistory />)
    const dividers = screen.getAllByTestId("month-divider")
    expect(dividers).toHaveLength(2)
    expect(dividers[0]).toHaveTextContent("March 2026")
    expect(dividers[1]).toHaveTextContent("February 2026")
  })

  it("renders compact CouponCards", () => {
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      myCoupons: [baseCoupon],
    })
    render(<CouponHistory />)
    expect(screen.getByTestId("coupon-card")).toBeInTheDocument()
    // In compact mode, description should not appear
    expect(screen.queryByTestId("coupon-description")).not.toBeInTheDocument()
  })

  it("shows activity labels with timestamps", () => {
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      myCoupons: [baseCoupon],
    })
    render(<CouponHistory />)
    const labels = screen.getAllByTestId("activity-label")
    expect(labels[0]).toHaveTextContent("Redeemed Mar 1, 2026")
  })

  it("shows 'Expired' label for expired coupons", () => {
    const expired = {
      ...baseCoupon,
      status: "expired",
      approved_at: null,
      redeemed_at: null,
      expires_at: "2026-02-15T23:59:59Z",
    }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      myCoupons: [expired],
    })
    render(<CouponHistory />)
    // The label uses expires_at for expired coupons
    expect(screen.getByTestId("activity-label").textContent).toMatch(/Expired/)
  })

  it("shows 'Denied' label for rejected coupons", () => {
    const rejected = {
      ...baseCoupon,
      status: "rejected",
      approved_at: null,
      redeemed_at: null,
      rejected_at: "2026-03-02T00:00:00Z",
    }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      myCoupons: [rejected],
    })
    render(<CouponHistory />)
    expect(screen.getByTestId("activity-label")).toHaveTextContent("Denied Mar 2, 2026")
  })

  it("sorts by activity date descending", () => {
    const older = { ...baseCoupon, id: "c-old", title: "Older", approved_at: "2026-02-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z" }
    const newer = { ...baseCoupon, id: "c-new", title: "Newer", approved_at: "2026-03-15T00:00:00Z", updated_at: "2026-03-15T00:00:00Z" }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      myCoupons: [older, newer],
    })
    render(<CouponHistory />)
    const cards = screen.getAllByTestId("coupon-title")
    expect(cards[0]).toHaveTextContent("Newer")
    expect(cards[1]).toHaveTextContent("Older")
  })

  it("deduplicates coupons appearing in both myCoupons and receivedCoupons", () => {
    const coupon = { ...baseCoupon, id: "c-dup" }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      myCoupons: [coupon],
      receivedCoupons: [coupon],
    })
    render(<CouponHistory />)
    const cards = screen.getAllByTestId("coupon-card")
    expect(cards).toHaveLength(1)
  })

  it("excludes active and pending_approval coupons", () => {
    const active = { ...baseCoupon, id: "c-active", status: "active" }
    const pending = { ...baseCoupon, id: "c-pending", status: "pending_approval" }
    const redeemed = { ...baseCoupon, id: "c-redeemed", status: "redeemed" }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      myCoupons: [active, pending, redeemed],
    })
    render(<CouponHistory />)
    const cards = screen.getAllByTestId("coupon-card")
    expect(cards).toHaveLength(1)
  })
})
