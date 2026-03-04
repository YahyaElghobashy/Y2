import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
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

vi.mock("framer-motion", () => ({
  motion: {
    button: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, layoutId, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layoutId
      return <button ref={ref} {...rest}>{children}</button>
    }),
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, variants, layoutId, ...rest } = props
      void initial; void animate; void exit; void transition; void variants; void layoutId
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StaggerList: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  FadeIn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

import CouponWalletPage from "@/app/(main)/us/coupons/page"

const baseCoupon = {
  id: "c1",
  creator_id: "u1",
  recipient_id: "u2",
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

describe("CouponWalletPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCoupons.mockReturnValue(defaultHookReturn)
  })

  it("renders page with PageHeader", () => {
    render(<CouponWalletPage />)
    expect(screen.getByText("Coupons")).toBeInTheDocument()
  })

  it("renders three tab pills", () => {
    render(<CouponWalletPage />)
    expect(screen.getByTestId("tab-for-me")).toBeInTheDocument()
    expect(screen.getByTestId("tab-i-made")).toBeInTheDocument()
    expect(screen.getByTestId("tab-history")).toBeInTheDocument()
  })

  it("defaults to For Me tab", () => {
    render(<CouponWalletPage />)
    expect(screen.getByTestId("tab-for-me")).toHaveAttribute("aria-selected", "true")
  })

  it("switches to I Made tab on click", () => {
    render(<CouponWalletPage />)
    fireEvent.click(screen.getByTestId("tab-i-made"))
    expect(screen.getByTestId("tab-i-made")).toHaveAttribute("aria-selected", "true")
  })

  it("renders CouponCards in For Me tab", () => {
    const received = { ...baseCoupon, id: "r1", creator_id: "u2", recipient_id: "u1" }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      receivedCoupons: [received],
    })
    render(<CouponWalletPage />)
    expect(screen.getByTestId("coupon-card")).toBeInTheDocument()
    expect(screen.getByTestId("coupon-title")).toHaveTextContent("Movie Night")
  })

  it("renders empty state when no received coupons", () => {
    render(<CouponWalletPage />)
    expect(screen.getByText("No coupons yet")).toBeInTheDocument()
  })

  it("renders Needs Your Attention section for pending approvals in I Made tab", () => {
    const pending = { ...baseCoupon, id: "p1", status: "pending_approval" }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      myCoupons: [pending],
      pendingApprovals: [pending],
    })
    render(<CouponWalletPage />)
    fireEvent.click(screen.getByTestId("tab-i-made"))
    expect(screen.getByText("Needs Your Attention")).toBeInTheDocument()
    expect(screen.getByTestId("pending-section")).toBeInTheDocument()
  })

  it("renders empty state with CTA in I Made tab when no created coupons", () => {
    render(<CouponWalletPage />)
    fireEvent.click(screen.getByTestId("tab-i-made"))
    expect(screen.getByText("No coupons created")).toBeInTheDocument()
    expect(screen.getByText("Create one")).toBeInTheDocument()
  })

  it("shows loading state while data loads", () => {
    mockUseCoupons.mockReturnValue({ ...defaultHookReturn, isLoading: true })
    render(<CouponWalletPage />)
    expect(screen.getByTestId("loading-state")).toBeInTheDocument()
  })

  it("navigates to coupon detail on card press", () => {
    const received = { ...baseCoupon, id: "r1", creator_id: "u2", recipient_id: "u1" }
    mockUseCoupons.mockReturnValue({
      ...defaultHookReturn,
      receivedCoupons: [received],
    })
    render(<CouponWalletPage />)
    fireEvent.click(screen.getByTestId("coupon-card"))
    expect(mockPush).toHaveBeenCalledWith("/us/coupons/r1")
  })
})
