import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──────────────────────────────────────────────
const { useMarketplace } = vi.hoisted(() => ({
  useMarketplace: vi.fn(() => ({
    items: [],
    purchases: [],
    isLoading: true,
    error: null,
    createPurchase: vi.fn(),
    refreshItems: vi.fn(),
    refreshPurchases: vi.fn(),
  })),
}))

const { useCoyyns } = vi.hoisted(() => ({
  useCoyyns: vi.fn(() => ({
    wallet: { balance: 100 },
    partnerWallet: null,
    transactions: [],
    isLoading: false,
    error: null,
    addCoyyns: vi.fn(),
    spendCoyyns: vi.fn(),
    refreshWallet: vi.fn(),
  })),
}))

vi.mock("@/lib/hooks/use-marketplace", () => ({ useMarketplace }))
vi.mock("@/lib/hooks/use-coyyns", () => ({ useCoyyns }))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { HomeMarketplaceRow } from "@/components/home/HomeMarketplaceRow"
import type { MarketplaceItem } from "@/lib/types/marketplace.types"

const mockItems: MarketplaceItem[] = [
  { id: "1", name: "Extra Notification", description: "Send more", price: 10, icon: "🔔", effect_type: "extra_ping", effect_config: {}, is_active: true, sort_order: 1, created_at: "" },
  { id: "2", name: "Movie Night Veto", description: "Pick a movie", price: 25, icon: "🎬", effect_type: "veto", effect_config: {}, is_active: true, sort_order: 2, created_at: "" },
  { id: "3", name: "Breakfast in Bed", description: "Partner serves", price: 40, icon: "🍳", effect_type: "task_order", effect_config: {}, is_active: true, sort_order: 3, created_at: "" },
]

afterEach(() => {
  vi.useRealTimers()
})

describe("HomeMarketplaceRow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it("renders section header 'Quick Buys'", () => {
    render(<HomeMarketplaceRow />)
    expect(screen.getByText("Quick Buys")).toBeInTheDocument()
  })

  it("renders 'See All' link to marketplace", () => {
    render(<HomeMarketplaceRow />)
    const link = screen.getByTestId("see-all-link")
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/us/marketplace")
  })

  it("renders skeletons while loading", () => {
    useMarketplace.mockReturnValue({
      items: [],
      purchases: [],
      isLoading: true,
      error: null,
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    })
    render(<HomeMarketplaceRow />)
    const skeletons = screen.getAllByTestId("marketplace-skeleton")
    expect(skeletons).toHaveLength(5)
  })

  it("renders item cards after loading", () => {
    useMarketplace.mockReturnValue({
      items: mockItems,
      purchases: [],
      isLoading: false,
      error: null,
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    })
    render(<HomeMarketplaceRow />)
    const cards = screen.getAllByTestId("marketplace-item-card")
    expect(cards).toHaveLength(3)
  })

  it("shows 'Marketplace unavailable' on error", () => {
    useMarketplace.mockReturnValue({
      items: [],
      purchases: [],
      isLoading: false,
      error: "Failed to load",
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    })
    render(<HomeMarketplaceRow />)
    expect(screen.getByText("Marketplace unavailable")).toBeInTheDocument()
  })

  it("scroll container has snap classes", () => {
    useMarketplace.mockReturnValue({
      items: mockItems,
      purchases: [],
      isLoading: false,
      error: null,
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    })
    render(<HomeMarketplaceRow />)
    const container = screen.getByTestId("scroll-container")
    expect(container).toHaveClass("snap-x")
    expect(container).toHaveClass("snap-mandatory")
  })

  it("applies className prop", () => {
    render(<HomeMarketplaceRow className="mt-6" />)
    expect(screen.getByTestId("home-marketplace-row")).toHaveClass("mt-6")
  })

  it("renders at most 5 item cards when more items are provided", () => {
    const sevenItems: MarketplaceItem[] = Array.from({ length: 7 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      description: `Desc ${i}`,
      price: 10 + i,
      icon: "🎁",
      effect_type: "extra_ping",
      effect_config: {},
      is_active: true,
      sort_order: i,
      created_at: "",
    }))
    useMarketplace.mockReturnValue({
      items: sevenItems,
      purchases: [],
      isLoading: false,
      error: null,
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    })
    render(<HomeMarketplaceRow />)
    const cards = screen.getAllByTestId("marketplace-item-card")
    expect(cards).toHaveLength(5)
  })

  it("shows items (not error) when both error and items are present", () => {
    useMarketplace.mockReturnValue({
      items: mockItems,
      purchases: [],
      isLoading: false,
      error: "Some error",
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    })
    render(<HomeMarketplaceRow />)
    // Items should render, not the error message
    expect(screen.getAllByTestId("marketplace-item-card")).toHaveLength(3)
    expect(screen.queryByText("Marketplace unavailable")).not.toBeInTheDocument()
  })

  it("clicking buy button on an item card opens the purchase modal", () => {
    useMarketplace.mockReturnValue({
      items: mockItems,
      purchases: [],
      isLoading: false,
      error: null,
      createPurchase: vi.fn(),
      refreshItems: vi.fn(),
      refreshPurchases: vi.fn(),
    })
    render(<HomeMarketplaceRow />)
    const buyButtons = screen.getAllByTestId("buy-button")
    fireEvent.click(buyButtons[0])
    // MarketplaceItemCard uses setTimeout(100ms) before calling onBuy
    act(() => { vi.advanceTimersByTime(100) })
    // After onBuy fires, the modal should open
    expect(screen.getByTestId("purchase-dialog")).toBeInTheDocument()
  })
})
