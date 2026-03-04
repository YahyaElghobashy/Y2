import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockConfirmClaim = vi.fn()
const mockDenyClaim = vi.fn()

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@test.com" },
    partner: { id: "partner-1", display_name: "Yara" },
    profile: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

vi.mock("@/lib/hooks/use-bounties", () => ({
  useBounties: () => ({
    activeBounties: [],
    pendingClaims: [],
    isLoading: false,
    error: null,
    createBounty: vi.fn(),
    claimBounty: vi.fn(),
    confirmClaim: mockConfirmClaim,
    denyClaim: mockDenyClaim,
    refreshBounties: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { BountyClaimFlow } from "@/components/bounties/BountyClaimFlow"

const BOUNTY = {
  id: "b-1",
  creator_id: "user-1",
  title: "Cook dinner",
  trigger_description: "Cook a full dinner for two",
  reward: 15,
  is_recurring: true,
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

const CLAIM = {
  id: "cl-1",
  bounty_id: "b-1",
  claimer_id: "partner-1",
  confirmed_by: null,
  status: "pending" as const,
  created_at: "2026-01-05",
  updated_at: "2026-01-05",
}

describe("BountyClaimFlow", () => {
  const defaultProps = {
    bounty: BOUNTY,
    claim: CLAIM,
    open: true,
    onClose: vi.fn(),
    onConfirmed: vi.fn(),
    onDenied: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirmClaim.mockResolvedValue(undefined)
    mockDenyClaim.mockResolvedValue(undefined)
  })

  // ── Unit Tests ──────────────────────────────────────────

  it("renders dialog when open", () => {
    render(<BountyClaimFlow {...defaultProps} />)
    expect(screen.getByTestId("claim-flow-dialog")).toBeTruthy()
  })

  it("does not render when open=false", () => {
    render(<BountyClaimFlow {...defaultProps} open={false} />)
    expect(screen.queryByTestId("claim-flow-dialog")).toBeNull()
  })

  it("shows bounty title", () => {
    render(<BountyClaimFlow {...defaultProps} />)
    expect(screen.getByTestId("claim-bounty-title").textContent).toBe("Cook dinner")
  })

  it("shows reward amount", () => {
    render(<BountyClaimFlow {...defaultProps} />)
    expect(screen.getByTestId("claim-reward").textContent).toContain("15")
  })

  it("shows Review Claim title for creator", () => {
    render(<BountyClaimFlow {...defaultProps} />)
    expect(screen.getByText("Review Claim")).toBeTruthy()
  })

  it("shows confirm and deny buttons for creator", () => {
    render(<BountyClaimFlow {...defaultProps} />)
    expect(screen.getByTestId("confirm-claim-btn")).toBeTruthy()
    expect(screen.getByTestId("deny-claim-btn")).toBeTruthy()
  })

  it("shows review message for creator", () => {
    render(<BountyClaimFlow {...defaultProps} />)
    expect(screen.getByTestId("claim-review-message")).toBeTruthy()
    expect(screen.getByTestId("claim-review-message").textContent).toContain("15")
  })

  it("shows Claim Submitted title for claimer", () => {
    // Set user as claimer (partner-1)
    const claimerClaim = { ...CLAIM, claimer_id: "user-1" }
    const claimerBounty = { ...BOUNTY, creator_id: "partner-1" }
    render(<BountyClaimFlow {...defaultProps} bounty={claimerBounty} claim={claimerClaim} />)
    expect(screen.getByText("Claim Submitted")).toBeTruthy()
  })

  it("shows waiting message for claimer", () => {
    const claimerClaim = { ...CLAIM, claimer_id: "user-1" }
    const claimerBounty = { ...BOUNTY, creator_id: "partner-1" }
    render(<BountyClaimFlow {...defaultProps} bounty={claimerBounty} claim={claimerClaim} />)
    expect(screen.getByTestId("claim-waiting-message")).toBeTruthy()
  })

  it("does not show action buttons for claimer", () => {
    const claimerClaim = { ...CLAIM, claimer_id: "user-1" }
    const claimerBounty = { ...BOUNTY, creator_id: "partner-1" }
    render(<BountyClaimFlow {...defaultProps} bounty={claimerBounty} claim={claimerClaim} />)
    expect(screen.queryByTestId("confirm-claim-btn")).toBeNull()
    expect(screen.queryByTestId("deny-claim-btn")).toBeNull()
  })

  // ── Interaction Tests ───────────────────────────────────

  it("calls confirmClaim on Confirm click", async () => {
    render(<BountyClaimFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("confirm-claim-btn"))

    await waitFor(() => {
      expect(mockConfirmClaim).toHaveBeenCalledWith("cl-1")
    })
  })

  it("calls denyClaim on Deny click", async () => {
    render(<BountyClaimFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("deny-claim-btn"))

    await waitFor(() => {
      expect(mockDenyClaim).toHaveBeenCalledWith("cl-1")
    })
  })

  it("calls onClose on backdrop click", () => {
    render(<BountyClaimFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("claim-flow-backdrop"))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  // ── Integration Tests ─────────────────────────────────

  it("calls onConfirmed and onClose after successful confirm", async () => {
    render(<BountyClaimFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("confirm-claim-btn"))

    await waitFor(() => {
      expect(defaultProps.onConfirmed).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it("calls onDenied and onClose after successful deny", async () => {
    render(<BountyClaimFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("deny-claim-btn"))

    await waitFor(() => {
      expect(defaultProps.onDenied).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })
})
