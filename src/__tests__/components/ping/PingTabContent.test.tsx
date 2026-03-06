import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// ── Mocks ──

const mockRefreshLimits = vi.fn()

let mockNotificationsReturn = {
  notifications: [],
  dailyLimit: null as {
    bonus_sends_available: number
    bonus_sends_used: number
    free_sends_used: number
    user_id: string
    date: string
    id: string
    created_at: string
  } | null,
  canSend: true,
  remainingSends: 2,
  isLoading: false,
  error: null as string | null,
  sendNotification: vi.fn(),
  purchaseBonusSend: vi.fn(),
  refreshLimits: mockRefreshLimits,
}

vi.mock("@/lib/hooks/use-notifications", () => ({
  useNotifications: () => mockNotificationsReturn,
}))

// Mock all child components to isolate PingTabContent logic
vi.mock("@/components/shared/PushPermissionPrompt", () => ({
  PushPermissionPrompt: () => (
    <div data-testid="push-permission-prompt">PushPermissionPrompt</div>
  ),
}))

vi.mock("@/components/relationship/SendLimitIndicator", () => ({
  SendLimitIndicator: ({
    remainingSends,
    bonusSends,
    onBuyMore,
  }: {
    remainingSends: number
    bonusSends?: number
    onBuyMore?: () => void
  }) => (
    <div data-testid="send-limit-indicator">
      <span data-testid="sli-remaining">{remainingSends}</span>
      <span data-testid="sli-bonus">{bonusSends ?? 0}</span>
      {onBuyMore && (
        <button data-testid="sli-buy-more" onClick={onBuyMore}>
          Buy more
        </button>
      )}
    </div>
  ),
}))

vi.mock("@/components/relationship/NotificationBuilder", () => ({
  NotificationBuilder: ({ onBuyMore }: { onBuyMore?: () => void }) => (
    <div data-testid="notification-builder">
      {onBuyMore && (
        <button data-testid="nb-buy-more" onClick={onBuyMore}>
          Buy more
        </button>
      )}
    </div>
  ),
}))

vi.mock("@/components/ping/CustomPingComposer", () => ({
  CustomPingComposer: () => (
    <div data-testid="custom-ping-composer">CustomPingComposer</div>
  ),
}))

vi.mock("@/components/ping/PingHistory", () => ({
  PingHistory: () => <div data-testid="ping-history">PingHistory</div>,
}))

vi.mock("@/components/ping/BuyExtraPingModal", () => ({
  BuyExtraPingModal: ({
    open,
    onClose,
    onPurchased,
  }: {
    open: boolean
    onClose: () => void
    onPurchased: () => void
  }) =>
    open ? (
      <div data-testid="buy-extra-ping-modal" role="dialog">
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        <button data-testid="modal-purchased" onClick={onPurchased}>
          Buy
        </button>
      </div>
    ) : null,
}))

import { PingTabContent } from "@/components/ping/PingTabContent"

