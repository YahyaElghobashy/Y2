import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockRedeemCoupon = vi.fn()
const mockApproveCoupon = vi.fn()
const mockRejectCoupon = vi.fn()

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

vi.mock("@/lib/hooks/use-coupons", () => ({
  useCoupons: () => ({
    myCoupons: [],
    receivedCoupons: [],
    pendingApprovals: [],
    isLoading: false,
    error: null,
    createCoupon: vi.fn(),
    redeemCoupon: mockRedeemCoupon,
    approveCoupon: mockApproveCoupon,
    rejectCoupon: mockRejectCoupon,
    revealSurprise: vi.fn(),
    refreshCoupons: vi.fn(),
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { RedeemConfirmModal } from "@/components/coupons/RedeemConfirmModal"

const baseCoupon = {
  id: "coupon1",
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

describe("RedeemConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRedeemCoupon.mockResolvedValue(undefined)
    mockApproveCoupon.mockResolvedValue(undefined)
    mockRejectCoupon.mockResolvedValue(undefined)
  })

  it("does not render when open is false", () => {
    render(
      <RedeemConfirmModal open={false} coupon={baseCoupon} mode="redeem" onClose={vi.fn()} />
    )
    expect(screen.queryByTestId("redeem-modal")).not.toBeInTheDocument()
  })

  it("renders redeem mode correctly", () => {
    render(
      <RedeemConfirmModal open={true} coupon={baseCoupon} mode="redeem" onClose={vi.fn()} />
    )
    expect(screen.getByText("Redeem Coupon")).toBeInTheDocument()
    expect(screen.getByTestId("modal-message")).toHaveTextContent("Are you sure you want to redeem")
    expect(screen.getByTestId("modal-confirm")).toHaveTextContent("Redeem")
  })

  it("renders approve mode correctly", () => {
    render(
      <RedeemConfirmModal open={true} coupon={baseCoupon} mode="approve" onClose={vi.fn()} />
    )
    expect(screen.getByText("Approve Redemption")).toBeInTheDocument()
    expect(screen.getByTestId("modal-confirm")).toHaveTextContent("Approve")
  })

  it("renders deny mode with reason textarea", () => {
    render(
      <RedeemConfirmModal open={true} coupon={baseCoupon} mode="deny" onClose={vi.fn()} />
    )
    expect(screen.getByTestId("deny-reason")).toBeInTheDocument()
    expect(screen.getByTestId("modal-confirm")).toHaveTextContent("Deny Coupon")
    expect(screen.getByTestId("modal-message")).toHaveTextContent("reason for denying")
  })

  it("shows coupon preview with emoji and title", () => {
    render(
      <RedeemConfirmModal open={true} coupon={baseCoupon} mode="redeem" onClose={vi.fn()} />
    )
    expect(screen.getByText("🎬")).toBeInTheDocument()
    expect(screen.getByText("Movie Night")).toBeInTheDocument()
  })

  it("calls redeemCoupon on redeem confirm", async () => {
    const onConfirm = vi.fn()
    render(
      <RedeemConfirmModal open={true} coupon={baseCoupon} mode="redeem" onClose={vi.fn()} onConfirm={onConfirm} />
    )
    fireEvent.click(screen.getByTestId("modal-confirm"))
    await waitFor(() => {
      expect(mockRedeemCoupon).toHaveBeenCalledWith("coupon1")
    })
  })

  it("calls approveCoupon on approve confirm", async () => {
    render(
      <RedeemConfirmModal open={true} coupon={baseCoupon} mode="approve" onClose={vi.fn()} />
    )
    fireEvent.click(screen.getByTestId("modal-confirm"))
    await waitFor(() => {
      expect(mockApproveCoupon).toHaveBeenCalledWith("coupon1")
    })
  })

  it("calls rejectCoupon with reason on deny confirm", async () => {
    render(
      <RedeemConfirmModal open={true} coupon={baseCoupon} mode="deny" onClose={vi.fn()} />
    )
    fireEvent.change(screen.getByTestId("deny-reason"), { target: { value: "Not now" } })
    fireEvent.click(screen.getByTestId("modal-confirm"))
    await waitFor(() => {
      expect(mockRejectCoupon).toHaveBeenCalledWith("coupon1", "Not now")
    })
  })

  it("closes on backdrop click", () => {
    const onClose = vi.fn()
    render(
      <RedeemConfirmModal open={true} coupon={baseCoupon} mode="redeem" onClose={onClose} />
    )
    fireEvent.click(screen.getByTestId("modal-backdrop"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("closes on X button click", () => {
    const onClose = vi.fn()
    render(
      <RedeemConfirmModal open={true} coupon={baseCoupon} mode="redeem" onClose={onClose} />
    )
    fireEvent.click(screen.getByTestId("modal-close"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
