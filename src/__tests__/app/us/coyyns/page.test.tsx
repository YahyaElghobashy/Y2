import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockRefreshChallenges = vi.fn()
const mockRefreshBounties = vi.fn()
const mockClaimBounty = vi.fn()

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
    activeChallenges: [
      {
        id: "ch-1",
        creator_id: "user-1",
        title: "Push-ups",
        emoji: "💪",
        stakes: 10,
        status: "active",
        claimed_by: null,
        winner_id: null,
        acceptor_id: "partner-1",
        description: null,
        deadline: null,
        actual_transfer: null,
        resolution_note: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    pendingChallenges: [
      {
        id: "ch-2",
        creator_id: "partner-1",
        title: "Read a book",
        emoji: "📚",
        stakes: 20,
        status: "pending_acceptance",
        claimed_by: null,
        winner_id: null,
        acceptor_id: null,
        description: null,
        deadline: null,
        actual_transfer: null,
        resolution_note: null,
        created_at: "2026-01-02",
        updated_at: "2026-01-02",
      },
    ],
    historyChallenges: [
      {
        id: "ch-3",
        creator_id: "user-1",
        title: "Old one",
        emoji: null,
        stakes: 5,
        status: "resolved",
        claimed_by: "user-1",
        winner_id: "user-1",
        acceptor_id: "partner-1",
        actual_transfer: 10,
        description: null,
        deadline: null,
        resolution_note: null,
        created_at: "2025-12-01",
        updated_at: "2025-12-15",
      },
    ],
    isLoading: false,
    error: null,
    createChallenge: vi.fn(),
    acceptChallenge: vi.fn(),
    declineChallenge: vi.fn(),
    claimVictory: vi.fn(),
    confirmVictory: vi.fn(),
    disputeChallenge: vi.fn(),
    refreshChallenges: mockRefreshChallenges,
  }),
}))

vi.mock("@/lib/hooks/use-bounties", () => ({
  useBounties: () => ({
    activeBounties: [
      {
        id: "b-1",
        creator_id: "partner-1",
        title: "Cook dinner",
        trigger_description: "Make a full meal",
        reward: 15,
        is_recurring: true,
        is_active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    pendingClaims: [],
    isLoading: false,
    error: null,
    createBounty: vi.fn(),
    claimBounty: mockClaimBounty,
    confirmClaim: vi.fn(),
    denyClaim: vi.fn(),
    refreshBounties: mockRefreshBounties,
  }),
}))

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

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null })),
          data: [],
          error: null,
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import CoyynsTabPage from "@/app/(main)/us/coyyns/page"

describe("CoyynsTabPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────

  it("renders challenges section", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByTestId("challenges-section")).toBeTruthy()
    expect(screen.getByText("Challenges")).toBeTruthy()
  })

  it("renders bounties section", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByTestId("bounties-section")).toBeTruthy()
    expect(screen.getByText("Bounties")).toBeTruthy()
  })

  it("renders new challenge button", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByTestId("new-challenge-btn")).toBeTruthy()
  })

  it("renders new bounty button", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByTestId("new-bounty-btn")).toBeTruthy()
  })

  it("renders pending challenges", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByTestId("pending-challenges")).toBeTruthy()
  })

  it("renders active challenges", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByTestId("active-challenges")).toBeTruthy()
  })

  it("renders active bounties", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByTestId("active-bounties")).toBeTruthy()
  })

  it("renders history section when history exists", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByTestId("history-section")).toBeTruthy()
  })

  it("renders history toggle button", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByTestId("history-toggle")).toBeTruthy()
  })

  // ── Interaction Tests ───────────────────────────────────

  it("opens create challenge form on New button click", () => {
    render(<CoyynsTabPage />)
    fireEvent.click(screen.getByTestId("new-challenge-btn"))
    // The CreateChallengeForm should be rendered (it's a portal)
    // We can verify it opened by checking for the form sheet
    expect(document.querySelector("[data-testid='challenge-form-dialog']")).toBeTruthy()
  })

  it("opens create bounty form on New button click", () => {
    render(<CoyynsTabPage />)
    fireEvent.click(screen.getByTestId("new-bounty-btn"))
    expect(document.querySelector("[data-testid='bounty-form-sheet']")).toBeTruthy()
  })

  it("shows history list on toggle click", () => {
    render(<CoyynsTabPage />)
    fireEvent.click(screen.getByTestId("history-toggle"))
    expect(screen.getByTestId("history-list")).toBeTruthy()
  })

  it("opens accept flow when clicking on pending challenge", () => {
    render(<CoyynsTabPage />)
    // Find the Accept button within the pending challenge card
    const acceptBtns = screen.getAllByText("Accept")
    fireEvent.click(acceptBtns[0])
    expect(document.querySelector("[data-testid='accept-flow-dialog']")).toBeTruthy()
  })

  it("opens resolve flow when clicking on active challenge", () => {
    render(<CoyynsTabPage />)
    const wrappers = screen.getAllByTestId("challenge-card-wrapper")
    fireEvent.click(wrappers[0])
    expect(document.querySelector("[data-testid='resolve-flow-dialog']")).toBeTruthy()
  })

  // ── Integration Tests ─────────────────────────────────

  it("shows challenge card with correct title", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByText(/Push-ups/)).toBeTruthy()
    expect(screen.getByText(/Read a book/)).toBeTruthy()
  })

  it("shows bounty card with correct title", () => {
    render(<CoyynsTabPage />)
    expect(screen.getByText("Cook dinner")).toBeTruthy()
  })

  it("history is collapsed by default", () => {
    render(<CoyynsTabPage />)
    expect(screen.queryByTestId("history-list")).toBeNull()
  })
})
