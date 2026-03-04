import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "c1" }),
  useRouter: () => ({ push: mockPush }),
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

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    void fill
    return <img {...rest} />
  },
}))

vi.mock("framer-motion", () => ({
  motion: {
    button: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <button ref={ref} {...rest}>{children}</button>
    }),
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, variants, onAnimationComplete, ...rest } = props
      void initial; void animate; void exit; void transition; void variants; void onAnimationComplete
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FadeIn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import CouponDetailPage from "@/app/(main)/us/coupons/[id]/page"

const baseCoupon = {
  id: "c1",
  creator_id: "u2",
  recipient_id: "u1",
  title: "Movie Night",
  description: "Pick any movie and snacks",
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
  receivedCoupons: [baseCoupon],
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

describe("CouponDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCoupons.mockReturnValue(defaultHookReturn)
  })

  it("shows loading skeleton while data loads", () => {
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, isLoading: true, receivedCoupons: [] })
    render(<CouponDetailPage />)
    expect(screen.queryByTestId("detail-title")).not.toBeInTheDocument()
  })

  it("shows 404 empty state for missing coupon", () => {
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, receivedCoupons: [] })
    render(<CouponDetailPage />)
    expect(screen.getByText("Coupon not found")).toBeInTheDocument()
  })

  it("shows error state with retry", () => {
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, error: "Failed", receivedCoupons: [] })
    render(<CouponDetailPage />)
    expect(screen.getByTestId("error-state")).toBeInTheDocument()
    expect(screen.getByTestId("retry-button")).toBeInTheDocument()
  })

  it("renders coupon title and description", () => {
    render(<CouponDetailPage />)
    expect(screen.getByTestId("detail-title")).toHaveTextContent("Movie Night")
    expect(screen.getByTestId("detail-description")).toHaveTextContent("Pick any movie and snacks")
  })

  it("renders photo when image_url exists", () => {
    const withPhoto = { ...baseCoupon, image_url: "https://example.com/photo.jpg" }
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, receivedCoupons: [withPhoto] })
    render(<CouponDetailPage />)
    expect(screen.getByTestId("coupon-photo")).toBeInTheDocument()
  })

  it("does not render photo when image_url is null", () => {
    render(<CouponDetailPage />)
    expect(screen.queryByTestId("coupon-photo")).not.toBeInTheDocument()
  })

  it("shows Redeem button for recipient of active coupon", () => {
    render(<CouponDetailPage />)
    expect(screen.getByTestId("redeem-button")).toBeInTheDocument()
    expect(screen.getByTestId("redeem-button")).toHaveTextContent("Redeem This Coupon")
  })

  it("shows Approve/Deny buttons for creator of pending coupon", () => {
    const pending = { ...baseCoupon, creator_id: "u1", recipient_id: "u2", status: "pending_approval" }
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, myCoupons: [pending], receivedCoupons: [] })
    render(<CouponDetailPage />)
    expect(screen.getByTestId("approve-button")).toBeInTheDocument()
    expect(screen.getByTestId("deny-button")).toBeInTheDocument()
  })

  it("hides action buttons for redeemed coupons", () => {
    const redeemed = { ...baseCoupon, status: "redeemed" }
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, receivedCoupons: [redeemed] })
    render(<CouponDetailPage />)
    expect(screen.queryByTestId("redeem-button")).not.toBeInTheDocument()
    expect(screen.queryByTestId("approve-button")).not.toBeInTheDocument()
  })

  it("shows REDEEMED stamp for redeemed status", () => {
    const redeemed = { ...baseCoupon, status: "redeemed" }
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, receivedCoupons: [redeemed] })
    render(<CouponDetailPage />)
    expect(screen.getByTestId("stamp-overlay")).toBeInTheDocument()
    expect(screen.getByText("REDEEMED")).toBeInTheDocument()
  })

  it("shows expiry countdown for coupons with expires_at", () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    const withExpiry = { ...baseCoupon, expires_at: future.toISOString() }
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, receivedCoupons: [withExpiry] })
    render(<CouponDetailPage />)
    expect(screen.getByTestId("detail-expiry")).toBeInTheDocument()
    expect(screen.getByTestId("detail-expiry").textContent).toMatch(/Expires/)
  })

  it("shows category and status badges", () => {
    render(<CouponDetailPage />)
    expect(screen.getByTestId("detail-category")).toHaveTextContent("fun")
    expect(screen.getByTestId("detail-status")).toBeInTheDocument()
  })
})
