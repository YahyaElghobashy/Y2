import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import fs from "fs"
import path from "path"

// Mock useCoyyns
vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns: () => ({
    wallet: { balance: 1250, lifetime_earned: 2000, lifetime_spent: 750 },
    partnerWallet: null,
    transactions: [],
    isLoading: false,
    error: null,
    addCoyyns: vi.fn(),
    spendCoyyns: vi.fn(),
    refreshWallet: vi.fn(),
  }),
}))

import MarketplacePage from "@/app/(main)/us/marketplace/page"

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...props
  }: {
    href: string
    children: React.ReactNode
    className?: string
    [key: string]: unknown
  }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      const {
        whileHover,
        whileTap,
        transition,
        layoutId,
        initial,
        animate,
        exit,
        ...domProps
      } = props
      return (
        <div data-layoutid={layoutId as string} {...domProps}>
          {children}
        </div>
      )
    },
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileHover, whileTap, transition, ...domProps } = props
      return <button {...domProps}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

describe("MarketplacePage", () => {
  it("renders without crashing", () => {
    render(<MarketplacePage />)
    expect(screen.getByText("Marketplace")).toBeInTheDocument()
  })

  it("renders PageHeader with title 'Marketplace'", () => {
    render(<MarketplacePage />)
    const heading = screen.getByRole("heading", { name: "Marketplace" })
    expect(heading).toBeInTheDocument()
  })

  it("renders CoyynsBadge in the header area", () => {
    render(<MarketplacePage />)
    expect(screen.getByText("1,250")).toBeInTheDocument()
  })

  it("renders 'Shop' and 'Challenges' tab labels", () => {
    render(<MarketplacePage />)
    expect(screen.getByRole("tab", { name: "Shop" })).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: "Challenges" })
    ).toBeInTheDocument()
  })

  it("Shop tab is active by default with underline indicator", () => {
    render(<MarketplacePage />)
    const shopTab = screen.getByRole("tab", { name: "Shop" })
    expect(shopTab).toHaveAttribute("aria-selected", "true")

    const challengesTab = screen.getByRole("tab", { name: "Challenges" })
    expect(challengesTab).toHaveAttribute("aria-selected", "false")

    // Check for the layoutId indicator inside the Shop tab
    const indicator = shopTab.querySelector(
      '[data-layoutid="marketplace-tab-indicator"]'
    )
    expect(indicator).toBeInTheDocument()
  })

  it("clicking 'Challenges' tab switches the active content area", () => {
    render(<MarketplacePage />)

    // Shop content visible by default
    expect(screen.getAllByTestId("item-card").length).toBeGreaterThan(0)

    // Click Challenges tab
    fireEvent.click(screen.getByRole("tab", { name: "Challenges" }))

    // Challenges tab is now active
    const challengesTab = screen.getByRole("tab", { name: "Challenges" })
    expect(challengesTab).toHaveAttribute("aria-selected", "true")

    // Item cards should no longer be present
    expect(screen.queryAllByTestId("item-card")).toHaveLength(0)

    // Empty state should be visible
    expect(screen.getByText("No challenges yet")).toBeInTheDocument()
  })

  it("Shop tab content includes at least one item card", () => {
    render(<MarketplacePage />)
    const itemCards = screen.getAllByTestId("item-card")
    expect(itemCards.length).toBeGreaterThanOrEqual(1)
  })

  it("Challenges tab with empty data shows EmptyState", () => {
    render(<MarketplacePage />)
    fireEvent.click(screen.getByRole("tab", { name: "Challenges" }))

    expect(screen.getByText("No challenges yet")).toBeInTheDocument()
    expect(screen.getByText("Create one to get started")).toBeInTheDocument()
  })

  it("back button is present and links toward /us", () => {
    render(<MarketplacePage />)
    const backLink = screen.getByRole("link", { name: "Go back" })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute("href", "/us")
  })

  it("does not contain hardcoded color hex values in component source", () => {
    const filePath = path.resolve(
      __dirname,
      "../../../../app/(main)/us/marketplace/page.tsx"
    )
    const source = fs.readFileSync(filePath, "utf-8")

    // Match hex color patterns like #FBF8F4, #fff, #2C2825
    // Allow hex in comments and the coin unicode escape &#x1FA99
    const lines = source.split("\n")
    const hexPattern = /#[0-9a-fA-F]{3,8}\b/

    const violations = lines.filter((line) => {
      const trimmed = line.trim()
      // Skip comments
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return false
      // Skip HTML entities (&#x...)
      const cleaned = trimmed.replace(/&#x[0-9a-fA-F]+;/g, "")
      return hexPattern.test(cleaned)
    })

    expect(violations).toEqual([])
  })

  it("renders Create Challenge button in Challenges tab", () => {
    render(<MarketplacePage />)
    fireEvent.click(screen.getByRole("tab", { name: "Challenges" }))
    expect(screen.getByTestId("create-challenge-btn")).toBeInTheDocument()
    expect(screen.getByText("Create Challenge")).toBeInTheDocument()
  })
})
