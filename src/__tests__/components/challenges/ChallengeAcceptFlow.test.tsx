import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockAcceptChallenge = vi.fn()
const mockDeclineChallenge = vi.fn()

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns: () => ({
    wallet: { balance: 100 },
    partnerWallet: null,
    transactions: [],
    isLoading: false,
    error: null,
    addCoyyns: vi.fn(),
    spendCoyyns: vi.fn(),
    refreshWallet: vi.fn(),
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
    acceptChallenge: mockAcceptChallenge,
    declineChallenge: mockDeclineChallenge,
    claimVictory: vi.fn(),
    confirmVictory: vi.fn(),
    disputeChallenge: vi.fn(),
    refreshChallenges: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { ChallengeAcceptFlow } from "@/components/challenges/ChallengeAcceptFlow"

const CHALLENGE = {
  id: "ch-1",
  creator_id: "partner-1",
  title: "Push-up challenge",
  description: "Who can do 100 push-ups first?",
  emoji: "💪",
  stakes: 20,
  deadline: null,
  status: "pending_acceptance",
  claimed_by: null,
  winner_id: null,
  actual_transfer: null,
  acceptor_id: null,
  resolution_note: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

describe("ChallengeAcceptFlow", () => {
  const defaultProps = {
    challenge: CHALLENGE,
    open: true,
    onClose: vi.fn(),
    onAccepted: vi.fn(),
    onDeclined: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAcceptChallenge.mockResolvedValue(undefined)
    mockDeclineChallenge.mockResolvedValue(undefined)
  })

  // ── Unit Tests ──────────────────────────────────────────

  it("renders dialog when open", () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    expect(screen.getByTestId("accept-flow-dialog")).toBeTruthy()
  })

  it("does not render when open=false", () => {
    render(<ChallengeAcceptFlow {...defaultProps} open={false} />)
    expect(screen.queryByTestId("accept-flow-dialog")).toBeNull()
  })

  it("shows challenge title and emoji", () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    expect(screen.getByText(/💪 Push-up challenge/)).toBeTruthy()
  })

  it("shows challenge description", () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    expect(screen.getByText(/Who can do 100 push-ups first/)).toBeTruthy()
  })

  it("shows stake amount in balance breakdown", () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    expect(screen.getByTestId("accept-balance-breakdown")).toBeTruthy()
  })

  it("shows after balance", () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    // balance=100, stakes=20, after=80
    expect(screen.getByTestId("accept-after-balance").textContent).toContain("80")
  })

  it("disables Accept when insufficient balance", () => {
    const expensiveChallenge = { ...CHALLENGE, stakes: 200 }
    render(<ChallengeAcceptFlow {...defaultProps} challenge={expensiveChallenge} />)

    const acceptBtn = screen.getByTestId("accept-challenge-btn")
    expect(acceptBtn.hasAttribute("disabled")).toBe(true)
    expect(screen.getByTestId("insufficient-funds-warning")).toBeTruthy()
  })

  it("does not show insufficient warning when balance is enough", () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    expect(screen.queryByTestId("insufficient-funds-warning")).toBeNull()
  })

  // ── Interaction Tests ───────────────────────────────────

  it("calls acceptChallenge on Accept click", async () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("accept-challenge-btn"))

    await waitFor(() => {
      expect(mockAcceptChallenge).toHaveBeenCalledWith("ch-1")
    })
  })

  it("calls onAccepted after successful accept", async () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("accept-challenge-btn"))

    await waitFor(() => {
      expect(defaultProps.onAccepted).toHaveBeenCalled()
    })
  })

  it("shows decline confirmation on Decline click", () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("decline-challenge-btn"))

    expect(screen.getByText("Decline Challenge?")).toBeTruthy()
    expect(screen.getByTestId("confirm-decline-btn")).toBeTruthy()
  })

  it("calls declineChallenge after decline confirmation", async () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("decline-challenge-btn"))
    fireEvent.click(screen.getByTestId("confirm-decline-btn"))

    await waitFor(() => {
      expect(mockDeclineChallenge).toHaveBeenCalledWith("ch-1")
    })
  })

  it("goes back from decline confirm to main view", () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("decline-challenge-btn"))
    fireEvent.click(screen.getByTestId("cancel-decline-btn"))

    expect(screen.getByText("Accept Challenge?")).toBeTruthy()
  })

  it("calls onClose on backdrop click", () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("accept-flow-backdrop"))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  // ── Integration Tests ───────────────────────────────────

  it("calls onDeclined after successful decline", async () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("decline-challenge-btn"))
    fireEvent.click(screen.getByTestId("confirm-decline-btn"))

    await waitFor(() => {
      expect(defaultProps.onDeclined).toHaveBeenCalled()
    })
  })

  it("calls onClose after successful accept", async () => {
    render(<ChallengeAcceptFlow {...defaultProps} />)
    fireEvent.click(screen.getByTestId("accept-challenge-btn"))

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })
})
