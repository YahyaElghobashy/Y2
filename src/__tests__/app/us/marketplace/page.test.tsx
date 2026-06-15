import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import fs from "fs"
import path from "path"

// ── Mocks ──────────────────────────────────────────────
const { useMarketplace } = vi.hoisted(() => ({
  useMarketplace: vi.fn(() => ({
    items: [
      { id: "1", name: "Extra Notification", description: "Send more", price: 10, icon: "🔔", effect_type: "extra_ping", effect_config: {}, is_active: true, sort_order: 1, created_at: "" },
      { id: "2", name: "Movie Night Veto", description: "Pick a movie", price: 25, icon: "🎬", effect_type: "veto", effect_config: {}, is_active: true, sort_order: 2, created_at: "" },
    ],
    purchases: [],
    isLoading: false,
    error: null as string | null,
    createPurchase: vi.fn(),
    refreshItems: vi.fn(),
    refreshPurchases: vi.fn(),
  })),
}))

vi.mock("@/lib/hooks/use-marketplace", () => ({ useMarketplace }))

const { useActivePurchases } = vi.hoisted(() => ({
  useActivePurchases: vi.fn(() => ({
    activePurchases: [] as Array<Record<string, unknown>>,
    isLoading: false,
    error: null as string | null,
    acknowledgePurchase: vi.fn(),
    completePurchase: vi.fn(),
    declinePurchase: vi.fn(),
    refreshPurchases: vi.fn(),
  })),
}))
vi.mock("@/lib/hooks/use-active-purchases", () => ({ useActivePurchases }))

const { usePurchaseHistory } = vi.hoisted(() => ({
  usePurchaseHistory: vi.fn(() => ({
    history: [] as Array<Record<string, unknown>>,
    isLoading: false,
    error: null as string | null,
    refreshHistory: vi.fn(),
  })),
}))
vi.mock("@/lib/hooks/use-purchase-history", () => ({ usePurchaseHistory }))

// Mock useAuth (used by CreateChallengeForm)
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
    partner: {
      id: "user-2",
      display_name: "Yara",
      email: "yara@test.com",
      avatar_url: null,
      partner_id: "user-1",
      role: "user",
      created_at: "",
      updated_at: "",
    },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

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
      void whileHover; void whileTap; void transition; void initial; void animate; void exit
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
      void whileHover; void whileTap; void transition
      return <button {...domProps}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import MarketplacePage from "@/app/(main)/us/marketplace/page"

const DEFAULT_ITEMS = [
  { id: "1", name: "Extra Notification", description: "Send more", price: 10, icon: "🔔", effect_type: "extra_ping", effect_config: {}, is_active: true, sort_order: 1, created_at: "" },
  { id: "2", name: "Movie Night Veto", description: "Pick a movie", price: 25, icon: "🎬", effect_type: "veto", effect_config: {}, is_active: true, sort_order: 2, created_at: "" },
]

