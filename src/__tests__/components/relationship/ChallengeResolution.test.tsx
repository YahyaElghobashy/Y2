import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockUpdate = vi.fn()
const mockEq = vi.fn(() => ({ eq: vi.fn() }))
const mockSpendCoyyns = vi.fn()
const mockChannel = vi.fn()
const mockSubscribe = vi.fn()
const mockOn = vi.fn(() => ({ subscribe: mockSubscribe, on: mockOn }))
const mockRemoveChannel = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args)
        return { eq: (...eqArgs: unknown[]) => {
          mockEq(...eqArgs)
          return { eq: vi.fn().mockResolvedValue({ error: null }) }
        }}
      },
    }),
    channel: (...args: unknown[]) => {
      mockChannel(...args)
      return { on: mockOn, subscribe: mockSubscribe }
    },
    removeChannel: mockRemoveChannel,
  }),
}))

const defaultCoyynsReturn = {
  wallet: { id: "w-1", user_id: "user-1", balance: 500, lifetime_earned: 1000, lifetime_spent: 500, created_at: "", updated_at: "" },
  partnerWallet: null,
  transactions: [],
  isLoading: false,
  error: null as string | null,
  addCoyyns: vi.fn(),
  spendCoyyns: mockSpendCoyyns,
  refreshWallet: vi.fn(),
}

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns: () => defaultCoyynsReturn,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@test.com" },
    profile: { id: "user-1", display_name: "Yahya", email: "test@test.com", avatar_url: null, partner_id: "user-2", role: "admin", created_at: "", updated_at: "" },
    partner: { id: "user-2", display_name: "Yara", email: "yara@test.com", avatar_url: null, partner_id: "user-1", role: "user", created_at: "", updated_at: "" },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { ClaimWinDialog, ConfirmResultDialog } from "@/components/relationship/ChallengeResolution"

const defaultChallenge = {
  id: "c-1",
  creator_id: "user-2",
  title: "No Screen Sunday",
  description: "Stay off screens all day",
  emoji: "📵",
  stakes: 100,
  status: "active",
  claimed_by: null,
  winner_id: null,
}

