import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

// Mock date-fns to avoid timezone flakiness
vi.mock("date-fns", () => ({
  format: () => "Monday, March 2",
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock useAuth
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: {
      id: "user-1",
      display_name: "Yahya",
      email: "yahya@test.com",
      avatar_url: null,
      partner_id: "user-2",
      role: "user",
      created_at: "",
      updated_at: "",
    },
    partner: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

// Mock useCoyyns
const MOCK_TRANSACTIONS = [
  { id: "tx-1", user_id: "user-1", amount: 50, type: "earn", category: "routine", description: "Morning routine", metadata: {}, created_at: "2026-01-01T08:00:00Z" },
  { id: "tx-2", user_id: "user-1", amount: -200, type: "spend", category: "coupon", description: "Love coupon", metadata: {}, created_at: "2026-01-01T10:00:00Z" },
  { id: "tx-3", user_id: "user-1", amount: 75, type: "earn", category: "planning", description: "Date planning", metadata: {}, created_at: "2026-01-01T12:00:00Z" },
]

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns: () => ({
    wallet: { id: "w-1", user_id: "user-1", balance: 1240, lifetime_earned: 2000, lifetime_spent: 760, created_at: "", updated_at: "" },
    partnerWallet: null,
    transactions: MOCK_TRANSACTIONS,
    isLoading: false,
    error: null,
    addCoyyns: vi.fn(),
    spendCoyyns: vi.fn(),
    refreshWallet: vi.fn(),
  }),
}))

// Mock useCoupons (used by MoodStrip)
vi.mock("@/lib/hooks/use-coupons", () => ({
  useCoupons: () => ({
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
  }),
}))

// Mock useCycle (used by HomeCycleWidget)
vi.mock("@/lib/hooks/use-cycle", () => ({
  useCycle: () => ({
    config: null,
    currentDay: null,
    phase: null,
    daysUntilBreak: null,
    daysUntilActive: null,
    isPMSWindow: false,
    isPeriodLikely: false,
    nextPeriodDate: null,
    cycleLogs: [],
    isLoading: false,
    error: null,
    updateConfig: vi.fn(),
    addLog: vi.fn(),
    refreshCycle: vi.fn(),
  }),
}))

// Mock sonner (used by PurchaseConfirmModal)
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock useMarketplace (used by HomeMarketplaceRow)
vi.mock("@/lib/hooks/use-marketplace", () => ({
  useMarketplace: () => ({
    items: [],
    purchases: [],
    isLoading: false,
    error: null,
    createPurchase: vi.fn(),
    refreshItems: vi.fn(),
    refreshPurchases: vi.fn(),
  }),
}))

// Mock useNotifications (used by MoodStrip)
vi.mock("@/lib/hooks/use-notifications", () => ({
  useNotifications: () => ({
    notifications: [],
    dailyLimit: null,
    canSend: true,
    remainingSends: 2,
    isLoading: false,
    error: null,
    sendNotification: vi.fn(),
    purchaseBonusSend: vi.fn(),
    refreshLimits: vi.fn(),
  }),
}))

// Mock usePrayer (used by HomePrayerWidget)
vi.mock("@/lib/hooks/use-prayer", () => ({
  usePrayer: () => ({
    today: {
      id: "row-1",
      user_id: "user-1",
      date: "2026-03-04",
      fajr: true,
      dhuhr: true,
      asr: false,
      maghrib: false,
      isha: false,
      created_at: "",
      updated_at: "",
    },
    togglePrayer: vi.fn(),
    completedCount: 2,
    isLoading: false,
    error: null,
  }),
}))

import Home from "@/app/(main)/page"

describe("Home Page", () => {
  it("renders without crashing", () => {
    render(<Home />)
  })

  it("greeting text contains the profile name from useAuth", () => {
    render(<Home />)
    expect(screen.getByText(/Yahya/)).toBeInTheDocument()
  })

  it("renders CoyynsWidget in the first widget position", () => {
    render(<Home />)
    expect(screen.getByText("CoYYns")).toBeInTheDocument()
  })

  it("renders all 4 QuickActionCards", () => {
    render(<Home />)
    expect(screen.getByText("Us")).toBeInTheDocument()
    expect(screen.getByText("Me")).toBeInTheDocument()
    expect(screen.getByText("2026")).toBeInTheDocument()
    expect(screen.getByText("More")).toBeInTheDocument()
  })

  it("renders date text", () => {
    render(<Home />)
    expect(screen.getByText("Monday, March 2")).toBeInTheDocument()
  })
})
