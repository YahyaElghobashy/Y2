import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──────────────────────────────────────────────
const mockCreatePurchase = vi.fn()

const { useMarketplace } = vi.hoisted(() => ({
  useMarketplace: vi.fn(() => ({
    items: [],
    purchases: [],
    isLoading: false,
    error: null,
    createPurchase: mockCreatePurchase,
    refreshItems: vi.fn(),
    refreshPurchases: vi.fn(),
  })),
}))

vi.mock("@/lib/hooks/use-marketplace", () => ({ useMarketplace }))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { PurchaseConfirmModal } from "@/components/relationship/PurchaseConfirmModal"
import type { MarketplaceItem } from "@/lib/types/marketplace.types"

const mockItem: MarketplaceItem = {
  id: "item-1",
  name: "Extra Notification",
  description: "Send more messages today",
  price: 10,
  icon: "🔔",
  effect_type: "extra_ping",
  effect_config: { extra_sends: 1 },
  is_active: true,
  sort_order: 1,
  created_at: "2024-01-01T00:00:00Z",
}

const vetoItem: MarketplaceItem = {
  ...mockItem,
  id: "item-veto",
  name: "Movie Night Veto",
  effect_type: "veto",
  price: 25,
  effect_config: { requires_input: true, input_prompt: "What movie?" },
}

const defaultProps = {
  item: mockItem,
  balance: 100,
  isOpen: true,
  onClose: vi.fn(),
  onConfirmed: vi.fn(),
}

describe("PurchaseConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreatePurchase.mockResolvedValue({ id: "purchase-1", status: "pending" })
  })

  it("renders the dialog when open", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.getByTestId("purchase-dialog")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(<PurchaseConfirmModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByTestId("purchase-dialog")).not.toBeInTheDocument()
  })

  it("does not render when item is null", () => {
    render(<PurchaseConfirmModal {...defaultProps} item={null} />)
    expect(screen.queryByTestId("purchase-dialog")).not.toBeInTheDocument()
  })

  it("renders the item title", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.getByText("Extra Notification")).toBeInTheDocument()
  })

  it("renders the item description", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.getByText("Send more messages today")).toBeInTheDocument()
  })

  it("renders the item icon", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.getByText("🔔")).toBeInTheDocument()
  })

  it("renders balance breakdown", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.getByTestId("balance-breakdown")).toBeInTheDocument()
    expect(screen.getByText("Cost")).toBeInTheDocument()
    expect(screen.getByText("Balance")).toBeInTheDocument()
    expect(screen.getByText("After")).toBeInTheDocument()
  })

  it("shows after-balance as (balance - cost)", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    // 100 - 10 = 90
    expect(screen.getByTestId("after-balance")).toHaveTextContent("90")
  })

  it("shows 'Insufficient' when balance < cost", () => {
    render(<PurchaseConfirmModal {...defaultProps} balance={5} />)
    expect(screen.getByTestId("after-balance")).toHaveTextContent("Insufficient")
  })

  it("disables confirm button when cannot afford", () => {
    render(<PurchaseConfirmModal {...defaultProps} balance={5} />)
    expect(screen.getByTestId("purchase-confirm")).toBeDisabled()
  })

  it("shows 'Not enough CoYYns' when cannot afford", () => {
    render(<PurchaseConfirmModal {...defaultProps} balance={5} />)
    expect(screen.getByTestId("purchase-confirm")).toHaveTextContent("Not enough CoYYns")
  })

  it("shows input field when requires_input is true", () => {
    render(<PurchaseConfirmModal {...defaultProps} item={vetoItem} />)
    expect(screen.getByTestId("purchase-input-section")).toBeInTheDocument()
    expect(screen.getByTestId("purchase-input")).toBeInTheDocument()
  })

  it("shows input prompt from effect_config", () => {
    render(<PurchaseConfirmModal {...defaultProps} item={vetoItem} />)
    expect(screen.getByText("What movie?")).toBeInTheDocument()
  })

  it("does NOT show input field when requires_input is false", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.queryByTestId("purchase-input-section")).not.toBeInTheDocument()
  })

  it("validates input is not empty when required", async () => {
    render(<PurchaseConfirmModal {...defaultProps} item={vetoItem} />)
    fireEvent.click(screen.getByTestId("purchase-confirm"))
    await waitFor(() => {
      expect(screen.getByTestId("purchase-error")).toHaveTextContent("Please fill in the required field")
    })
    expect(mockCreatePurchase).not.toHaveBeenCalled()
  })

  it("calls createPurchase on confirm", async () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    fireEvent.click(screen.getByTestId("purchase-confirm"))
    await waitFor(() => {
      expect(mockCreatePurchase).toHaveBeenCalledWith("item-1", undefined)
    })
  })

  it("calls createPurchase with effect payload when input provided", async () => {
    render(<PurchaseConfirmModal {...defaultProps} item={vetoItem} />)
    fireEvent.change(screen.getByTestId("purchase-input"), { target: { value: "Inception" } })
    fireEvent.click(screen.getByTestId("purchase-confirm"))
    await waitFor(() => {
      expect(mockCreatePurchase).toHaveBeenCalledWith("item-veto", { movie: "Inception" })
    })
  })

  it("calls onConfirmed with purchase after success", async () => {
    const onConfirmed = vi.fn()
    render(<PurchaseConfirmModal {...defaultProps} onConfirmed={onConfirmed} />)
    fireEvent.click(screen.getByTestId("purchase-confirm"))
    await waitFor(() => {
      expect(onConfirmed).toHaveBeenCalledWith({ id: "purchase-1", status: "pending" })
    })
  })

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn()
    render(<PurchaseConfirmModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("purchase-backdrop"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onClose when cancel clicked", () => {
    const onClose = vi.fn()
    render(<PurchaseConfirmModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("purchase-cancel"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("shows error message when purchase fails", async () => {
    mockCreatePurchase.mockRejectedValueOnce(new Error("fail"))
    render(<PurchaseConfirmModal {...defaultProps} />)
    fireEvent.click(screen.getByTestId("purchase-confirm"))
    await waitFor(() => {
      expect(screen.getByTestId("purchase-error")).toHaveTextContent("Purchase failed")
    })
  })
})
