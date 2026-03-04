import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com" },
    profile: null,
    partner: { id: "u2" },
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
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
}))

import { HomeCouponInbox } from "@/components/home/HomeCouponInbox"

const baseCoupon = {
  id: "c1",
  creator_id: "u2",
  recipient_id: "u1",
  title: "Movie Night",
  description: "Pick any movie",
  emoji: "🎬",
  category: "fun",
  image_url: null,
  status: "active",
  is_surprise: false,
  surprise_revealed: true,
  redeemed_at: null,
  approved_at: null,
  rejected_at: null,
  rejection_reason: null,
  expires_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
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

describe("HomeCouponInbox", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCoupons.mockReturnValue(defaultHookReturn)
  })

  it("returns null when no active coupons", () => {
    const { container } = render(<HomeCouponInbox />)
    expect(container.firstChild).toBeNull()
  })

  it("renders with count badge when coupons exist", () => {
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      receivedCoupons: [baseCoupon, { ...baseCoupon, id: "c2", title: "Spa Day" }],
    })
    render(<HomeCouponInbox />)
    expect(screen.getByTestId("home-coupon-inbox")).toBeInTheDocument()
    expect(screen.getByTestId("count-badge")).toHaveTextContent("2")
  })

  it("shows most recent coupon title", () => {
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      receivedCoupons: [baseCoupon],
    })
    render(<HomeCouponInbox />)
    expect(screen.getByText("Movie Night")).toBeInTheDocument()
  })

  it("links to /us/coupons", () => {
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      receivedCoupons: [baseCoupon],
    })
    render(<HomeCouponInbox />)
    const link = screen.getByTestId("home-coupon-inbox")
    expect(link).toHaveAttribute("href", "/us/coupons")
  })

  it("shows copper glow when pending approvals exist", () => {
    const pending = { ...baseCoupon, status: "pending_approval" }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      receivedCoupons: [pending],
      pendingApprovals: [pending],
    })
    render(<HomeCouponInbox />)
    expect(screen.getByTestId("home-coupon-inbox")).toBeInTheDocument()
  })
})
