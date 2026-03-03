import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mock data ---
const MOCK_WALLET = {
  id: "wallet-1",
  user_id: "user-1",
  balance: 1240,
  lifetime_earned: 2000,
  lifetime_spent: 760,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const defaultCoyynsReturn = {
  wallet: MOCK_WALLET as typeof MOCK_WALLET | null,
  partnerWallet: null as typeof MOCK_WALLET | null,
  transactions: [] as unknown[],
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

import { CoyynsBadge } from "@/components/shared/CoyynsBadge"

describe("CoyynsBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCoyyns.mockReturnValue({
      wallet: MOCK_WALLET,
      partnerWallet: null,
      transactions: [],
      isLoading: false,
      error: null,
      addCoyyns: vi.fn(),
      spendCoyyns: vi.fn(),
      refreshWallet: vi.fn(),
    })
  })

  it("renders the coin icon", () => {
    render(<CoyynsBadge balance={100} />)
    const svg = document.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })

  it("renders a formatted balance number when balance prop is provided", () => {
    render(<CoyynsBadge balance={500} />)
    expect(screen.getByText("500")).toBeInTheDocument()
  })

  it("formats numbers with commas", () => {
    render(<CoyynsBadge balance={1240} />)
    expect(screen.getByText("1,240")).toBeInTheDocument()
  })

  it("renders '0' when balance={0} is passed", () => {
    render(<CoyynsBadge balance={0} />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("does NOT call useCoyyns() when balance prop is provided", () => {
    render(<CoyynsBadge balance={100} />)
    expect(useCoyyns).not.toHaveBeenCalled()
  })

  it("calls useCoyyns() when no balance prop is provided", () => {
    render(<CoyynsBadge />)
    expect(useCoyyns).toHaveBeenCalled()
  })

  it("does NOT call useCoyyns() when balance={0} is provided", () => {
    render(<CoyynsBadge balance={0} />)
    expect(useCoyyns).not.toHaveBeenCalled()
  })

  it("shows loading pulse when hook returns isLoading: true", () => {
    useCoyyns.mockReturnValue({
      wallet: null,
      partnerWallet: null,
      transactions: [],
      isLoading: true,
      error: null,
      addCoyyns: vi.fn(),
      spendCoyyns: vi.fn(),
      refreshWallet: vi.fn(),
    })
    render(<CoyynsBadge />)
    expect(screen.getByTestId("loading-pulse")).toBeInTheDocument()
  })

  it("shows dash fallback when hook returns null balance after load", () => {
    useCoyyns.mockReturnValue({
      wallet: null,
      partnerWallet: null,
      transactions: [],
      isLoading: false,
      error: null,
      addCoyyns: vi.fn(),
      spendCoyyns: vi.fn(),
      refreshWallet: vi.fn(),
    })
    render(<CoyynsBadge />)
    expect(screen.getByText("\u2014")).toBeInTheDocument()
  })

  it("applies sm size classes when size='sm' is passed", () => {
    const { container } = render(<CoyynsBadge balance={100} size="sm" />)
    const pill = container.firstChild as HTMLElement
    expect(pill.className).toContain("px-2")
    expect(pill.className).toContain("py-0.5")
  })

  it("applies md size classes when size='md' or no size is passed", () => {
    const { container } = render(<CoyynsBadge balance={100} />)
    const pill = container.firstChild as HTMLElement
    expect(pill.className).toContain("px-3")
    expect(pill.className).toContain("py-1")
  })

  it("accepts and applies className prop to the outer element", () => {
    const { container } = render(<CoyynsBadge balance={100} className="mt-4" />)
    const pill = container.firstChild as HTMLElement
    expect(pill.className).toContain("mt-4")
  })

  it("formats very large numbers with commas", () => {
    render(<CoyynsBadge balance={1000000} />)
    expect(screen.getByText("1,000,000")).toBeInTheDocument()
  })

  it("uses hook balance when no prop is given and hook has data", () => {
    render(<CoyynsBadge />)
    expect(screen.getByText("1,240")).toBeInTheDocument()
  })
})
