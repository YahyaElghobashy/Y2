import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileTap, transition, ...rest } = props
      return <button {...rest}>{children}</button>
    },
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, layout, layoutId, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

import { ClaimBadge } from "@/components/wishlist/ClaimBadge"
import type { WishlistItem } from "@/lib/types/wishlist.types"

const baseItem: WishlistItem = {
  id: "item-1",
  wishlist_id: "wl-1",
  title: "Test Item",
  description: null,
  url: null,
  image_url: null,
  image_media_id: null,
  price: 100,
  currency: "EGP",
  category: "tech",
  priority: "want",
  is_purchased: false,
  purchased_at: null,
  purchased_by: null,
  claimed_by: null,
  claimed_at: null,
  sort_order: 0,
  added_by: "user-2",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

describe("ClaimBadge", () => {
  const defaultProps = {
    userId: "user-1",
    onClaim: vi.fn(),
    onUnclaim: vi.fn(),
    onMarkPurchased: vi.fn(),
  }

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit: unclaimed state", () => {
    it("renders Claim button when item is unclaimed", () => {
      render(<ClaimBadge item={baseItem} {...defaultProps} />)
      expect(screen.getByTestId("claim-badge-unclaimed")).toBeInTheDocument()
      expect(screen.getByText("Claim")).toBeInTheDocument()
    })
  })

  describe("unit: claimed state", () => {
    it("renders Claimed badge when claimed by current user", () => {
      const claimedItem = { ...baseItem, claimed_by: "user-1", claimed_at: "2026-03-05T10:00:00Z" }
      render(<ClaimBadge item={claimedItem} {...defaultProps} />)
      expect(screen.getByTestId("claim-badge-claimed")).toBeInTheDocument()
      expect(screen.getByText("Claimed")).toBeInTheDocument()
    })

    it("renders Mark Purchased button alongside Claimed", () => {
      const claimedItem = { ...baseItem, claimed_by: "user-1", claimed_at: "2026-03-05T10:00:00Z" }
      render(<ClaimBadge item={claimedItem} {...defaultProps} />)
      expect(screen.getByTestId("claim-badge-mark-purchased")).toBeInTheDocument()
      expect(screen.getByText("Got it")).toBeInTheDocument()
    })
  })

  describe("unit: purchased state", () => {
    it("renders Purchased badge non-interactively", () => {
      const purchasedItem = { ...baseItem, is_purchased: true, purchased_at: "2026-03-05T12:00:00Z", purchased_by: "user-1" }
      render(<ClaimBadge item={purchasedItem} {...defaultProps} />)
      expect(screen.getByTestId("claim-badge-purchased")).toBeInTheDocument()
      expect(screen.getByText("Purchased")).toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("fires onClaim with item id when Claim is clicked", () => {
      const onClaim = vi.fn()
      render(<ClaimBadge item={baseItem} {...defaultProps} onClaim={onClaim} />)
      fireEvent.click(screen.getByTestId("claim-badge-unclaimed"))
      expect(onClaim).toHaveBeenCalledWith("item-1")
    })

    it("fires onUnclaim with item id when Claimed is clicked", () => {
      const onUnclaim = vi.fn()
      const claimedItem = { ...baseItem, claimed_by: "user-1", claimed_at: "2026-03-05T10:00:00Z" }
      render(<ClaimBadge item={claimedItem} {...defaultProps} onUnclaim={onUnclaim} />)
      fireEvent.click(screen.getByTestId("claim-badge-claimed"))
      expect(onUnclaim).toHaveBeenCalledWith("item-1")
    })

    it("fires onMarkPurchased with item id when Got it is clicked", () => {
      const onMarkPurchased = vi.fn()
      const claimedItem = { ...baseItem, claimed_by: "user-1", claimed_at: "2026-03-05T10:00:00Z" }
      render(<ClaimBadge item={claimedItem} {...defaultProps} onMarkPurchased={onMarkPurchased} />)
      fireEvent.click(screen.getByTestId("claim-badge-mark-purchased"))
      expect(onMarkPurchased).toHaveBeenCalledWith("item-1")
    })
  })
})
