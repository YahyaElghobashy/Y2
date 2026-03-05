import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ActivePurchaseCard } from "@/components/marketplace/ActivePurchaseCard"
import type { ActivePurchaseWithItem } from "@/lib/hooks/use-active-purchases"

// ── Mocks ──────────────────────────────────────────────

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))
vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const safeProps = Object.fromEntries(
        Object.entries(props).filter(
          ([k]) => !["initial", "animate", "transition", "whileHover", "whileTap", "exit", "layout"].includes(k)
        )
      )
      return <div {...safeProps}>{children as React.ReactNode}</div>
    },
  },
}))

// ── Helpers ────────────────────────────────────────────

const mockUser = { id: "user-target", email: "target@test.com" }

const mockOnAcknowledge = vi.fn()
const mockOnComplete = vi.fn()
const mockOnDecline = vi.fn()

function makePurchase(
  effectType: string,
  overrides: Partial<ActivePurchaseWithItem> = {},
  itemOverrides: Record<string, unknown> = {}
): ActivePurchaseWithItem {
  return {
    id: "purchase-1",
    buyer_id: "user-buyer",
    target_id: mockUser.id,
    item_id: "item-1",
    status: "pending",
    effect_payload: null,
    created_at: new Date().toISOString(),
    completed_at: null,
    marketplace_items: {
      id: "item-1",
      name: `Test ${effectType} Item`,
      description: "A test item",
      price: 50,
      effect_type: effectType,
      effect_config: {},
      category: "fun",
      is_active: true,
      created_at: new Date().toISOString(),
      ...itemOverrides,
    },
    ...overrides,
  } as ActivePurchaseWithItem
}

function renderCard(purchase: ActivePurchaseWithItem) {
  return render(
    <ActivePurchaseCard
      purchase={purchase}
      onAcknowledge={mockOnAcknowledge}
      onComplete={mockOnComplete}
      onDecline={mockOnDecline}
    />
  )
}

// ── Tests ──────────────────────────────────────────────

