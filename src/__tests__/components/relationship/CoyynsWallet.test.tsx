import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mock data ---
const MOCK_USER = { id: "user-1" }
const MOCK_PARTNER = {
  id: "user-2",
  display_name: "Yara",
  email: "yara@test.com",
  avatar_url: null,
  partner_id: "user-1",
  role: "user",
  created_at: "",
  updated_at: "",
}

const MOCK_WALLET = {
  id: "wallet-1",
  user_id: "user-1",
  balance: 1250,
  lifetime_earned: 2400,
  lifetime_spent: 1150,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const MOCK_PARTNER_WALLET = {
  id: "wallet-2",
  user_id: "user-2",
  balance: 890,
  lifetime_earned: 1200,
  lifetime_spent: 310,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

// --- Mocks ---
const mockRefreshWallet = vi.fn()

let mockCoyynsReturn = {
  wallet: MOCK_WALLET as typeof MOCK_WALLET | null,
  partnerWallet: MOCK_PARTNER_WALLET as typeof MOCK_PARTNER_WALLET | null,
  transactions: [] as unknown[],
  isLoading: false,
  error: null as string | null,
  addCoyyns: vi.fn(),
  spendCoyyns: vi.fn(),
  refreshWallet: mockRefreshWallet,
}

let mockAuthReturn = {
  user: MOCK_USER,
  profile: null,
  partner: MOCK_PARTNER,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns: () => mockCoyynsReturn,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuthReturn,
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
    span: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, ...rest } = props
      void initial; void animate; void exit; void transition
      return <span {...rest}>{children}</span>
    },
  },
  useMotionValue: (initial: number) => ({
    get: () => initial,
    set: vi.fn(),
    on: vi.fn(),
  }),
  useTransform: (_value: unknown, transform: (v: number) => string) => {
    // Return the transformed current value for rendering
    return transform(mockCoyynsReturn.wallet?.balance ?? 0)
  },
  animate: vi.fn(),
}))

import { CoyynsWallet } from "@/components/relationship/CoyynsWallet"

describe("CoyynsWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCoyynsReturn = {
      wallet: MOCK_WALLET,
      partnerWallet: MOCK_PARTNER_WALLET,
      transactions: [],
      isLoading: false,
      error: null,
      addCoyyns: vi.fn(),
      spendCoyyns: vi.fn(),
      refreshWallet: mockRefreshWallet,
    }
    mockAuthReturn = {
      user: MOCK_USER,
      profile: null,
      partner: MOCK_PARTNER,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    }
  })

  it("renders without crashing when useCoyyns returns loading state", () => {
    mockCoyynsReturn = { ...mockCoyynsReturn, isLoading: true, wallet: null, partnerWallet: null }
    const { container } = render(<CoyynsWallet />)
    expect(container).toBeTruthy()
  })

  it("renders shimmer placeholders during loading", () => {
    mockCoyynsReturn = { ...mockCoyynsReturn, isLoading: true, wallet: null, partnerWallet: null }
    render(<CoyynsWallet />)
    expect(screen.getByTestId("wallet-loading")).toBeInTheDocument()
    const pulseElements = screen.getByTestId("wallet-loading").querySelectorAll(".animate-skeleton-warm")
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it("renders balance number when data is available", () => {
    render(<CoyynsWallet />)
    expect(screen.getByTestId("balance-value")).toBeInTheDocument()
  })

  it("balance is formatted with comma separators", () => {
    render(<CoyynsWallet />)
    // The useTransform mock returns the formatted balance
    expect(screen.getByTestId("balance-value")).toHaveTextContent("1,250")
  })

  it("renders CoYYns label below the balance", () => {
    render(<CoyynsWallet />)
    expect(screen.getByText("CoYYns")).toBeInTheDocument()
  })

  it("renders lifetime earned value", () => {
    render(<CoyynsWallet />)
    expect(screen.getByTestId("lifetime-earned")).toHaveTextContent("2,400")
  })

  it("renders lifetime spent value", () => {
    render(<CoyynsWallet />)
    expect(screen.getByTestId("lifetime-spent")).toHaveTextContent("1,150")
  })

  it("renders partner name and balance in the partner row", () => {
    render(<CoyynsWallet />)
    const partnerRow = screen.getByTestId("partner-row")
    expect(partnerRow).toHaveTextContent("Yara has 890 CoYYns")
  })

  it("renders Add button and calls onAdd when clicked", () => {
    const onAdd = vi.fn()
    render(<CoyynsWallet onAdd={onAdd} />)
    const addButton = screen.getByText("+ Add")
    fireEvent.click(addButton)
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it("renders Spend button and calls onSpend when clicked", () => {
    const onSpend = vi.fn()
    render(<CoyynsWallet onSpend={onSpend} />)
    const spendButton = screen.getByText("− Spend")
    fireEvent.click(spendButton)
    expect(onSpend).toHaveBeenCalledTimes(1)
  })

  it("renders error state with retry when useCoyyns returns an error", () => {
    mockCoyynsReturn = { ...mockCoyynsReturn, error: "Network error", wallet: null }
    render(<CoyynsWallet />)
    expect(screen.getByText("Couldn't load wallet")).toBeInTheDocument()
    const retryButton = screen.getByText("Retry")
    fireEvent.click(retryButton)
    expect(mockRefreshWallet).toHaveBeenCalledTimes(1)
  })

  it("renders correctly when balance is 0", () => {
    mockCoyynsReturn = {
      ...mockCoyynsReturn,
      wallet: { ...MOCK_WALLET, balance: 0, lifetime_earned: 0, lifetime_spent: 0 },
      partnerWallet: { ...MOCK_PARTNER_WALLET, balance: 0 },
    }
    render(<CoyynsWallet />)
    expect(screen.getByTestId("balance-value")).toBeInTheDocument()
    expect(screen.getByTestId("lifetime-earned")).toHaveTextContent("0")
    expect(screen.getByTestId("lifetime-spent")).toHaveTextContent("0")
    expect(screen.getByTestId("partner-row")).toHaveTextContent("Yara has 0 CoYYns")
  })
})
