import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

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

vi.mock("framer-motion", () => ({
  motion: {
    button: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <button ref={ref} {...rest}>{children}</button>
    }),
  },
}))

import { CouponCard } from "@/components/relationship/CouponCard"

const baseCoupon = {
  id: "coupon1",
  creator_id: "u1",
  recipient_id: "u2",
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

describe("CouponCard", () => {
  it("renders coupon title", () => {
    render(<CouponCard coupon={baseCoupon} />)
    expect(screen.getByTestId("coupon-title")).toHaveTextContent("Movie Night")
  })

  it("renders emoji", () => {
    render(<CouponCard coupon={baseCoupon} />)
    expect(screen.getByText("🎬")).toBeInTheDocument()
  })

  it("renders description", () => {
    render(<CouponCard coupon={baseCoupon} />)
    expect(screen.getByTestId("coupon-description")).toHaveTextContent("Pick any movie and snacks")
  })

  it("renders category badge", () => {
    render(<CouponCard coupon={baseCoupon} />)
    expect(screen.getByTestId("coupon-category")).toHaveTextContent("fun")
  })

  it("renders status dot", () => {
    render(<CouponCard coupon={baseCoupon} />)
    expect(screen.getByTestId("coupon-status-dot")).toBeInTheDocument()
  })

  it("shows 'You' as creator when current user is creator", () => {
    render(<CouponCard coupon={baseCoupon} />)
    expect(screen.getByText("by You")).toBeInTheDocument()
  })

  it("shows 'Partner' when current user is not creator", () => {
    const coupon = { ...baseCoupon, creator_id: "u2" }
    render(<CouponCard coupon={coupon} />)
    expect(screen.getByText("by Partner")).toBeInTheDocument()
  })

  it("shows surprise guard when surprise not revealed", () => {
    const coupon = { ...baseCoupon, is_surprise: true, surprise_revealed: false }
    render(<CouponCard coupon={coupon} />)
    expect(screen.getByTestId("coupon-surprise")).toBeInTheDocument()
    expect(screen.getByText("Tap to reveal")).toBeInTheDocument()
  })

  it("does not show surprise guard when revealed", () => {
    const coupon = { ...baseCoupon, is_surprise: true, surprise_revealed: true }
    render(<CouponCard coupon={coupon} />)
    expect(screen.queryByTestId("coupon-surprise")).not.toBeInTheDocument()
    expect(screen.getByTestId("coupon-title")).toHaveTextContent("Movie Night")
  })

  it("hides description in compact mode", () => {
    render(<CouponCard coupon={baseCoupon} compact />)
    expect(screen.queryByTestId("coupon-description")).not.toBeInTheDocument()
  })

  it("calls onPress when clicked", () => {
    const onPress = vi.fn()
    render(<CouponCard coupon={baseCoupon} onPress={onPress} />)
    fireEvent.click(screen.getByTestId("coupon-card"))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
