import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockSpendCoyyns = vi.fn()

const defaultCoyynsReturn = {
  wallet: { id: "w-1", user_id: "user-1", balance: 500, lifetime_earned: 1000, lifetime_spent: 500, created_at: "", updated_at: "" },
  partnerWallet: null,
  transactions: [],
  isLoading: false,
  error: null as string | null,
  addCoyyns: vi.fn(),
  spendCoyyns: mockSpendCoyyns,
  refreshWallet: vi.fn(),
}

const { useCoyyns } = vi.hoisted(() => ({
  useCoyyns: vi.fn(() => defaultCoyynsReturn),
}))

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns,
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock framer-motion
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

const defaultItem = {
  icon: "🔔",
  title: "Extra Notification",
  description: "Send more messages today",
  price: 25,
  category: "marketplace",
}

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  item: defaultItem,
  onSuccess: vi.fn(),
}

describe("PurchaseConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCoyyns.mockReturnValue({ ...defaultCoyynsReturn })
    mockSpendCoyyns.mockResolvedValue(undefined)
  })

  it("renders the dialog when open", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.getByTestId("purchase-dialog")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(<PurchaseConfirmModal {...defaultProps} open={false} />)
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

  it("renders balance breakdown section", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.getByTestId("balance-breakdown")).toBeInTheDocument()
    expect(screen.getByText("Cost")).toBeInTheDocument()
    expect(screen.getByText("Balance")).toBeInTheDocument()
    expect(screen.getByText("After")).toBeInTheDocument()
  })

  it("shows after-balance as (balance - cost)", () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    // 500 - 25 = 475
    expect(screen.getByTestId("after-balance")).toHaveTextContent("475")
  })

  it("shows 'Insufficient' when balance < cost", () => {
    useCoyyns.mockReturnValue({
      ...defaultCoyynsReturn,
      wallet: { ...defaultCoyynsReturn.wallet!, balance: 10 },
    })
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.getByTestId("after-balance")).toHaveTextContent("Insufficient")
  })

  it("disables confirm button when cannot afford", () => {
    useCoyyns.mockReturnValue({
      ...defaultCoyynsReturn,
      wallet: { ...defaultCoyynsReturn.wallet!, balance: 10 },
    })
    render(<PurchaseConfirmModal {...defaultProps} />)
    expect(screen.getByTestId("purchase-confirm")).toBeDisabled()
  })

  it("calls spendCoyyns on confirm", async () => {
    render(<PurchaseConfirmModal {...defaultProps} />)
    fireEvent.click(screen.getByTestId("purchase-confirm"))
    await waitFor(() => {
      expect(mockSpendCoyyns).toHaveBeenCalledWith(25, "Extra Notification", "marketplace")
    })
  })

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn()
    render(<PurchaseConfirmModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("purchase-backdrop"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn()
    render(<PurchaseConfirmModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("purchase-close"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn()
    render(<PurchaseConfirmModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("purchase-cancel"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onSuccess after successful purchase", async () => {
    const onSuccess = vi.fn()
    render(<PurchaseConfirmModal {...defaultProps} onSuccess={onSuccess} />)
    fireEvent.click(screen.getByTestId("purchase-confirm"))
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
    })
  })

  it("shows error message when purchase fails", async () => {
    mockSpendCoyyns.mockRejectedValueOnce(new Error("fail"))
    render(<PurchaseConfirmModal {...defaultProps} />)
    fireEvent.click(screen.getByTestId("purchase-confirm"))
    await waitFor(() => {
      expect(screen.getByTestId("purchase-error")).toHaveTextContent("Purchase failed")
    })
  })
})
