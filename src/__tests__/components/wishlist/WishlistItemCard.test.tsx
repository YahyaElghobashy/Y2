import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

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

import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard"
import type { WishlistItem } from "@/lib/types/wishlist.types"

const baseItem: WishlistItem = {
  id: "item-1",
  wishlist_id: "wl-1",
  title: "Sony Headphones",
  description: "Noise cancelling over-ear",
  url: "https://example.com/headphones",
  image_url: "https://example.com/img.jpg",
  image_media_id: null,
  price: 350,
  currency: "USD",
  category: "tech",
  priority: "must_have",
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

describe("WishlistItemCard", () => {
  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit: display", () => {
    it("renders title", () => {
      render(<WishlistItemCard item={baseItem} isOwnList />)
      expect(screen.getByText("Sony Headphones")).toBeInTheDocument()
    })

    it("renders description", () => {
      render(<WishlistItemCard item={baseItem} isOwnList />)
      expect(screen.getByText("Noise cancelling over-ear")).toBeInTheDocument()
    })

    it("renders price badge with currency symbol", () => {
      render(<WishlistItemCard item={baseItem} isOwnList />)
      expect(screen.getByTestId("wishlist-price")).toHaveTextContent("$ 350")
    })

    it("renders category chip", () => {
      render(<WishlistItemCard item={baseItem} isOwnList />)
      expect(screen.getByText(/Tech/)).toBeInTheDocument()
    })

    it("renders priority pill", () => {
      render(<WishlistItemCard item={baseItem} isOwnList />)
      expect(screen.getByText("Must Have")).toBeInTheDocument()
    })

    it("renders image when image_url is provided", () => {
      render(<WishlistItemCard item={baseItem} isOwnList />)
      const img = screen.getByRole("img", { name: "Sony Headphones" })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute("src", "https://example.com/img.jpg")
    })

    it("renders category emoji when no image", () => {
      const noImgItem = { ...baseItem, image_url: null }
      render(<WishlistItemCard item={noImgItem} isOwnList />)
      // Should show tech emoji fallback (no <img>)
      expect(screen.queryByRole("img", { name: "Sony Headphones" })).not.toBeInTheDocument()
    })

    it("renders external link when url present", () => {
      render(<WishlistItemCard item={baseItem} isOwnList />)
      const link = screen.getByTestId("wishlist-link")
      expect(link).toHaveAttribute("href", "https://example.com/headphones")
      expect(link).toHaveAttribute("target", "_blank")
    })

    it("does not render link when url is null", () => {
      const noUrlItem = { ...baseItem, url: null }
      render(<WishlistItemCard item={noUrlItem} isOwnList />)
      expect(screen.queryByTestId("wishlist-link")).not.toBeInTheDocument()
    })

    it("does not render price badge when price is null", () => {
      const noPriceItem = { ...baseItem, price: null }
      render(<WishlistItemCard item={noPriceItem} isOwnList />)
      expect(screen.queryByTestId("wishlist-price")).not.toBeInTheDocument()
    })

    it("applies reduced opacity for purchased items", () => {
      const purchasedItem = { ...baseItem, is_purchased: true }
      render(<WishlistItemCard item={purchasedItem} isOwnList />)
      const card = screen.getByTestId("wishlist-item-card")
      expect(card.className).toContain("opacity-60")
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction: own list actions", () => {
    it("renders delete button on own list", () => {
      const onDelete = vi.fn()
      render(<WishlistItemCard item={baseItem} isOwnList onDelete={onDelete} />)
      expect(screen.getByTestId("wishlist-delete-btn")).toBeInTheDocument()
    })

    it("fires onDelete with item id", () => {
      const onDelete = vi.fn()
      render(<WishlistItemCard item={baseItem} isOwnList onDelete={onDelete} />)
      fireEvent.click(screen.getByTestId("wishlist-delete-btn"))
      expect(onDelete).toHaveBeenCalledWith("item-1")
    })

    it("renders edit button when onEdit provided", () => {
      const onEdit = vi.fn()
      render(<WishlistItemCard item={baseItem} isOwnList onEdit={onEdit} />)
      expect(screen.getByTestId("wishlist-edit-btn")).toBeInTheDocument()
    })

    it("fires onEdit with full item", () => {
      const onEdit = vi.fn()
      render(<WishlistItemCard item={baseItem} isOwnList onEdit={onEdit} />)
      fireEvent.click(screen.getByTestId("wishlist-edit-btn"))
      expect(onEdit).toHaveBeenCalledWith(baseItem)
    })
  })

  describe("interaction: CRITICAL — no claim on own list", () => {
    it("does NOT render ClaimBadge on own list", () => {
      render(
        <WishlistItemCard
          item={baseItem}
          isOwnList
          onClaim={vi.fn()}
          onUnclaim={vi.fn()}
          onMarkPurchased={vi.fn()}
          userId="user-1"
        />
      )
      expect(screen.queryByTestId("claim-badge-unclaimed")).not.toBeInTheDocument()
      expect(screen.queryByTestId("claim-badge-claimed")).not.toBeInTheDocument()
      expect(screen.queryByTestId("claim-badge-purchased")).not.toBeInTheDocument()
    })
  })

  describe("interaction: partner list claim", () => {
    it("renders ClaimBadge on partner list", () => {
      render(
        <WishlistItemCard
          item={baseItem}
          isOwnList={false}
          onClaim={vi.fn()}
          onUnclaim={vi.fn()}
          onMarkPurchased={vi.fn()}
          userId="user-1"
        />
      )
      expect(screen.getByTestId("claim-badge-unclaimed")).toBeInTheDocument()
    })

    it("does not render delete/edit on partner list", () => {
      render(
        <WishlistItemCard
          item={baseItem}
          isOwnList={false}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
          userId="user-1"
        />
      )
      expect(screen.queryByTestId("wishlist-delete-btn")).not.toBeInTheDocument()
      expect(screen.queryByTestId("wishlist-edit-btn")).not.toBeInTheDocument()
    })
  })
})
