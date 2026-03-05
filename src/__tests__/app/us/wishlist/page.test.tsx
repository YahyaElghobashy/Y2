import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, layout, layoutId, whileTap, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileTap, transition, ...rest } = props
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockPartner = { id: "user-2", email: "yara@test.com", display_name: "Yara" }

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser, partner: mockPartner }),
}))

const myItem = {
  id: "item-1",
  wishlist_id: "wl-1",
  title: "Headphones",
  description: "Sony WH-1000",
  url: "https://ex.com",
  image_url: null,
  image_media_id: null,
  price: 300,
  currency: "USD",
  category: "tech" as const,
  priority: "must_have" as const,
  is_purchased: false,
  purchased_at: null,
  purchased_by: null,
  claimed_by: null,
  claimed_at: null,
  sort_order: 0,
  added_by: "user-1",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const myPurchasedItem = {
  ...myItem,
  id: "item-2",
  title: "Old Book",
  is_purchased: true,
  purchased_at: "2026-03-04T00:00:00Z",
  price: 50,
}

const partnerItem = {
  ...myItem,
  id: "item-p1",
  wishlist_id: "wl-2",
  title: "Silk Scarf",
  added_by: "user-2",
  category: "fashion" as const,
  price: 120,
  claimed_by: null,
}

const defaultHookReturn = {
  myWishlist: { id: "wl-1", owner_id: "user-1", name: "My Wishlist", is_default: true, created_at: "", updated_at: "" },
  partnerWishlist: { id: "wl-2", owner_id: "user-2", name: "My Wishlist", is_default: true, created_at: "", updated_at: "" },
  myItems: [myItem, myPurchasedItem],
  partnerItems: [partnerItem],
  myTotal: 300,
  partnerTotal: 120,
  isLoading: false,
  error: null,
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateItem: vi.fn(),
  claimItem: vi.fn(),
  unclaimItem: vi.fn(),
  markPurchased: vi.fn(),
  extractUrlMetadata: vi.fn(),
}

const mockUseWishlist = vi.fn(() => defaultHookReturn)

vi.mock("@/lib/hooks/use-wishlist", () => ({
  useWishlist: () => mockUseWishlist(),
}))

import WishlistPage from "@/app/(main)/us/wishlist/page"

describe("WishlistPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWishlist.mockReturnValue(defaultHookReturn)
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit: loading state", () => {
    it("shows skeleton loading when isLoading", () => {
      mockUseWishlist.mockReturnValue({ ...defaultHookReturn, isLoading: true })
      render(<WishlistPage />)
      expect(screen.getByTestId("wishlist-loading")).toBeInTheDocument()
    })
  })

  describe("unit: tabs", () => {
    it("renders both tabs", () => {
      render(<WishlistPage />)
      expect(screen.getByTestId("tab-mine")).toBeInTheDocument()
      expect(screen.getByTestId("tab-partner")).toBeInTheDocument()
    })

    it("shows partner name in tab", () => {
      render(<WishlistPage />)
      expect(screen.getByTestId("tab-partner")).toHaveTextContent("Yara")
    })
  })

  describe("unit: totals", () => {
    it("shows total for active tab", () => {
      render(<WishlistPage />)
      expect(screen.getByTestId("wishlist-total")).toBeInTheDocument()
      expect(screen.getByTestId("wishlist-total")).toHaveTextContent("300")
    })
  })

  describe("unit: items display", () => {
    it("renders unpurchased items as cards", () => {
      render(<WishlistPage />)
      const cards = screen.getAllByTestId("wishlist-item-card")
      // 1 unpurchased item on my list (default tab)
      expect(cards).toHaveLength(1)
    })

    it("shows empty state when no items", () => {
      mockUseWishlist.mockReturnValue({ ...defaultHookReturn, myItems: [], myTotal: 0 })
      render(<WishlistPage />)
      expect(screen.getByTestId("wishlist-empty")).toBeInTheDocument()
    })
  })

  describe("unit: CRITICAL — no claim on my tab", () => {
    it("does not render any claim badges on My Wishlist tab", () => {
      render(<WishlistPage />)
      expect(screen.queryByTestId("claim-badge-unclaimed")).not.toBeInTheDocument()
      expect(screen.queryByTestId("claim-badge-claimed")).not.toBeInTheDocument()
      expect(screen.queryByTestId("claim-badge-purchased")).not.toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction: tab switching", () => {
    it("switches to partner tab on click", () => {
      render(<WishlistPage />)
      fireEvent.click(screen.getByTestId("tab-partner"))
      // Should now show partner items with claim badge
      expect(screen.getByText("Silk Scarf")).toBeInTheDocument()
    })

    it("shows claim badge on partner tab", () => {
      render(<WishlistPage />)
      fireEvent.click(screen.getByTestId("tab-partner"))
      expect(screen.getByTestId("claim-badge-unclaimed")).toBeInTheDocument()
    })
  })

  describe("interaction: filters", () => {
    it("renders category and priority filters", () => {
      render(<WishlistPage />)
      expect(screen.getByTestId("category-filter")).toBeInTheDocument()
      expect(screen.getByTestId("priority-filter")).toBeInTheDocument()
    })

    it("filters items by category", () => {
      // myItem is "tech" category
      render(<WishlistPage />)
      const categoryFilter = screen.getByTestId("category-filter")
      fireEvent.change(categoryFilter, { target: { value: "fashion" } })
      // No items match "fashion" on my list
      expect(screen.getByTestId("wishlist-empty")).toBeInTheDocument()
    })
  })

  describe("interaction: purchased section", () => {
    it("renders purchased toggle when purchased items exist", () => {
      render(<WishlistPage />)
      expect(screen.getByTestId("purchased-toggle")).toBeInTheDocument()
      expect(screen.getByTestId("purchased-toggle")).toHaveTextContent("Purchased (1)")
    })

    it("expands purchased section on click", () => {
      render(<WishlistPage />)
      fireEvent.click(screen.getByTestId("purchased-toggle"))
      expect(screen.getByText("Old Book")).toBeInTheDocument()
    })
  })

  describe("interaction: add FAB", () => {
    it("shows FAB button on my list", () => {
      render(<WishlistPage />)
      expect(screen.getByTestId("wishlist-add-fab")).toBeInTheDocument()
    })

    it("hides FAB on partner list", () => {
      render(<WishlistPage />)
      fireEvent.click(screen.getByTestId("tab-partner"))
      expect(screen.queryByTestId("wishlist-add-fab")).not.toBeInTheDocument()
    })

    it("opens add form when FAB clicked", () => {
      render(<WishlistPage />)
      fireEvent.click(screen.getByTestId("wishlist-add-fab"))
      expect(screen.getByTestId("add-wishlist-form")).toBeInTheDocument()
    })
  })
})
