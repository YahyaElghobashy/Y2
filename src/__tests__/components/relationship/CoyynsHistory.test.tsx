import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mock data ---
const MOCK_EARN_TX = {
  id: "tx-1",
  user_id: "user-1",
  amount: 50,
  type: "earn",
  category: "manual",
  description: "Helped with groceries",
  metadata: {},
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
}

const MOCK_SPEND_TX = {
  id: "tx-2",
  user_id: "user-1",
  amount: -25,
  type: "spend",
  category: "notification_purchase",
  description: "Extra notification",
  metadata: {},
  created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
}

const MOCK_NULL_DESC_TX = {
  id: "tx-3",
  user_id: "user-1",
  amount: 30,
  type: "earn",
  category: "manual",
  description: null,
  metadata: {},
  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
}

const MOCK_TRANSACTIONS = [MOCK_EARN_TX, MOCK_SPEND_TX, MOCK_NULL_DESC_TX]

// --- Mocks ---
const mockUseCoyyns = vi.fn()

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns: () => mockUseCoyyns(),
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap; void variants
      return <div {...rest}>{children}</div>
    },
  },
}))

import { CoyynsHistory } from "@/components/relationship/CoyynsHistory"

describe("CoyynsHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCoyyns.mockReturnValue({
      wallet: null,
      partnerWallet: null,
      transactions: [],
      isLoading: false,
      error: null,
      addCoyyns: vi.fn(),
      spendCoyyns: vi.fn(),
      refreshWallet: vi.fn(),
    })
  })

  it("renders without crashing when given an empty transactions array", () => {
    const { container } = render(<CoyynsHistory transactions={[]} />)
    expect(container).toBeTruthy()
  })

  it("renders EmptyState when transactions array is empty", () => {
    render(<CoyynsHistory transactions={[]} />)
    expect(screen.getByText("No CoYYns yet")).toBeInTheDocument()
    expect(screen.getByText("Acts of care will appear here")).toBeInTheDocument()
  })

  it("renders the correct number of rows when given a transactions array", () => {
    render(<CoyynsHistory transactions={MOCK_TRANSACTIONS} />)
    const rows = screen.getAllByRole("listitem")
    expect(rows).toHaveLength(3)
  })

  it("earn rows show TrendingUp icon and + prefixed amount in success color", () => {
    render(<CoyynsHistory transactions={[MOCK_EARN_TX]} />)
    const row = screen.getByRole("listitem")
    // Check for TrendingUp icon (Lucide renders as SVG)
    const svg = row.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass("text-[var(--success)]")
    // Check amount text with + prefix
    expect(row).toHaveTextContent("+50")
  })

  it("spend rows show TrendingDown icon and − prefixed amount in error color", () => {
    render(<CoyynsHistory transactions={[MOCK_SPEND_TX]} />)
    const row = screen.getByRole("listitem")
    const svg = row.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass("text-[var(--error)]")
    // Check amount text with − (U+2212) prefix
    expect(row).toHaveTextContent("\u221225")
  })

  it("amount uses JetBrains Mono font class", () => {
    render(<CoyynsHistory transactions={[MOCK_EARN_TX]} />)
    const row = screen.getByRole("listitem")
    // The amount span has font-mono family
    const amountSpan = row.querySelector("[class*='font-\\[family-name\\:var\\(--font-mono\\)\\]']")
      ?? Array.from(row.querySelectorAll("span")).find((el) =>
        el.className.includes("font-mono") || el.className.includes("--font-mono")
      )
    expect(amountSpan).toBeTruthy()
  })

  it("description truncates with truncate class for overflow protection", () => {
    render(<CoyynsHistory transactions={[MOCK_EARN_TX]} />)
    const descriptionEl = screen.getByText("Helped with groceries")
    expect(descriptionEl).toHaveClass("truncate")
  })

  it("category and relative time render in the subtitle line", () => {
    render(<CoyynsHistory transactions={[MOCK_EARN_TX]} />)
    // Category should be visible
    expect(screen.getByText(/manual/)).toBeInTheDocument()
    // The middle dot separator should be present
    expect(screen.getByText(/\u00B7/)).toBeInTheDocument()
    // Relative time text (e.g. "2 hours ago" or similar) should be present
    expect(screen.getByText(/ago/)).toBeInTheDocument()
  })

  it("limit prop caps the rendered row count", () => {
    render(<CoyynsHistory transactions={MOCK_TRANSACTIONS} limit={2} />)
    const rows = screen.getAllByRole("listitem")
    expect(rows).toHaveLength(2)
  })

  it("compact mode applies compact padding classes", () => {
    render(<CoyynsHistory transactions={[MOCK_EARN_TX]} compact />)
    const row = screen.getByRole("listitem")
    expect(row).toHaveClass("py-2")
    expect(row).toHaveClass("px-3")
  })

  it("default mode applies standard padding classes", () => {
    render(<CoyynsHistory transactions={[MOCK_EARN_TX]} />)
    const row = screen.getByRole("listitem")
    expect(row).toHaveClass("py-3")
    expect(row).toHaveClass("px-4")
  })

  it("does not call useCoyyns data when transactions prop is provided", () => {
    // Set hook to return loading state, but since prop is provided it should render rows
    mockUseCoyyns.mockReturnValue({
      wallet: null,
      partnerWallet: null,
      transactions: [],
      isLoading: true,
      error: null,
      addCoyyns: vi.fn(),
      spendCoyyns: vi.fn(),
      refreshWallet: vi.fn(),
    })

    render(<CoyynsHistory transactions={MOCK_TRANSACTIONS} />)
    // Even though hook says loading, we should see rows because prop was provided
    const rows = screen.getAllByRole("listitem")
    expect(rows).toHaveLength(3)
  })

  it("shows loading skeleton when useCoyyns is loading and no prop provided", () => {
    mockUseCoyyns.mockReturnValue({
      wallet: null,
      partnerWallet: null,
      transactions: [],
      isLoading: true,
      error: null,
      addCoyyns: vi.fn(),
      spendCoyyns: vi.fn(),
      refreshWallet: vi.fn(),
    })

    const { container } = render(<CoyynsHistory />)
    const pulseElements = container.querySelectorAll(".animate-pulse")
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it("handles null description gracefully", () => {
    render(<CoyynsHistory transactions={[MOCK_NULL_DESC_TX]} />)
    const row = screen.getByRole("listitem")
    expect(row).toBeTruthy()
    // Should not render "null" as text
    expect(row.textContent).not.toContain("null")
  })
})
