import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}))

// ── Mock hook return values ──

const defaultCoyynsReturn = {
  wallet: { id: "w-1", user_id: "u-1", balance: 250, lifetime_earned: 500, lifetime_spent: 250, created_at: "", updated_at: "" } as { id: string; user_id: string; balance: number; lifetime_earned: number; lifetime_spent: number; created_at: string; updated_at: string } | null,
  partnerWallet: null,
  transactions: [],
  isLoading: false,
  error: null as string | null,
  addCoyyns: vi.fn(),
  spendCoyyns: vi.fn(),
  refreshWallet: vi.fn(),
}

const defaultCouponsReturn = {
  myCoupons: [
    { id: "c-1", creator_id: "u-1", recipient_id: "u-2", title: "Coupon 1", status: "active", category: "general", emoji: null, description: null, image_url: null, is_surprise: false, surprise_revealed: true, expires_at: null, redeemed_at: null, approved_at: null, rejected_at: null, rejection_reason: null, created_at: "", updated_at: "" },
  ],
  receivedCoupons: [
    { id: "c-2", creator_id: "u-2", recipient_id: "u-1", title: "Coupon 2", status: "active", category: "general", emoji: null, description: null, image_url: null, is_surprise: false, surprise_revealed: true, expires_at: null, redeemed_at: null, approved_at: null, rejected_at: null, rejection_reason: null, created_at: "", updated_at: "" },
    { id: "c-3", creator_id: "u-2", recipient_id: "u-1", title: "Coupon 3", status: "redeemed", category: "general", emoji: null, description: null, image_url: null, is_surprise: false, surprise_revealed: true, expires_at: null, redeemed_at: null, approved_at: null, rejected_at: null, rejection_reason: null, created_at: "", updated_at: "" },
  ],
  pendingApprovals: [],
  isLoading: false,
  error: null as string | null,
  createCoupon: vi.fn(),
  redeemCoupon: vi.fn(),
  approveCoupon: vi.fn(),
  rejectCoupon: vi.fn(),
  revealSurprise: vi.fn(),
  refreshCoupons: vi.fn(),
}

const defaultNotificationsReturn = {
  notifications: [],
  dailyLimit: null,
  canSend: true,
  remainingSends: 1,
  isLoading: false,
  error: null as string | null,
  sendNotification: vi.fn(),
  purchaseBonusSend: vi.fn(),
  refreshLimits: vi.fn(),
}

// ── Hoisted mocks ──

const { useCoyyns } = vi.hoisted(() => ({
  useCoyyns: vi.fn(() => defaultCoyynsReturn),
}))

const { useCoupons } = vi.hoisted(() => ({
  useCoupons: vi.fn(() => defaultCouponsReturn),
}))

const { useNotifications } = vi.hoisted(() => ({
  useNotifications: vi.fn(() => defaultNotificationsReturn),
}))

vi.mock("@/lib/hooks/use-coyyns", () => ({ useCoyyns }))
vi.mock("@/lib/hooks/use-coupons", () => ({ useCoupons }))
vi.mock("@/lib/hooks/use-notifications", () => ({ useNotifications }))

import { MoodStrip } from "@/components/home/MoodStrip"

describe("MoodStrip", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCoyyns.mockReturnValue({ ...defaultCoyynsReturn })
    useCoupons.mockReturnValue({ ...defaultCouponsReturn })
    useNotifications.mockReturnValue({ ...defaultNotificationsReturn })
  })

  it("renders without crashing", () => {
    render(<MoodStrip />)
    expect(screen.getByTestId("mood-strip")).toBeInTheDocument()
  })

  it("renders 4 chip buttons", () => {
    render(<MoodStrip />)
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(4)
  })

  it("displays CoYYns balance", () => {
    render(<MoodStrip />)
    expect(screen.getByText("250")).toBeInTheDocument()
  })

  it("displays active coupon count (only active status)", () => {
    render(<MoodStrip />)
    // 2 active coupons (c-1 from my, c-2 from received; c-3 is redeemed)
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("displays em dash for calendar placeholder", () => {
    render(<MoodStrip />)
    expect(screen.getByText("\u2014")).toBeInTheDocument()
  })

  it("displays remaining sends with /2 suffix", () => {
    render(<MoodStrip />)
    expect(screen.getByText("1/2")).toBeInTheDocument()
  })

  it("navigates to /us/coyyns when CoYYns chip is tapped", () => {
    render(<MoodStrip />)
    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[0])
    expect(mockPush).toHaveBeenCalledWith("/us/coyyns")
  })

  it("navigates to /us/coupons when coupons chip is tapped", () => {
    render(<MoodStrip />)
    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[1])
    expect(mockPush).toHaveBeenCalledWith("/us/coupons")
  })

  it("navigates to /us/calendar when calendar chip is tapped", () => {
    render(<MoodStrip />)
    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[2])
    expect(mockPush).toHaveBeenCalledWith("/us/calendar")
  })

  it("navigates to /us/ping when ping chip is tapped", () => {
    render(<MoodStrip />)
    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons[3])
    expect(mockPush).toHaveBeenCalledWith("/us/ping")
  })

  it("shows skeleton loading state when hooks are loading", () => {
    useCoyyns.mockReturnValue({ ...defaultCoyynsReturn, isLoading: true })

    render(<MoodStrip />)
    expect(screen.getByTestId("mood-strip-loading")).toBeInTheDocument()
    const pulses = document.querySelectorAll(".animate-skeleton-warm")
    expect(pulses).toHaveLength(4)
  })

  it("shows 0 balance gracefully", () => {
    useCoyyns.mockReturnValue({
      ...defaultCoyynsReturn,
      wallet: { ...defaultCoyynsReturn.wallet!, balance: 0 },
    })

    render(<MoodStrip />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("shows 0 active coupons when none are active", () => {
    useCoupons.mockReturnValue({
      ...defaultCouponsReturn,
      myCoupons: [],
      receivedCoupons: [],
    })

    render(<MoodStrip />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("formats large balance with commas", () => {
    useCoyyns.mockReturnValue({
      ...defaultCoyynsReturn,
      wallet: { ...defaultCoyynsReturn.wallet!, balance: 12500 },
    })

    render(<MoodStrip />)
    expect(screen.getByText("12,500")).toBeInTheDocument()
  })

  it("handles null wallet gracefully (shows 0)", () => {
    useCoyyns.mockReturnValue({
      ...defaultCoyynsReturn,
      wallet: null,
    })

    render(<MoodStrip />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })
})
