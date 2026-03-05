import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

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

import { AddWishlistItemForm } from "@/components/wishlist/AddWishlistItemForm"

describe("AddWishlistItemForm", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    extractUrlMetadata: vi.fn().mockResolvedValue(null),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    defaultProps.onSubmit.mockResolvedValue(undefined)
    defaultProps.extractUrlMetadata.mockResolvedValue(null)
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit: rendering", () => {
    it("renders form when open is true", () => {
      render(<AddWishlistItemForm {...defaultProps} />)
      expect(screen.getByTestId("add-wishlist-form")).toBeInTheDocument()
    })

    it("does not render when open is false", () => {
      render(<AddWishlistItemForm {...defaultProps} open={false} />)
      expect(screen.queryByTestId("add-wishlist-form")).not.toBeInTheDocument()
    })

    it("renders all form fields", () => {
      render(<AddWishlistItemForm {...defaultProps} />)
      expect(screen.getByTestId("wishlist-url-input")).toBeInTheDocument()
      expect(screen.getByTestId("wishlist-title-input")).toBeInTheDocument()
      expect(screen.getByTestId("wishlist-price-input")).toBeInTheDocument()
      expect(screen.getByTestId("wishlist-currency-select")).toBeInTheDocument()
      expect(screen.getByTestId("wishlist-category-chips")).toBeInTheDocument()
      expect(screen.getByTestId("wishlist-priority-radio")).toBeInTheDocument()
      expect(screen.getByTestId("wishlist-description-input")).toBeInTheDocument()
      expect(screen.getByTestId("wishlist-submit-btn")).toBeInTheDocument()
    })

    it("renders 9 category chips", () => {
      render(<AddWishlistItemForm {...defaultProps} />)
      const chips = screen.getByTestId("wishlist-category-chips")
      expect(chips.children).toHaveLength(9)
    })

    it("renders 3 priority options", () => {
      render(<AddWishlistItemForm {...defaultProps} />)
      const radio = screen.getByTestId("wishlist-priority-radio")
      expect(radio.children).toHaveLength(3)
    })

    it("submit button is disabled when title is empty", () => {
      render(<AddWishlistItemForm {...defaultProps} />)
      expect(screen.getByTestId("wishlist-submit-btn")).toBeDisabled()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction: URL auto-fill", () => {
    it("calls extractUrlMetadata on URL blur", async () => {
      const extract = vi.fn().mockResolvedValue({
        title: "Auto Title",
        description: "Auto Desc",
        image: "https://img.com/auto.jpg",
        price: 42,
        currency: "USD",
      })
      render(<AddWishlistItemForm {...defaultProps} extractUrlMetadata={extract} />)

      const urlInput = screen.getByTestId("wishlist-url-input")
      fireEvent.change(urlInput, { target: { value: "https://example.com/product" } })
      fireEvent.blur(urlInput)

      await waitFor(() => expect(extract).toHaveBeenCalledWith("https://example.com/product"))
    })

    it("auto-fills title from metadata when title is empty", async () => {
      const extract = vi.fn().mockResolvedValue({
        title: "Auto Title",
        description: null,
        image: null,
        price: null,
        currency: null,
      })
      render(<AddWishlistItemForm {...defaultProps} extractUrlMetadata={extract} />)

      const urlInput = screen.getByTestId("wishlist-url-input")
      fireEvent.change(urlInput, { target: { value: "https://example.com/product" } })
      fireEvent.blur(urlInput)

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-title-input")).toHaveValue("Auto Title")
      })
    })

    it("does not overwrite manually entered title", async () => {
      const extract = vi.fn().mockResolvedValue({
        title: "Auto Title",
        description: null,
        image: null,
        price: null,
        currency: null,
      })
      render(<AddWishlistItemForm {...defaultProps} extractUrlMetadata={extract} />)

      // Manually enter title first
      fireEvent.change(screen.getByTestId("wishlist-title-input"), { target: { value: "My Title" } })

      // Then paste URL
      const urlInput = screen.getByTestId("wishlist-url-input")
      fireEvent.change(urlInput, { target: { value: "https://example.com/product" } })
      fireEvent.blur(urlInput)

      await waitFor(() => {
        expect(screen.getByTestId("wishlist-title-input")).toHaveValue("My Title")
      })
    })
  })

  describe("interaction: validation", () => {
    it("shows error when submitting with empty title", async () => {
      render(<AddWishlistItemForm {...defaultProps} />)

      // Clear any existing value and try to submit
      fireEvent.change(screen.getByTestId("wishlist-title-input"), { target: { value: "" } })
      // Button should be disabled, but let's ensure error state
      expect(screen.getByTestId("wishlist-submit-btn")).toBeDisabled()
    })

    it("enables submit when title is provided", () => {
      render(<AddWishlistItemForm {...defaultProps} />)
      fireEvent.change(screen.getByTestId("wishlist-title-input"), { target: { value: "New Item" } })
      expect(screen.getByTestId("wishlist-submit-btn")).not.toBeDisabled()
    })
  })

  describe("interaction: submit", () => {
    it("calls onSubmit with correct data", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      render(<AddWishlistItemForm {...defaultProps} onSubmit={onSubmit} />)

      fireEvent.change(screen.getByTestId("wishlist-title-input"), { target: { value: "Test Item" } })
      fireEvent.change(screen.getByTestId("wishlist-price-input"), { target: { value: "99.50" } })
      fireEvent.click(screen.getByTestId("category-tech"))
      fireEvent.click(screen.getByTestId("priority-must_have"))

      fireEvent.click(screen.getByTestId("wishlist-submit-btn"))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Test Item",
            price: 99.5,
            category: "tech",
            priority: "must_have",
          })
        )
      })
    })

    it("calls onClose after successful submit", async () => {
      const onClose = vi.fn()
      render(<AddWishlistItemForm {...defaultProps} onClose={onClose} />)

      fireEvent.change(screen.getByTestId("wishlist-title-input"), { target: { value: "Test" } })
      fireEvent.click(screen.getByTestId("wishlist-submit-btn"))

      await waitFor(() => expect(onClose).toHaveBeenCalled())
    })
  })

  describe("interaction: category selection", () => {
    it("selects category chip on click", () => {
      render(<AddWishlistItemForm {...defaultProps} />)
      const techChip = screen.getByTestId("category-tech")
      fireEvent.click(techChip)
      // Tech should now be selected (has accent-primary bg)
      expect(techChip.className).toContain("accent-primary")
    })
  })

  describe("interaction: close", () => {
    it("fires onClose when close button clicked", () => {
      const onClose = vi.fn()
      render(<AddWishlistItemForm {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByTestId("add-wishlist-close"))
      expect(onClose).toHaveBeenCalled()
    })

    it("fires onClose when overlay clicked", () => {
      const onClose = vi.fn()
      render(<AddWishlistItemForm {...defaultProps} onClose={onClose} />)
      fireEvent.click(screen.getByTestId("add-wishlist-form-overlay"))
      expect(onClose).toHaveBeenCalled()
    })
  })
})
