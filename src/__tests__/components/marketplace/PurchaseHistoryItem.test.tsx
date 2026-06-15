import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { PurchaseHistoryItem } from "@/components/marketplace/PurchaseHistoryItem"
import type { PurchaseHistoryEntry } from "@/lib/hooks/use-purchase-history"

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const safe = Object.fromEntries(
        Object.entries(props).filter(
          ([k]) => !["initial", "animate", "transition", "exit"].includes(k)
        )
      )
      return <div {...safe}>{children as React.ReactNode}</div>
    },
  },
}))

const mockUser = { id: "user-1", email: "u@test.com" }

function makeEntry(overrides: Partial<PurchaseHistoryEntry> = {}): PurchaseHistoryEntry {
  return {
    id: "h-1",
    buyer_id: "user-1",
    target_id: "partner-1",
    item_id: "item-1",
    cost: 40,
    status: "completed",
    effect_payload: null,
    created_at: "2026-06-01T10:00:00Z",
    completed_at: "2026-06-02T10:00:00Z",
    marketplace_items: {
      id: "item-1",
      name: "Breakfast in Bed",
      description: "Make breakfast",
      price: 40,
      icon: "🍳",
      effect_type: "task_order",
      effect_config: {},
      is_active: true,
      sort_order: 3,
      created_at: "",
    },
    ...overrides,
  } as PurchaseHistoryEntry
}

describe("PurchaseHistoryItem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: mockUser,
      partner: { id: "partner-1", display_name: "Yara" },
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })
  })

  // ── Unit ──────────────────────────────────────────────

  it("renders the item name and icon", () => {
    render(<PurchaseHistoryItem purchase={makeEntry()} />)
    expect(screen.getByText("Breakfast in Bed")).toBeInTheDocument()
    expect(screen.getByText("🍳")).toBeInTheDocument()
  })

  it("shows 'You sent' when the current user is the buyer", () => {
    render(<PurchaseHistoryItem purchase={makeEntry()} />)
    expect(screen.getByText(/You sent/)).toBeInTheDocument()
  })

  it("shows 'From your partner' when the current user is the target", () => {
    render(
      <PurchaseHistoryItem
        purchase={makeEntry({ buyer_id: "partner-1", target_id: "user-1" })}
      />
    )
    expect(screen.getByText(/From your partner/)).toBeInTheDocument()
  })

  it("renders a Completed status badge", () => {
    render(<PurchaseHistoryItem purchase={makeEntry()} />)
    const badge = screen.getByTestId("history-status-badge")
    expect(badge).toHaveTextContent("Completed")
  })

  it("renders a Declined status badge for declined purchases", () => {
    render(<PurchaseHistoryItem purchase={makeEntry({ status: "declined" })} />)
    const badge = screen.getByTestId("history-status-badge")
    expect(badge).toHaveTextContent("Declined")
  })

  it("exposes the status via data attribute", () => {
    render(<PurchaseHistoryItem purchase={makeEntry({ status: "expired" })} />)
    expect(screen.getByTestId("purchase-history-item")).toHaveAttribute(
      "data-status",
      "expired"
    )
  })
})
