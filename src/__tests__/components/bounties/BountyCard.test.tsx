import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockUseAuth = vi.fn()

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { BountyCard } from "@/components/bounties/BountyCard"

const BOUNTY = {
  id: "b-1",
  creator_id: "partner-1",
  title: "Cook dinner",
  trigger_description: "Cook a full dinner for two",
  reward: 15,
  is_recurring: true,
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

const PENDING_CLAIM = {
  id: "cl-1",
  bounty_id: "b-1",
  claimer_id: "user-1",
  confirmed_by: null,
  status: "pending" as const,
  created_at: "2026-01-05",
  updated_at: "2026-01-05",
}

describe("BountyCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: "user-1" },
      partner: { id: "partner-1" },
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })
  })

  // ── Unit Tests ──────────────────────────────────────────

  it("renders bounty title", () => {
    render(<BountyCard bounty={BOUNTY} />)
    expect(screen.getByTestId("bounty-title").textContent).toBe("Cook dinner")
  })

  it("renders trigger description", () => {
    render(<BountyCard bounty={BOUNTY} />)
    expect(screen.getByTestId("bounty-trigger").textContent).toContain("Cook a full dinner")
  })

  it("renders reward amount", () => {
    render(<BountyCard bounty={BOUNTY} />)
    expect(screen.getByTestId("bounty-reward").textContent).toContain("15")
  })

  it("shows recurring badge when is_recurring", () => {
    render(<BountyCard bounty={BOUNTY} />)
    expect(screen.getByTestId("recurring-badge")).toBeTruthy()
  })

  it("does not show recurring badge when not recurring", () => {
    render(<BountyCard bounty={{ ...BOUNTY, is_recurring: false }} />)
    expect(screen.queryByTestId("recurring-badge")).toBeNull()
  })

  it("shows claim pending badge when there is a pending claim", () => {
    render(<BountyCard bounty={BOUNTY} pendingClaim={PENDING_CLAIM} />)
    expect(screen.getByTestId("claim-pending-badge")).toBeTruthy()
  })

  it("does not show claim pending badge when no pending claim", () => {
    render(<BountyCard bounty={BOUNTY} />)
    expect(screen.queryByTestId("claim-pending-badge")).toBeNull()
  })

  it("shows I did it button for non-creator with no pending claim", () => {
    render(<BountyCard bounty={BOUNTY} />)
    expect(screen.getByTestId("claim-bounty-btn")).toBeTruthy()
    expect(screen.getByText("I did it!")).toBeTruthy()
  })

  it("hides I did it button for creator", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "partner-1" }, // Same as creator
      partner: { id: "user-1" },
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })
    render(<BountyCard bounty={BOUNTY} />)
    expect(screen.queryByTestId("claim-bounty-btn")).toBeNull()
  })

  it("hides I did it button when there is a pending claim", () => {
    render(<BountyCard bounty={BOUNTY} pendingClaim={PENDING_CLAIM} />)
    expect(screen.queryByTestId("claim-bounty-btn")).toBeNull()
  })

  // ── Interaction Tests ───────────────────────────────────

  it("calls onClaim with bounty id when I did it is clicked", () => {
    const onClaim = vi.fn()
    render(<BountyCard bounty={BOUNTY} onClaim={onClaim} />)
    fireEvent.click(screen.getByTestId("claim-bounty-btn"))
    expect(onClaim).toHaveBeenCalledWith("b-1")
  })

  // ── Integration Tests ─────────────────────────────────

  it("renders card container", () => {
    render(<BountyCard bounty={BOUNTY} />)
    expect(screen.getByTestId("bounty-card")).toBeTruthy()
  })

  it("shows both recurring and claim pending badges together", () => {
    render(<BountyCard bounty={BOUNTY} pendingClaim={PENDING_CLAIM} />)
    expect(screen.getByTestId("recurring-badge")).toBeTruthy()
    expect(screen.getByTestId("claim-pending-badge")).toBeTruthy()
  })
})