describe("ActivePurchaseCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: mockUser,
      profile: { id: mockUser.id, display_name: "Target" },
      partner: null,
      isLoading: false,
      refreshProfile: vi.fn(),
      signOut: vi.fn(),
      profileNeedsSetup: false,
    })
  })

  // ── Unit ────────────────────────────────────────────

  describe("unit", () => {
    it("renders item name and 'From your partner' for target user", () => {
      const purchase = makePurchase("task_order")
      renderCard(purchase)

      expect(screen.getByText("Test task_order Item")).toBeInTheDocument()
      expect(screen.getByText("From your partner")).toBeInTheDocument()
    })

    it("renders 'You sent this' when user is buyer", () => {
      useAuth.mockReturnValue({
        user: { id: "user-buyer", email: "buyer@test.com" },
        profile: { id: "user-buyer", display_name: "Buyer" },
        partner: null,
        isLoading: false,
        refreshProfile: vi.fn(),
        signOut: vi.fn(),
        profileNeedsSetup: false,
      })

      const purchase = makePurchase("task_order")
      renderCard(purchase)

      expect(screen.getByText("You sent this")).toBeInTheDocument()
    })

    it("shows 'New' badge for pending status", () => {
      const purchase = makePurchase("task_order", { status: "pending" })
      renderCard(purchase)

      expect(screen.getByText("New")).toBeInTheDocument()
    })

    it("shows 'Active' badge for active status", () => {
      const purchase = makePurchase("task_order", { status: "active" })
      renderCard(purchase)

      expect(screen.getByText("Active")).toBeInTheDocument()
    })

    it("renders task description for task_order effect", () => {
      const purchase = makePurchase("task_order", {}, {
        effect_config: { task_description: "Clean the kitchen" },
      })
      renderCard(purchase)

      expect(screen.getByText("Clean the kitchen")).toBeInTheDocument()
    })

    it("renders deadline for task_order with deadline_hours", () => {
      const purchase = makePurchase("task_order", {}, {
        effect_config: { task_description: "Do X", deadline_hours: 4 },
      })
      renderCard(purchase)

      expect(screen.getByText("4h deadline")).toBeInTheDocument()
    })

    it("renders veto content from payload", () => {
      const purchase = makePurchase("veto", {
        effect_payload: { movie: "Inception" },
      })
      renderCard(purchase)

      expect(screen.getByText("Inception")).toBeInTheDocument()
    })

    it("renders wildcard content from payload", () => {
      const purchase = makePurchase("wildcard", {
        effect_payload: { input: "Make me coffee please" },
      })
      renderCard(purchase)

      expect(screen.getByText("Make me coffee please")).toBeInTheDocument()
    })

    it("renders extra_ping message", () => {
      const purchase = makePurchase("extra_ping")
      renderCard(purchase)

      expect(screen.getByText("Bonus pings activated for today!")).toBeInTheDocument()
    })

    it("renders DND countdown for dnd_timer effect", () => {
      const purchase = makePurchase("dnd_timer", {}, {
        effect_config: { duration_minutes: 30 },
      })
      renderCard(purchase)

      expect(screen.getByTestId("dnd-countdown")).toBeInTheDocument()
    })

    it("sets data-effect-type attribute", () => {
      const purchase = makePurchase("wildcard")
      renderCard(purchase)

      expect(screen.getByTestId("active-purchase-card")).toHaveAttribute(
        "data-effect-type",
        "wildcard"
      )
    })
  })

  // ── Interaction ─────────────────────────────────────

  describe("interaction", () => {
    it("acknowledge button calls onAcknowledge with purchase id", () => {
      const purchase = makePurchase("task_order", { status: "pending" })
      renderCard(purchase)

      fireEvent.click(screen.getByTestId("acknowledge-btn"))
      expect(mockOnAcknowledge).toHaveBeenCalledWith("purchase-1")
    })

    it("veto shows 'Got it' text on acknowledge button", () => {
      const purchase = makePurchase("veto", {
        status: "pending",
        effect_payload: { movie: "Test" },
      })
      renderCard(purchase)

      const btn = screen.getByTestId("acknowledge-btn")
      expect(btn).toHaveTextContent("Got it")
      fireEvent.click(btn)
      expect(mockOnAcknowledge).toHaveBeenCalledWith("purchase-1")
    })

    it("wildcard shows accept and decline buttons", () => {
      const purchase = makePurchase("wildcard", {
        status: "pending",
        effect_payload: { input: "Something" },
      })
      renderCard(purchase)

      expect(screen.getByTestId("accept-btn")).toBeInTheDocument()
      expect(screen.getByTestId("decline-btn")).toBeInTheDocument()
    })

    it("accept button calls onAcknowledge for wildcard", () => {
      const purchase = makePurchase("wildcard", {
        status: "pending",
        effect_payload: { input: "Something" },
      })
      renderCard(purchase)

      fireEvent.click(screen.getByTestId("accept-btn"))
      expect(mockOnAcknowledge).toHaveBeenCalledWith("purchase-1")
    })

    it("decline button calls onDecline for wildcard", () => {
      const purchase = makePurchase("wildcard", {
        status: "pending",
        effect_payload: { input: "Something" },
      })
      renderCard(purchase)

      fireEvent.click(screen.getByTestId("decline-btn"))
      expect(mockOnDecline).toHaveBeenCalledWith("purchase-1")
    })

    it("complete button calls onComplete for active task_order", () => {
      const purchase = makePurchase("task_order", { status: "active" })
      renderCard(purchase)

      fireEvent.click(screen.getByTestId("complete-btn"))
      expect(mockOnComplete).toHaveBeenCalledWith("purchase-1")
    })

    it("dismiss button calls onAcknowledge for dnd_timer", () => {
      const purchase = makePurchase("dnd_timer", { status: "pending" }, {
        effect_config: { duration_minutes: 30 },
      })
      renderCard(purchase)

      fireEvent.click(screen.getByTestId("dismiss-btn"))
      expect(mockOnAcknowledge).toHaveBeenCalledWith("purchase-1")
    })

    it("dismiss button calls onAcknowledge for extra_ping", () => {
      const purchase = makePurchase("extra_ping", { status: "pending" })
      renderCard(purchase)

      fireEvent.click(screen.getByTestId("dismiss-btn"))
      expect(mockOnAcknowledge).toHaveBeenCalledWith("purchase-1")
    })

    it("hides action buttons when user is buyer (not target)", () => {
      useAuth.mockReturnValue({
        user: { id: "user-buyer", email: "buyer@test.com" },
        profile: { id: "user-buyer", display_name: "Buyer" },
        partner: null,
        isLoading: false,
        refreshProfile: vi.fn(),
        signOut: vi.fn(),
        profileNeedsSetup: false,
      })

      const purchase = makePurchase("task_order", { status: "pending" })
      renderCard(purchase)

      expect(screen.queryByTestId("acknowledge-btn")).not.toBeInTheDocument()
      expect(screen.queryByTestId("complete-btn")).not.toBeInTheDocument()
    })
  })

  // ── Integration ─────────────────────────────────────

  describe("integration", () => {
    it("passes correct purchase id to all callbacks", () => {
      const purchase = makePurchase("wildcard", {
        id: "custom-id",
        status: "pending",
        effect_payload: { input: "Test" },
      })
      renderCard(purchase)

      fireEvent.click(screen.getByTestId("accept-btn"))
      expect(mockOnAcknowledge).toHaveBeenCalledWith("custom-id")

      fireEvent.click(screen.getByTestId("decline-btn"))
      expect(mockOnDecline).toHaveBeenCalledWith("custom-id")
    })

    it("renders correct effect_config values from marketplace_items", () => {
      const purchase = makePurchase("task_order", {}, {
        effect_config: { task_description: "Specific task", deadline_hours: 8 },
      })
      renderCard(purchase)

      expect(screen.getByText("Specific task")).toBeInTheDocument()
      expect(screen.getByText("8h deadline")).toBeInTheDocument()
    })

    it("renders effect_payload values for veto type", () => {
      const purchase = makePurchase("veto", {
        effect_payload: { movie: "The Notebook" },
      })
      renderCard(purchase)

      expect(screen.getByText("The Notebook")).toBeInTheDocument()
    })

    it("renders effect_payload input for wildcard type", () => {
      const purchase = makePurchase("wildcard", {
        effect_payload: { input: "Bake a cake" },
      })
      renderCard(purchase)

      expect(screen.getByText("Bake a cake")).toBeInTheDocument()
    })
  })
})
