import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockClaimVictory = vi.fn()
const mockConfirmVictory = vi.fn()
const mockDisputeChallenge = vi.fn()
const mockChannel = vi.fn()
const mockOn = vi.fn(() => ({ subscribe: vi.fn(), on: mockOn }))
const mockRemoveChannel = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    channel: (...args: unknown[]) => {
      mockChannel(...args)
      return { on: mockOn, subscribe: vi.fn() }
    },
    removeChannel: mockRemoveChannel,
  }),
}))

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

vi.mock("@/lib/hooks/use-challenges", () => ({
  useChallenges: () => ({
    activeChallenges: [],
    pendingChallenges: [],
    historyChallenges: [],
    isLoading: false,
    error: null,
    createChallenge: vi.fn(),
    acceptChallenge: vi.fn(),
    declineChallenge: vi.fn(),
    claimVictory: mockClaimVictory,
    confirmVictory: mockConfirmVictory,
    disputeChallenge: mockDisputeChallenge,
    refreshChallenges: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { ChallengeResolveFlow } from "@/components/challenges/ChallengeResolveFlow"

const ACTIVE_CHALLENGE = {
  id: "ch-1",
  creator_id: "user-1",
  title: "Push-up challenge",
  description: null,
  emoji: "💪",
  stakes: 20,
  deadline: null,
  status: "active",
  claimed_by: null,
  winner_id: null,
  actual_transfer: null,
  acceptor_id: "partner-1",
  resolution_note: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

const CLAIMED_BY_ME = {
  ...ACTIVE_CHALLENGE,
  status: "pending_resolution",
  claimed_by: "user-1",
}

const CLAIMED_BY_PARTNER = {
  ...ACTIVE_CHALLENGE,
  status: "pending_resolution",
  claimed_by: "partner-1",
}

const DISPUTED_CHALLENGE = {
  ...ACTIVE_CHALLENGE,
  status: "disputed",
  claimed_by: "partner-1",
  resolution_note: "I actually won this",
}

describe("ChallengeResolveFlow", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onResolved: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockClaimVictory.mockResolvedValue(undefined)
    mockConfirmVictory.mockResolvedValue(undefined)
    mockDisputeChallenge.mockResolvedValue(undefined)
  })

  // ── Unit Tests ──────────────────────────────────────────

  it("renders claim view for active challenge", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={ACTIVE_CHALLENGE} />)
    expect(screen.getByText("Claim Victory")).toBeTruthy()
    expect(screen.getByTestId("claim-victory-btn")).toBeTruthy()
  })

  it("renders waiting view when current user claimed", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={CLAIMED_BY_ME} />)
    expect(screen.getByText("Waiting for Partner")).toBeTruthy()
  })

  it("renders confirm view when partner claimed", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={CLAIMED_BY_PARTNER} />)
    expect(screen.getByText("Confirm Result")).toBeTruthy()
    expect(screen.getByTestId("confirm-victory-btn")).toBeTruthy()
    expect(screen.getByTestId("show-dispute-btn")).toBeTruthy()
  })

  it("shows partner name in confirm message", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={CLAIMED_BY_PARTNER} />)
    expect(screen.getByTestId("confirm-message").textContent).toContain("Yara")
  })

  it("shows payout amount in confirm message", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={CLAIMED_BY_PARTNER} />)
    expect(screen.getByTestId("confirm-message").textContent).toContain("40")
  })

  it("renders disputed view with note", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={DISPUTED_CHALLENGE} />)
    expect(screen.getByText("Challenge Disputed")).toBeTruthy()
    expect(screen.getByTestId("dispute-note")).toBeTruthy()
  })

  it("shows stakes amount", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={ACTIVE_CHALLENGE} />)
    expect(screen.getByTestId("resolve-stakes").textContent).toContain("20")
  })

  it("does not render when open=false", () => {
    render(<ChallengeResolveFlow {...defaultProps} open={false} challenge={ACTIVE_CHALLENGE} />)
    expect(screen.queryByTestId("resolve-flow-dialog")).toBeNull()
  })

  // ── Interaction Tests ───────────────────────────────────

  it("calls claimVictory on I Won click", async () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={ACTIVE_CHALLENGE} />)
    fireEvent.click(screen.getByTestId("claim-victory-btn"))

    await waitFor(() => {
      expect(mockClaimVictory).toHaveBeenCalledWith("ch-1")
    })
  })

  it("calls confirmVictory on Confirm click", async () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={CLAIMED_BY_PARTNER} />)
    fireEvent.click(screen.getByTestId("confirm-victory-btn"))

    await waitFor(() => {
      expect(mockConfirmVictory).toHaveBeenCalledWith("ch-1")
    })
  })

  it("shows dispute input on Dispute click", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={CLAIMED_BY_PARTNER} />)
    fireEvent.click(screen.getByTestId("show-dispute-btn"))

    expect(screen.getByTestId("dispute-reason-input")).toBeTruthy()
    expect(screen.getByTestId("submit-dispute-btn")).toBeTruthy()
  })

  it("calls disputeChallenge with reason on Submit Dispute", async () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={CLAIMED_BY_PARTNER} />)
    fireEvent.click(screen.getByTestId("show-dispute-btn"))

    fireEvent.change(screen.getByTestId("dispute-reason-input"), {
      target: { value: "I don't agree" },
    })
    fireEvent.click(screen.getByTestId("submit-dispute-btn"))

    await waitFor(() => {
      expect(mockDisputeChallenge).toHaveBeenCalledWith("ch-1", "I don't agree")
    })
  })

  it("calls onClose on backdrop click", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={ACTIVE_CHALLENGE} />)
    fireEvent.click(screen.getByTestId("resolve-flow-backdrop"))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  // ── Integration Tests ───────────────────────────────────

  it("calls onResolved after successful confirm", async () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={CLAIMED_BY_PARTNER} />)
    fireEvent.click(screen.getByTestId("confirm-victory-btn"))

    await waitFor(() => {
      expect(defaultProps.onResolved).toHaveBeenCalledWith("partner-1")
    })
  })

  it("subscribes to realtime channel for challenge updates", () => {
    render(<ChallengeResolveFlow {...defaultProps} challenge={ACTIVE_CHALLENGE} />)
    expect(mockChannel).toHaveBeenCalledWith("resolve_ch-1")
  })

  it("cleans up realtime channel on unmount", () => {
    const { unmount } = render(
      <ChallengeResolveFlow {...defaultProps} challenge={ACTIVE_CHALLENGE} />
    )
    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })
})
