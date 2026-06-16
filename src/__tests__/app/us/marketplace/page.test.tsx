import React from "react"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Domain hooks ───────────────────────────────────────
const { useMarketplace } = vi.hoisted(() => ({
  useMarketplace: vi.fn(),
}))
vi.mock("@/lib/hooks/use-marketplace", () => ({ useMarketplace }))

const { useActivePurchases } = vi.hoisted(() => ({
  useActivePurchases: vi.fn(),
}))
vi.mock("@/lib/hooks/use-active-purchases", () => ({ useActivePurchases }))

const { usePurchaseHistory } = vi.hoisted(() => ({
  usePurchaseHistory: vi.fn(),
}))
vi.mock("@/lib/hooks/use-purchase-history", () => ({ usePurchaseHistory }))

const { useCoyyns } = vi.hoisted(() => ({
  useCoyyns: vi.fn(),
}))
vi.mock("@/lib/hooks/use-coyyns", () => ({ useCoyyns }))

// The page (and the cards it renders) read useAuth for the current user/partner.
// user-1 = the logged-in target; user-2 = the partner who sent purchases.
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "yahya@test.com" },
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

// next/link is only reached via PageHeader in the loading branch.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLDivElement>,
      ) => {
        const { initial, animate, exit, transition, whileHover, whileTap, layoutId, ...rest } = props
        void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layoutId
        return (
          <div ref={ref} data-layoutid={layoutId as string} {...rest}>
            {children}
          </div>
        )
      },
    ),
    button: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLButtonElement>,
      ) => {
        const { initial, animate, exit, transition, whileHover, whileTap, layoutId, ...rest } = props
        void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layoutId
        return (
          <button ref={ref} {...rest}>
            {children}
          </button>
        )
      },
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))
vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}))

import MarketplacePage from "@/app/(main)/us/marketplace/page"

// ── Fixtures ───────────────────────────────────────────
const ITEMS = [
  {
    id: "item-veto",
    name: "Movie Night Veto",
    description: "Pick the movie",
    price: 25,
    icon: "🎬",
    effect_type: "veto",
    effect_config: {},
    is_active: true,
    sort_order: 1,
    created_at: "",
  },
  {
    id: "item-ping",
    name: "Extra Ping",
    description: "Send one more",
    price: 10,
    icon: "🔔",
    effect_type: "extra_ping",
    effect_config: {},
    is_active: true,
    sort_order: 2,
    created_at: "",
  },
]

function makeActivePurchase(overrides: Record<string, unknown> = {}) {
  return {
    id: "ap-1",
    buyer_id: "user-2",
    target_id: "user-1",
    item_id: "item-veto",
    cost: 25,
    status: "active",
    effect_payload: { movie: "Inception" },
    created_at: new Date().toISOString(),
    completed_at: null,
    marketplace_items: {
      id: "item-veto",
      name: "Movie Night Veto",
      description: "Pick the movie",
      price: 25,
      icon: "🎬",
      effect_type: "veto",
      effect_config: {},
      is_active: true,
      sort_order: 1,
      created_at: "",
    },
    ...overrides,
  }
}

function makeHistoryEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "h-1",
    buyer_id: "user-1",
    target_id: "user-2",
    item_id: "item-bib",
    cost: 40,
    status: "completed",
    effect_payload: null,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    marketplace_items: {
      id: "item-bib",
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

function seedMarketplace(over: Record<string, unknown> = {}) {
  useMarketplace.mockReturnValue({
    items: ITEMS,
    purchases: [],
    isLoading: false,
    error: null,
    createPurchase: vi.fn(),
    refreshItems: vi.fn(),
    refreshPurchases: vi.fn(),
    ...over,
  })
}

function seedActive(over: Record<string, unknown> = {}) {
  useActivePurchases.mockReturnValue({
    activePurchases: [],
    isLoading: false,
    error: null,
    acknowledgePurchase: vi.fn(),
    completePurchase: vi.fn(),
    declinePurchase: vi.fn(),
    refreshPurchases: vi.fn(),
    ...over,
  })
}

function seedHistory(over: Record<string, unknown> = {}) {
  usePurchaseHistory.mockReturnValue({
    history: [],
    isLoading: false,
    error: null,
    refreshHistory: vi.fn(),
    ...over,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  seedMarketplace()
  seedActive()
  seedHistory()
  useCoyyns.mockReturnValue({
    wallet: { balance: 1250, lifetime_earned: 2000, lifetime_spent: 750 },
    partnerWallet: null,
    transactions: [],
    isLoading: false,
    error: null,
    addCoyyns: vi.fn(),
    spendCoyyns: vi.fn(),
    refreshWallet: vi.fn(),
  })
})

describe("MarketplacePage", () => {
  // ── unit: derived rendering from mocked data ───────────
  it("renders the Marketplace heading from MarketplaceView", () => {
    render(<MarketplacePage />)
    expect(screen.getByRole("heading", { name: "Marketplace" })).toBeInTheDocument()
  })

  it("renders the wallet balance (toLocaleString) in the header coin", () => {
    render(<MarketplacePage />)
    expect(screen.getByText("1,250")).toBeInTheDocument()
  })

  it("renders one card per marketplace item with its title and price", () => {
    render(<MarketplacePage />)
    expect(screen.getByText("Movie Night Veto")).toBeInTheDocument()
    expect(screen.getByText("Extra Ping")).toBeInTheDocument()
    // buy buttons surface each item's price via the Coin amount
    expect(screen.getByText("25")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
  })

  it("shows the loading branch (PageHeader + skeleton, no grid) while items load", () => {
    seedMarketplace({ items: [], isLoading: true })
    render(<MarketplacePage />)
    // Loading branch renders the PageHeader titled Marketplace with a /treasury back link
    const backLink = screen.getByRole("link", { name: "Go back" })
    expect(backLink).toHaveAttribute("href", "/treasury")
    // and NONE of the shop item cards
    expect(screen.queryByText("Movie Night Veto")).not.toBeInTheDocument()
    expect(screen.queryByText("Extra Ping")).not.toBeInTheDocument()
  })

  // ── interaction + integration: buy → PurchaseConfirmModal ──
  it("clicking an item's buy button opens the PurchaseConfirmModal for that item", () => {
    render(<MarketplacePage />)
    expect(screen.queryByTestId("purchase-dialog")).not.toBeInTheDocument()

    // Find the card whose title is the veto item, then click its buy button.
    const card = screen.getByText("Movie Night Veto").closest("div")!
    const buyBtn = within(card).getByRole("button")
    fireEvent.click(buyBtn)

    const dialog = screen.getByTestId("purchase-dialog")
    expect(dialog).toBeInTheDocument()
    // The modal is bound to the clicked item.
    expect(dialog).toHaveAttribute("aria-label", "Confirm purchase of Movie Night Veto")
    expect(within(dialog).getByText("Movie Night Veto")).toBeInTheDocument()
  })

  it("closing the PurchaseConfirmModal removes it from the document", () => {
    render(<MarketplacePage />)
    const card = screen.getByText("Extra Ping").closest("div")!
    fireEvent.click(within(card).getByRole("button"))
    expect(screen.getByTestId("purchase-dialog")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("purchase-cancel"))
    expect(screen.queryByTestId("purchase-dialog")).not.toBeInTheDocument()
  })

  // ── Active purchases (topSlot) ─────────────────────────
  it("does not render the Active section when there are no active purchases", () => {
    render(<MarketplacePage />)
    expect(screen.queryByTestId("active-purchases-section")).not.toBeInTheDocument()
  })

  it("renders the Active section with a card when an active purchase exists", () => {
    seedActive({ activePurchases: [makeActivePurchase()] })
    render(<MarketplacePage />)
    expect(screen.getByTestId("active-purchases-section")).toBeInTheDocument()
    expect(screen.getByTestId("active-purchase-card")).toBeInTheDocument()
    expect(screen.getByText("Inception")).toBeInTheDocument()
  })

  it("wires the veto card 'Got it' action to completePurchase(id) (terminal resolution)", () => {
    const completePurchase = vi.fn()
    seedActive({ activePurchases: [makeActivePurchase()], completePurchase })
    render(<MarketplacePage />)

    fireEvent.click(screen.getByTestId("acknowledge-btn"))
    expect(completePurchase).toHaveBeenCalledTimes(1)
    expect(completePurchase).toHaveBeenCalledWith("ap-1")
  })

  it("wires a wildcard card 'Decline' action to declinePurchase(id)", () => {
    const declinePurchase = vi.fn()
    const completePurchase = vi.fn()
    seedActive({
      activePurchases: [
        makeActivePurchase({
          id: "ap-wild",
          status: "pending",
          effect_payload: { input: "Plan a surprise" },
          marketplace_items: {
            id: "item-wild",
            name: "Wildcard Wish",
            description: "Anything goes",
            price: 100,
            icon: "✨",
            effect_type: "wildcard",
            effect_config: {},
            is_active: true,
            sort_order: 4,
            created_at: "",
          },
        }),
      ],
      declinePurchase,
      completePurchase,
    })
    render(<MarketplacePage />)

    fireEvent.click(screen.getByTestId("decline-btn"))
    expect(declinePurchase).toHaveBeenCalledWith("ap-wild")
    expect(completePurchase).not.toHaveBeenCalled()
  })

  // ── Purchase history (bottomSlot) ──────────────────────
  it("does not render the history section when history is empty", () => {
    render(<MarketplacePage />)
    expect(screen.queryByTestId("purchase-history-section")).not.toBeInTheDocument()
  })

  it("renders the history section collapsed and expands the list on toggle", () => {
    seedHistory({ history: [makeHistoryEntry()] })
    render(<MarketplacePage />)

    expect(screen.getByTestId("purchase-history-section")).toBeInTheDocument()
    // Collapsed by default — list not mounted.
    expect(screen.queryByTestId("purchase-history-list")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("purchase-history-toggle"))
    expect(screen.getByTestId("purchase-history-list")).toBeInTheDocument()
    expect(screen.getByText("Breakfast in Bed")).toBeInTheDocument()
  })
})
