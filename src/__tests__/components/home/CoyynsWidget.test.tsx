import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
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

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
  },
}))

// Mock data
const MOCK_WALLET = {
  id: "w-1",
  user_id: "user-1",
  balance: 1240,
  lifetime_earned: 2000,
  lifetime_spent: 760,
  created_at: "",
  updated_at: "",
}

const MOCK_TRANSACTIONS = [
  { id: "tx-1", user_id: "user-1", amount: 50, type: "earn", category: "routine", description: "Morning routine", metadata: {}, created_at: "2026-01-01T08:00:00Z" },
  { id: "tx-2", user_id: "user-1", amount: -200, type: "spend", category: "coupon", description: "Love coupon", metadata: {}, created_at: "2026-01-01T10:00:00Z" },
  { id: "tx-3", user_id: "user-1", amount: 75, type: "earn", category: "planning", description: "Date planning", metadata: {}, created_at: "2026-01-01T12:00:00Z" },
  { id: "tx-4", user_id: "user-1", amount: 100, type: "earn", category: "bonus", description: "Extra task", metadata: {}, created_at: "2026-01-01T14:00:00Z" },
]

const defaultCoyynsReturn = {
  wallet: MOCK_WALLET,
  partnerWallet: null,
  transactions: MOCK_TRANSACTIONS,
  isLoading: false,
  error: null as string | null,
  addCoyyns: vi.fn(),
  spendCoyyns: vi.fn(),
  refreshWallet: vi.fn(),
}

const { useCoyyns } = vi.hoisted(() => {
  return {
    useCoyyns: vi.fn(() => defaultCoyynsReturn),
  }
})

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns,
}))

import { CoyynsWidget } from "@/components/home/CoyynsWidget"

describe("CoyynsWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCoyyns.mockReturnValue({ ...defaultCoyynsReturn })
  })

  it("renders the card container without crashing", () => {
    render(<CoyynsWidget />)
  })

  it('renders "CoYYns" label text', () => {
    render(<CoyynsWidget />)
    expect(screen.getByText(/CoYYns/)).toBeInTheDocument()
  })

  it("renders coin emoji indicator", () => {
    render(<CoyynsWidget />)
    expect(screen.getByText(/🪙/)).toBeInTheDocument()
  })

  it("renders 3 transaction rows when transactions has 3+ entries", () => {
    render(<CoyynsWidget />)
    expect(screen.getByText(/Morning routine/)).toBeInTheDocument()
    expect(screen.getByText(/Love coupon/)).toBeInTheDocument()
    expect(screen.getByText(/Date planning/)).toBeInTheDocument()
    // 4th should not be shown
    expect(screen.queryByText(/Extra task/)).not.toBeInTheDocument()
  })

  it("renders fewer rows when transactions has fewer than 3 entries", () => {
    useCoyyns.mockReturnValue({
      ...defaultCoyynsReturn,
      transactions: MOCK_TRANSACTIONS.slice(0, 2),
    })

    render(<CoyynsWidget />)
    expect(screen.getByText(/Morning routine/)).toBeInTheDocument()
    expect(screen.getByText(/Love coupon/)).toBeInTheDocument()
    expect(screen.queryByText(/Date planning/)).not.toBeInTheDocument()
  })

  it('renders empty state "Start earning CoYYns together" when empty and not loading', () => {
    useCoyyns.mockReturnValue({
      ...defaultCoyynsReturn,
      transactions: [],
    })

    render(<CoyynsWidget />)
    expect(screen.getByText("Start earning CoYYns together")).toBeInTheDocument()
  })

  it("renders LoadingSkeleton rows when isLoading is true", () => {
    useCoyyns.mockReturnValue({
      ...defaultCoyynsReturn,
      isLoading: true,
      transactions: [],
    })

    render(<CoyynsWidget />)
    // LoadingSkeleton list-item renders animate-pulse divs
    const pulses = document.querySelectorAll(".animate-pulse")
    expect(pulses.length).toBeGreaterThan(0)
  })

  it('renders "Marketplace" button text', () => {
    render(<CoyynsWidget />)
    expect(screen.getByText(/Marketplace/)).toBeInTheDocument()
  })

  it("card links to /us", () => {
    render(<CoyynsWidget />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/us")
  })

  it('earn transactions display a "+" prefix on their amount', () => {
    render(<CoyynsWidget />)
    expect(screen.getByText("+50")).toBeInTheDocument()
  })

  it('spend transactions display a "-" prefix on their amount', () => {
    render(<CoyynsWidget />)
    expect(screen.getByText("-200")).toBeInTheDocument()
  })

  it("amount numbers are formatted with commas", () => {
    useCoyyns.mockReturnValue({
      ...defaultCoyynsReturn,
      transactions: [
        { id: "tx-big", user_id: "user-1", amount: 1000, type: "earn", category: "bonus", description: "Big earn", metadata: {}, created_at: "2026-01-01T08:00:00Z" },
      ],
    })

    render(<CoyynsWidget />)
    expect(screen.getByText("+1,000")).toBeInTheDocument()
  })
})
