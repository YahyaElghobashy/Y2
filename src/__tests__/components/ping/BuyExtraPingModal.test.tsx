import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ── Mocks ──

const mockSpendCoyyns = vi.fn()
const mockPurchaseBonusSend = vi.fn()

let mockCoyynsReturn = {
  wallet: { balance: 100, id: "w1", user_id: "u1", lifetime_earned: 200, lifetime_spent: 100, created_at: "", updated_at: "" },
  partnerWallet: null,
  transactions: [],
  isLoading: false,
  error: null as string | null,
  addCoyyns: vi.fn(),
  spendCoyyns: mockSpendCoyyns,
  refreshWallet: vi.fn(),
}

let mockNotificationsReturn = {
  notifications: [],
  dailyLimit: null,
  canSend: false,
  remainingSends: 0,
  isLoading: false,
  error: null as string | null,
  sendNotification: vi.fn(),
  purchaseBonusSend: mockPurchaseBonusSend,
  refreshLimits: vi.fn(),
}

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns: () => mockCoyynsReturn,
}))

vi.mock("@/lib/hooks/use-notifications", () => ({
  useNotifications: () => mockNotificationsReturn,
}))

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom")
  return { ...actual, createPortal: (node: React.ReactNode) => node }
})

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>(
      ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown> & { children?: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => {
        void initial; void animate; void exit; void transition; void whileHover; void whileTap
        return <div ref={ref} {...props}>{children}</div>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { BuyExtraPingModal } from "@/components/ping/BuyExtraPingModal"

describe("BuyExtraPingModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onPurchased: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCoyynsReturn = {
      ...mockCoyynsReturn,
      wallet: { balance: 100, id: "w1", user_id: "u1", lifetime_earned: 200, lifetime_spent: 100, created_at: "", updated_at: "" },
    }
    mockSpendCoyyns.mockResolvedValue(undefined)
    mockPurchaseBonusSend.mockResolvedValue(undefined)
  })

  it("renders modal content when open", () => {
    render(<BuyExtraPingModal {...defaultProps} />)
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Buy Extra Ping")
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByTestId("buy-ping-balance")).toHaveTextContent("Your balance: 100 CoYYns")
  })

  it("does not render when closed", () => {
    render(<BuyExtraPingModal {...defaultProps} open={false} />)
    expect(screen.queryByText("Buy Extra Ping")).not.toBeInTheDocument()
  })

  it("shows insufficient balance message when balance < 10", () => {
    mockCoyynsReturn = {
      ...mockCoyynsReturn,
      wallet: { balance: 5, id: "w1", user_id: "u1", lifetime_earned: 10, lifetime_spent: 5, created_at: "", updated_at: "" },
    }
    render(<BuyExtraPingModal {...defaultProps} />)
    expect(screen.getByTestId("buy-ping-balance")).toHaveTextContent("Need 5 more CoYYns")
  })

  it("disables buy button when balance is insufficient", () => {
    mockCoyynsReturn = {
      ...mockCoyynsReturn,
      wallet: { balance: 3, id: "w1", user_id: "u1", lifetime_earned: 10, lifetime_spent: 7, created_at: "", updated_at: "" },
    }
    render(<BuyExtraPingModal {...defaultProps} />)
    expect(screen.getByTestId("buy-ping-confirm")).toBeDisabled()
  })

  it("calls spendCoyyns and purchaseBonusSend on buy", async () => {
    render(<BuyExtraPingModal {...defaultProps} />)
    fireEvent.click(screen.getByTestId("buy-ping-confirm"))

    await waitFor(() => {
      expect(mockSpendCoyyns).toHaveBeenCalledWith(10, "Extra ping", "notification_purchase")
      expect(mockPurchaseBonusSend).toHaveBeenCalled()
      expect(defaultProps.onPurchased).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it("shows error on purchase failure", async () => {
    mockSpendCoyyns.mockRejectedValueOnce(new Error("fail"))
    render(<BuyExtraPingModal {...defaultProps} />)
    fireEvent.click(screen.getByTestId("buy-ping-confirm"))

    await waitFor(() => {
      expect(screen.getByTestId("buy-ping-error")).toHaveTextContent("Purchase failed")
    })
  })

  it("closes on backdrop click", () => {
    render(<BuyExtraPingModal {...defaultProps} />)
    fireEvent.click(screen.getByTestId("buy-ping-backdrop"))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it("closes on X button click", () => {
    render(<BuyExtraPingModal {...defaultProps} />)
    fireEvent.click(screen.getByTestId("buy-ping-close"))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })
})
