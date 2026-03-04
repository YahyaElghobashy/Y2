import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockCreateBounty = vi.fn()

vi.mock("@/lib/hooks/use-bounties", () => ({
  useBounties: () => ({
    activeBounties: [],
    pendingClaims: [],
    isLoading: false,
    error: null,
    createBounty: mockCreateBounty,
    claimBounty: vi.fn(),
    confirmClaim: vi.fn(),
    denyClaim: vi.fn(),
    refreshBounties: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { CreateBountyForm } from "@/components/bounties/CreateBountyForm"

describe("CreateBountyForm", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onCreated: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateBounty.mockResolvedValue(undefined)
  })

  // ── Unit Tests ──────────────────────────────────────────

  it("renders bottom sheet when open", () => {
    render(<CreateBountyForm {...defaultProps} />)
    expect(screen.getByTestId("bounty-form-sheet")).toBeTruthy()
  })

  it("does not render when open=false", () => {
    render(<CreateBountyForm {...defaultProps} open={false} />)
    expect(screen.queryByTestId("bounty-form-sheet")).toBeNull()
  })

  it("shows form title", () => {
    render(<CreateBountyForm {...defaultProps} />)
    const titles = screen.getAllByText("Create Bounty")
    expect(titles.length).toBeGreaterThanOrEqual(1)
  })

  it("shows title input", () => {
    render(<CreateBountyForm {...defaultProps} />)
    expect(screen.getByTestId("bounty-title-input")).toBeTruthy()
  })

  it("shows description input", () => {
    render(<CreateBountyForm {...defaultProps} />)
    expect(screen.getByTestId("bounty-description-input")).toBeTruthy()
  })

  it("shows reward stepper with default value 10", () => {
    render(<CreateBountyForm {...defaultProps} />)
    expect(screen.getByTestId("reward-stepper")).toBeTruthy()
    expect(screen.getByTestId("reward-value").textContent).toBe("10")
  })

  it("shows recurring toggle", () => {
    render(<CreateBountyForm {...defaultProps} />)
    expect(screen.getByTestId("recurring-toggle")).toBeTruthy()
  })

  it("shows submit button", () => {
    render(<CreateBountyForm {...defaultProps} />)
    expect(screen.getByTestId("submit-bounty-btn")).toBeTruthy()
  })

  // ── Interaction Tests ───────────────────────────────────

  it("increments reward by 5 on plus click", () => {
    render(<CreateBountyForm {...defaultProps} />)
    fireEvent.click(screen.getByTestId("reward-plus"))
    expect(screen.getByTestId("reward-value").textContent).toBe("15")
  })

  it("decrements reward by 5 on minus click", () => {
    render(<CreateBountyForm {...defaultProps} />)
    fireEvent.click(screen.getByTestId("reward-minus"))
    expect(screen.getByTestId("reward-value").textContent).toBe("5")
  })

  it("does not go below 1", () => {
    render(<CreateBountyForm {...defaultProps} />)
    // Default is 10, click minus twice → 5 → 1 (clamped)
    fireEvent.click(screen.getByTestId("reward-minus"))
    fireEvent.click(screen.getByTestId("reward-minus"))
    expect(Number(screen.getByTestId("reward-value").textContent)).toBeGreaterThanOrEqual(1)
  })

  it("toggles recurring switch", () => {
    render(<CreateBountyForm {...defaultProps} />)
    const toggle = screen.getByTestId("recurring-toggle")
    expect(toggle.getAttribute("aria-checked")).toBe("false")
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-checked")).toBe("true")
  })

  it("shows validation errors for empty required fields", async () => {
    render(<CreateBountyForm {...defaultProps} />)
    fireEvent.click(screen.getByTestId("submit-bounty-btn"))

    await waitFor(() => {
      expect(screen.getByTestId("title-error")).toBeTruthy()
      expect(screen.getByTestId("description-error")).toBeTruthy()
    })
  })

  it("calls createBounty with correct payload on valid submit", async () => {
    render(<CreateBountyForm {...defaultProps} />)

    fireEvent.change(screen.getByTestId("bounty-title-input"), {
      target: { value: "Cook dinner" },
    })
    fireEvent.change(screen.getByTestId("bounty-description-input"), {
      target: { value: "Make a full meal" },
    })
    fireEvent.click(screen.getByTestId("recurring-toggle"))
    fireEvent.click(screen.getByTestId("submit-bounty-btn"))

    await waitFor(() => {
      expect(mockCreateBounty).toHaveBeenCalledWith({
        title: "Cook dinner",
        trigger_description: "Make a full meal",
        reward: 10,
        is_recurring: true,
      })
    })
  })

  it("calls onClose on backdrop click", () => {
    render(<CreateBountyForm {...defaultProps} />)
    fireEvent.click(screen.getByTestId("bounty-form-backdrop"))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it("calls onClose on close button click", () => {
    render(<CreateBountyForm {...defaultProps} />)
    fireEvent.click(screen.getByTestId("bounty-form-close"))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  // ── Integration Tests ─────────────────────────────────

  it("calls onCreated and onClose after successful submit", async () => {
    render(<CreateBountyForm {...defaultProps} />)

    fireEvent.change(screen.getByTestId("bounty-title-input"), {
      target: { value: "Test bounty" },
    })
    fireEvent.change(screen.getByTestId("bounty-description-input"), {
      target: { value: "Test description" },
    })
    fireEvent.click(screen.getByTestId("submit-bounty-btn"))

    await waitFor(() => {
      expect(defaultProps.onCreated).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })
})