describe("ClaimWinDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSpendCoyyns.mockResolvedValue(undefined)
  })

  it("renders the dialog when open", () => {
    render(
      <ClaimWinDialog
        open={true}
        onClose={vi.fn()}
        challenge={defaultChallenge}
      />
    )
    expect(screen.getByTestId("claim-win-dialog")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(
      <ClaimWinDialog
        open={false}
        onClose={vi.fn()}
        challenge={defaultChallenge}
      />
    )
    expect(screen.queryByTestId("claim-win-dialog")).not.toBeInTheDocument()
  })

  it("renders challenge title", () => {
    render(
      <ClaimWinDialog
        open={true}
        onClose={vi.fn()}
        challenge={defaultChallenge}
      />
    )
    expect(screen.getByText(/No Screen Sunday/)).toBeInTheDocument()
  })

  it("renders stakes display", () => {
    render(
      <ClaimWinDialog
        open={true}
        onClose={vi.fn()}
        challenge={defaultChallenge}
      />
    )
    expect(screen.getByTestId("stakes-display")).toHaveTextContent("100")
  })

  it("renders 'I Won!' button", () => {
    render(
      <ClaimWinDialog
        open={true}
        onClose={vi.fn()}
        challenge={defaultChallenge}
      />
    )
    expect(screen.getByTestId("claim-win-confirm")).toHaveTextContent("I Won!")
  })

  it("calls supabase update when claiming", async () => {
    render(
      <ClaimWinDialog
        open={true}
        onClose={vi.fn()}
        challenge={defaultChallenge}
        onClaimed={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTestId("claim-win-confirm"))
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn()
    render(
      <ClaimWinDialog
        open={true}
        onClose={onClose}
        challenge={defaultChallenge}
      />
    )
    fireEvent.click(screen.getByTestId("claim-win-close"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn()
    render(
      <ClaimWinDialog
        open={true}
        onClose={onClose}
        challenge={defaultChallenge}
      />
    )
    fireEvent.click(screen.getByTestId("claim-win-backdrop"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("shows waiting state when already claimed by user", () => {
    render(
      <ClaimWinDialog
        open={true}
        onClose={vi.fn()}
        challenge={{
          ...defaultChallenge,
          status: "pending_resolution",
          claimed_by: "user-1",
        }}
      />
    )
    expect(screen.getByText("Waiting for Partner")).toBeInTheDocument()
    expect(screen.getByTestId("cancel-claim-btn")).toBeInTheDocument()
  })

  it("sets up realtime subscription for challenge updates", () => {
    render(
      <ClaimWinDialog
        open={true}
        onClose={vi.fn()}
        challenge={defaultChallenge}
      />
    )
    expect(mockChannel).toHaveBeenCalled()
  })
})

describe("ConfirmResultDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSpendCoyyns.mockResolvedValue(undefined)
  })

  it("renders the dialog when open", () => {
    render(
      <ConfirmResultDialog
        open={true}
        onClose={vi.fn()}
        challenge={{ ...defaultChallenge, status: "pending_resolution", claimed_by: "user-2" }}
      />
    )
    expect(screen.getByTestId("confirm-result-dialog")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(
      <ConfirmResultDialog
        open={false}
        onClose={vi.fn()}
        challenge={{ ...defaultChallenge, status: "pending_resolution", claimed_by: "user-2" }}
      />
    )
    expect(screen.queryByTestId("confirm-result-dialog")).not.toBeInTheDocument()
  })

  it("renders claimant message with partner name", () => {
    render(
      <ConfirmResultDialog
        open={true}
        onClose={vi.fn()}
        challenge={{ ...defaultChallenge, status: "pending_resolution", claimed_by: "user-2" }}
        claimantName="Yara"
      />
    )
    expect(screen.getByTestId("claimant-message")).toHaveTextContent(/Yara claims they won/)
  })

  it("renders balance breakdown", () => {
    render(
      <ConfirmResultDialog
        open={true}
        onClose={vi.fn()}
        challenge={{ ...defaultChallenge, status: "pending_resolution", claimed_by: "user-2" }}
      />
    )
    expect(screen.getByTestId("result-balance-breakdown")).toBeInTheDocument()
    expect(screen.getByText("Stakes")).toBeInTheDocument()
    expect(screen.getByText("Your Balance")).toBeInTheDocument()
  })

  it("shows after-balance correctly", () => {
    render(
      <ConfirmResultDialog
        open={true}
        onClose={vi.fn()}
        challenge={{ ...defaultChallenge, stakes: 100, status: "pending_resolution", claimed_by: "user-2" }}
      />
    )
    // 500 - 100 = 400
    expect(screen.getByTestId("result-after-balance")).toHaveTextContent("400")
  })

  it("shows partial transfer when balance < stakes", () => {
    // Default wallet balance is 500 but stakes is 800
    render(
      <ConfirmResultDialog
        open={true}
        onClose={vi.fn()}
        challenge={{ ...defaultChallenge, stakes: 800, status: "pending_resolution", claimed_by: "user-2" }}
      />
    )
    expect(screen.getByTestId("partial-transfer")).toHaveTextContent("500")
  })

  it("renders confirm button", () => {
    render(
      <ConfirmResultDialog
        open={true}
        onClose={vi.fn()}
        challenge={{ ...defaultChallenge, status: "pending_resolution", claimed_by: "user-2" }}
      />
    )
    expect(screen.getByTestId("confirm-result-btn")).toHaveTextContent(/Confirm/)
  })

  it("renders dispute button", () => {
    render(
      <ConfirmResultDialog
        open={true}
        onClose={vi.fn()}
        challenge={{ ...defaultChallenge, status: "pending_resolution", claimed_by: "user-2" }}
      />
    )
    expect(screen.getByTestId("dispute-result-btn")).toHaveTextContent("Dispute")
  })

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn()
    render(
      <ConfirmResultDialog
        open={true}
        onClose={onClose}
        challenge={{ ...defaultChallenge, status: "pending_resolution", claimed_by: "user-2" }}
      />
    )
    fireEvent.click(screen.getByTestId("confirm-result-close"))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