describe("MarketplacePage", () => {
  beforeEach(() => {
    // Re-seed default implementations so per-test overrides
    // (mockReturnValue) never leak into the next test.
    useMarketplace.mockImplementation(() => ({
      items: DEFAULT_ITEMS,
      purchases: [],
      isLoading: false,
      error: null,
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    }))
    useActivePurchases.mockImplementation(() => ({
      activePurchases: [],
      isLoading: false,
      error: null,
      acknowledgePurchase: vi.fn(),
      completePurchase: vi.fn(),
      declinePurchase: vi.fn(),
      refreshPurchases: vi.fn(),
    }))
    usePurchaseHistory.mockImplementation(() => ({
      history: [],
      isLoading: false,
      error: null,
      refreshHistory: vi.fn(),
    }))
  })

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

    // Shop content visible by default (item cards from useMarketplace)
    expect(screen.getAllByTestId("marketplace-item-card").length).toBeGreaterThan(0)

    // Click Challenges tab
    fireEvent.click(screen.getByRole("tab", { name: "Challenges" }))

    // Challenges tab is now active
    const challengesTab = screen.getByRole("tab", { name: "Challenges" })
    expect(challengesTab).toHaveAttribute("aria-selected", "true")

    // Item cards should no longer be present
    expect(screen.queryAllByTestId("marketplace-item-card")).toHaveLength(0)

    // Empty state should be visible
    expect(screen.getByText("No challenges yet")).toBeInTheDocument()
  })

  it("Shop tab content includes at least one item card", () => {
    render(<MarketplacePage />)
    const itemCards = screen.getAllByTestId("marketplace-item-card")
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
    // Allow hex in comments, HTML entities (&#x...), and CSS variable fallbacks (var(--..., #hex))
    const lines = source.split("\n")
    const hexPattern = /#[0-9a-fA-F]{3,8}\b/

    const violations = lines.filter((line) => {
      const trimmed = line.trim()
      // Skip comments
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return false
      // Skip HTML entities (&#x...)
      let cleaned = trimmed.replace(/&#x[0-9a-fA-F]+;/g, "")
      // Skip hex values inside CSS variable fallbacks: var(--..., #hex)
      cleaned = cleaned.replace(/var\(--[^)]*#[0-9a-fA-F]{3,8}[^)]*\)/g, "")
      // Skip hex values inside rgba() or other color functions that are part of design tokens
      cleaned = cleaned.replace(/rgba?\([^)]*\)/g, "")
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

  it("shows loading skeletons when items are loading", () => {
    useMarketplace.mockReturnValue({
      items: [],
      purchases: [],
      isLoading: true,
      error: null,
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    })
    render(<MarketplacePage />)
    const skeletons = screen.getAllByTestId("marketplace-skeleton")
    expect(skeletons).toHaveLength(4)
  })

  it("shows empty state when no items and error", () => {
    useMarketplace.mockReturnValue({
      items: [],
      purchases: [],
      isLoading: false,
      error: "Failed",
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    })
    render(<MarketplacePage />)
    expect(screen.getByText("Marketplace unavailable")).toBeInTheDocument()
  })

  // ── Active purchases section ──────────────────────────────

  function makeActivePurchase(overrides: Record<string, unknown> = {}) {
    return {
      id: "ap-1",
      buyer_id: "user-2",
      target_id: "user-1",
      item_id: "item-1",
      cost: 25,
      status: "active",
      effect_payload: { movie: "Inception" },
      created_at: new Date().toISOString(),
      completed_at: null,
      marketplace_items: {
        id: "item-1",
        name: "Movie Night Veto",
        description: "Pick a movie",
        price: 25,
        icon: "🎬",
        effect_type: "veto",
        effect_config: {},
        is_active: true,
        sort_order: 2,
        created_at: "",
      },
      ...overrides,
    }
  }

  it("does not render Active section when there are no active purchases", () => {
    render(<MarketplacePage />)
    expect(screen.queryByTestId("active-purchases-section")).not.toBeInTheDocument()
  })

  it("renders the Active section with an ActivePurchaseCard when an active purchase exists", () => {
    const completePurchase = vi.fn()
    useActivePurchases.mockReturnValue({
      activePurchases: [makeActivePurchase()],
      isLoading: false,
      error: null,
      acknowledgePurchase: vi.fn(),
      completePurchase,
      declinePurchase: vi.fn(),
      refreshPurchases: vi.fn(),
    })

    render(<MarketplacePage />)
    expect(screen.getByTestId("active-purchases-section")).toBeInTheDocument()
    expect(screen.getByTestId("active-purchase-card")).toBeInTheDocument()
  })

  it("wires the Active card acknowledge action to completePurchase (terminal resolution)", () => {
    const completePurchase = vi.fn()
    useActivePurchases.mockReturnValue({
      activePurchases: [makeActivePurchase()],
      isLoading: false,
      error: null,
      acknowledgePurchase: vi.fn(),
      completePurchase,
      declinePurchase: vi.fn(),
      refreshPurchases: vi.fn(),
    })

    render(<MarketplacePage />)
    // veto card → "Got it" → onAcknowledge → completePurchase
    fireEvent.click(screen.getByTestId("acknowledge-btn"))
    expect(completePurchase).toHaveBeenCalledWith("ap-1")
  })

  // ── Purchase history section ──────────────────────────────

  function makeHistoryEntry(overrides: Record<string, unknown> = {}) {
    return {
      id: "h-1",
      buyer_id: "user-1",
      target_id: "user-2",
      item_id: "item-9",
      cost: 40,
      status: "completed",
      effect_payload: null,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      marketplace_items: {
        id: "item-9",
        name: "Breakfast in Bed",
        description: "Make breakfast",
        price: 40,
        icon: "🍳",
        effect_type: "task_order",
        effect_config: {},
        is_active: true,
        sort_order: 3,
        created_at: "",
      },
      ...overrides,
    }
  }

  it("does not render history section when history is empty", () => {
    render(<MarketplacePage />)
    expect(screen.queryByTestId("purchase-history-section")).not.toBeInTheDocument()
  })

  it("renders history section collapsed, expanding on toggle", () => {
    usePurchaseHistory.mockReturnValue({
      history: [makeHistoryEntry()],
      isLoading: false,
      error: null,
      refreshHistory: vi.fn(),
    })

    render(<MarketplacePage />)
    expect(screen.getByTestId("purchase-history-section")).toBeInTheDocument()
    // collapsed by default
    expect(screen.queryByTestId("purchase-history-list")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("purchase-history-toggle"))
    expect(screen.getByTestId("purchase-history-list")).toBeInTheDocument()
    expect(screen.getByText("Breakfast in Bed")).toBeInTheDocument()
  })
})