describe("PingTabContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotificationsReturn = {
      notifications: [],
      dailyLimit: null,
      canSend: true,
      remainingSends: 2,
      isLoading: false,
      error: null,
      sendNotification: vi.fn(),
      purchaseBonusSend: vi.fn(),
      refreshLimits: mockRefreshLimits,
    }
  })

  // ═══════════════════════════════════════════════
  // Unit Tests
  // ═══════════════════════════════════════════════

  describe("Unit: child components render", () => {
    it("renders PushPermissionPrompt", () => {
      render(<PingTabContent />)
      expect(screen.getByTestId("push-permission-prompt")).toBeInTheDocument()
    })

    it("renders SendLimitIndicator", () => {
      render(<PingTabContent />)
      expect(screen.getByTestId("send-limit-indicator")).toBeInTheDocument()
    })

    it("renders NotificationBuilder", () => {
      render(<PingTabContent />)
      expect(screen.getByTestId("notification-builder")).toBeInTheDocument()
    })

    it("renders CustomPingComposer", () => {
      render(<PingTabContent />)
      expect(screen.getByTestId("custom-ping-composer")).toBeInTheDocument()
    })

    it("renders PingHistory", () => {
      render(<PingTabContent />)
      expect(screen.getByTestId("ping-history")).toBeInTheDocument()
    })

    it("does not render BuyExtraPingModal by default (showBuyModal = false)", () => {
      render(<PingTabContent />)
      expect(screen.queryByTestId("buy-extra-ping-modal")).not.toBeInTheDocument()
    })

    it("renders the 'or write your own' divider text", () => {
      render(<PingTabContent />)
      expect(screen.getByText("or write your own")).toBeInTheDocument()
    })

    it("wraps everything in a container with data-testid='ping-tab-content'", () => {
      render(<PingTabContent />)
      expect(screen.getByTestId("ping-tab-content")).toBeInTheDocument()
    })
  })

  describe("Unit: bonusSends computed from dailyLimit", () => {
    it("passes 0 bonusSends when dailyLimit is null", () => {
      mockNotificationsReturn.dailyLimit = null
      render(<PingTabContent />)
      expect(screen.getByTestId("sli-bonus")).toHaveTextContent("0")
    })

    it("passes bonus_sends_available from dailyLimit when present", () => {
      mockNotificationsReturn.dailyLimit = {
        bonus_sends_available: 5,
        bonus_sends_used: 1,
        free_sends_used: 2,
        user_id: "u1",
        date: "2026-03-04",
        id: "dl1",
        created_at: "",
      }
      render(<PingTabContent />)
      expect(screen.getByTestId("sli-bonus")).toHaveTextContent("5")
    })

    it("passes 0 bonusSends when bonus_sends_available is 0", () => {
      mockNotificationsReturn.dailyLimit = {
        bonus_sends_available: 0,
        bonus_sends_used: 0,
        free_sends_used: 0,
        user_id: "u1",
        date: "2026-03-04",
        id: "dl2",
        created_at: "",
      }
      render(<PingTabContent />)
      expect(screen.getByTestId("sli-bonus")).toHaveTextContent("0")
    })
  })

  // ═══════════════════════════════════════════════
  // Interaction Tests
  // ═══════════════════════════════════════════════

  describe("Interaction: buy more flow via SendLimitIndicator", () => {
    it("opens BuyExtraPingModal when SendLimitIndicator onBuyMore is triggered", () => {
      render(<PingTabContent />)
      expect(screen.queryByTestId("buy-extra-ping-modal")).not.toBeInTheDocument()

      fireEvent.click(screen.getByTestId("sli-buy-more"))
      expect(screen.getByTestId("buy-extra-ping-modal")).toBeInTheDocument()
    })

    it("closes BuyExtraPingModal when modal onClose is triggered", () => {
      render(<PingTabContent />)

      // Open the modal
      fireEvent.click(screen.getByTestId("sli-buy-more"))
      expect(screen.getByTestId("buy-extra-ping-modal")).toBeInTheDocument()

      // Close the modal
      fireEvent.click(screen.getByTestId("modal-close"))
      expect(screen.queryByTestId("buy-extra-ping-modal")).not.toBeInTheDocument()
    })
  })

  describe("Interaction: buy more flow via NotificationBuilder", () => {
    it("opens BuyExtraPingModal when NotificationBuilder onBuyMore is triggered", () => {
      render(<PingTabContent />)
      expect(screen.queryByTestId("buy-extra-ping-modal")).not.toBeInTheDocument()

      fireEvent.click(screen.getByTestId("nb-buy-more"))
      expect(screen.getByTestId("buy-extra-ping-modal")).toBeInTheDocument()
    })

    it("closes modal after opening via NotificationBuilder", () => {
      render(<PingTabContent />)

      fireEvent.click(screen.getByTestId("nb-buy-more"))
      expect(screen.getByTestId("buy-extra-ping-modal")).toBeInTheDocument()

      fireEvent.click(screen.getByTestId("modal-close"))
      expect(screen.queryByTestId("buy-extra-ping-modal")).not.toBeInTheDocument()
    })
  })

  describe("Interaction: purchase callback triggers refreshLimits", () => {
    it("calls refreshLimits when modal onPurchased fires", () => {
      render(<PingTabContent />)

      // Open the modal
      fireEvent.click(screen.getByTestId("sli-buy-more"))

      // Click buy (triggers onPurchased)
      fireEvent.click(screen.getByTestId("modal-purchased"))
      expect(mockRefreshLimits).toHaveBeenCalledTimes(1)
    })
  })

  describe("Interaction: modal can be reopened after close", () => {
    it("re-opens modal after closing it", () => {
      render(<PingTabContent />)

      // Open
      fireEvent.click(screen.getByTestId("sli-buy-more"))
      expect(screen.getByTestId("buy-extra-ping-modal")).toBeInTheDocument()

      // Close
      fireEvent.click(screen.getByTestId("modal-close"))
      expect(screen.queryByTestId("buy-extra-ping-modal")).not.toBeInTheDocument()

      // Re-open
      fireEvent.click(screen.getByTestId("nb-buy-more"))
      expect(screen.getByTestId("buy-extra-ping-modal")).toBeInTheDocument()
    })
  })

  // ═══════════════════════════════════════════════
  // Integration Tests
  // ═══════════════════════════════════════════════

  describe("Integration: useNotifications hook data propagates to children", () => {
    it("passes remainingSends from hook to SendLimitIndicator", () => {
      mockNotificationsReturn.remainingSends = 1
      render(<PingTabContent />)
      expect(screen.getByTestId("sli-remaining")).toHaveTextContent("1")
    })

    it("passes remainingSends=0 correctly", () => {
      mockNotificationsReturn.remainingSends = 0
      render(<PingTabContent />)
      expect(screen.getByTestId("sli-remaining")).toHaveTextContent("0")
    })

    it("passes high remainingSends value correctly", () => {
      mockNotificationsReturn.remainingSends = 10
      render(<PingTabContent />)
      expect(screen.getByTestId("sli-remaining")).toHaveTextContent("10")
    })

    it("SendLimitIndicator receives an onBuyMore callback (always present)", () => {
      render(<PingTabContent />)
      // The mock renders a "Buy more" button only when onBuyMore is provided
      expect(screen.getByTestId("sli-buy-more")).toBeInTheDocument()
    })

    it("NotificationBuilder receives an onBuyMore callback (always present)", () => {
      render(<PingTabContent />)
      expect(screen.getByTestId("nb-buy-more")).toBeInTheDocument()
    })

    it("BuyExtraPingModal receives refreshLimits as onPurchased callback", () => {
      render(<PingTabContent />)

      // Open the modal, trigger onPurchased
      fireEvent.click(screen.getByTestId("sli-buy-more"))
      fireEvent.click(screen.getByTestId("modal-purchased"))

      // refreshLimits from the hook should have been called
      expect(mockRefreshLimits).toHaveBeenCalledTimes(1)
    })

    it("re-renders with updated hook values", () => {
      const { rerender } = render(<PingTabContent />)
      expect(screen.getByTestId("sli-remaining")).toHaveTextContent("2")

      // Simulate hook returning different values on next render
      mockNotificationsReturn.remainingSends = 0
      mockNotificationsReturn.dailyLimit = {
        bonus_sends_available: 3,
        bonus_sends_used: 0,
        free_sends_used: 2,
        user_id: "u1",
        date: "2026-03-04",
        id: "dl3",
        created_at: "",
      }
      rerender(<PingTabContent />)

      expect(screen.getByTestId("sli-remaining")).toHaveTextContent("0")
      expect(screen.getByTestId("sli-bonus")).toHaveTextContent("3")
    })
  })

  describe("Integration: component order within layout", () => {
    it("renders children in the correct DOM order", () => {
      render(<PingTabContent />)
      const container = screen.getByTestId("ping-tab-content")
      const children = Array.from(container.children) as HTMLElement[]

      // PushPermissionPrompt first
      expect(children[0].getAttribute("data-testid")).toBe("push-permission-prompt")
      // SendLimitIndicator second
      expect(children[1].getAttribute("data-testid")).toBe("send-limit-indicator")
      // NotificationBuilder third
      expect(children[2].getAttribute("data-testid")).toBe("notification-builder")
      // Divider fourth (contains "or write your own")
      expect(children[3]).toHaveTextContent("or write your own")
      // CustomPingComposer fifth
      expect(children[4].getAttribute("data-testid")).toBe("custom-ping-composer")
      // PingHistory sixth
      expect(children[5].getAttribute("data-testid")).toBe("ping-history")
    })
  })
})
