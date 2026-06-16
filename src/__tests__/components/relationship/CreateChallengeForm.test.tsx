import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
// The form delegates creation to the canonical useChallenges().createChallenge,
// which escrows the stake and inserts status "pending_acceptance". It must never
// touch supabase directly (the old bug inserted status "active").
const mockCreateChallenge = vi.fn()
let walletBalance = 100

vi.mock("@/lib/hooks/use-challenges", () => ({
  useChallenges: () => ({
    createChallenge: mockCreateChallenge,
    error: null,
  }),
}))

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns: () => ({
    wallet: { balance: walletBalance },
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

import { CreateChallengeForm } from "@/components/relationship/CreateChallengeForm"

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onCreated: vi.fn(),
}

async function submitWithTitle(title = "No Screen Sunday") {
  fireEvent.change(screen.getByTestId("challenge-title-input"), {
    target: { value: title },
  })
  fireEvent.click(screen.getByTestId("challenge-submit"))
}

describe("CreateChallengeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    walletBalance = 100
    mockCreateChallenge.mockResolvedValue(true)
  })

  // ── Render ──────────────────────────────────────────────

  it("renders the dialog when open", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("challenge-form-dialog")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(<CreateChallengeForm {...defaultProps} open={false} />)
    expect(screen.queryByTestId("challenge-form-dialog")).not.toBeInTheDocument()
  })

  it("renders the title 'Create Challenge'", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    const heading = screen.getAllByText("Create Challenge").find((el) => el.tagName === "H2")
    expect(heading).toBeInTheDocument()
  })

  it("renders emoji picker with 10 emoji options", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument()
    const emojis = ["⚡", "🏆", "💪", "🎯", "🔥", "✨", "🎮", "📚", "🏃‍♂️", "🧘"]
    emojis.forEach((emoji) => {
      expect(screen.getByTestId(`emoji-${emoji}`)).toBeInTheDocument()
    })
  })

  it("selects a different emoji when clicked", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    const trophyBtn = screen.getByTestId("emoji-🏆")
    fireEvent.click(trophyBtn)
    expect(trophyBtn).toHaveAttribute("aria-pressed", "true")
  })

  it("renders title, description, stakes (default 50) and deadline inputs", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("challenge-title-input")).toBeInTheDocument()
    expect(screen.getByTestId("challenge-description-input")).toBeInTheDocument()
    expect(screen.getByTestId("challenge-deadline-input")).toBeInTheDocument()
    const stakes = screen.getByTestId("challenge-stakes-input") as HTMLInputElement
    expect(stakes.value).toBe("50")
  })

  it("renders the submit button", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("challenge-submit")).toHaveTextContent("Create Challenge")
  })

  // ── Validation ──────────────────────────────────────────

  it("shows title error and does not create when submitting empty title", async () => {
    render(<CreateChallengeForm {...defaultProps} />)
    fireEvent.click(screen.getByTestId("challenge-submit"))
    await waitFor(() => {
      expect(screen.getByTestId("title-error")).toBeInTheDocument()
    })
    expect(mockCreateChallenge).not.toHaveBeenCalled()
  })

  // ── Interaction: create via canonical hook ──────────────

  it("delegates to createChallenge with a pending-acceptance payload (no status field)", async () => {
    render(<CreateChallengeForm {...defaultProps} />)
    await submitWithTitle("No Screen Sunday")

    await waitFor(() => {
      expect(mockCreateChallenge).toHaveBeenCalledTimes(1)
    })
    // Form never sets status itself — pending_acceptance is the hook's job.
    const payload = mockCreateChallenge.mock.calls[0][0]
    expect(payload).toMatchObject({
      title: "No Screen Sunday",
      emoji: "⚡",
      stakes: 50,
    })
    expect(payload).not.toHaveProperty("status")
    expect(payload.description).toBeUndefined()
    expect(payload.deadline).toBeUndefined()
  })

  it("passes the selected emoji to createChallenge", async () => {
    render(<CreateChallengeForm {...defaultProps} />)
    fireEvent.click(screen.getByTestId("emoji-🔥"))
    await submitWithTitle("Plank off")

    await waitFor(() => {
      expect(mockCreateChallenge).toHaveBeenCalled()
    })
    expect(mockCreateChallenge.mock.calls[0][0].emoji).toBe("🔥")
  })

  it("calls onCreated and onClose and shows success toast on success", async () => {
    const onCreated = vi.fn()
    const onClose = vi.fn()
    const { toast } = await import("sonner")
    render(<CreateChallengeForm {...defaultProps} onCreated={onCreated} onClose={onClose} />)

    await submitWithTitle()

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledOnce()
    })
    expect(onClose).toHaveBeenCalledOnce()
    expect(toast.success).toHaveBeenCalledWith(
      "Challenge sent — waiting for your partner to accept",
    )
  })

  it("shows error toast and does not close when createChallenge fails", async () => {
    const onCreated = vi.fn()
    const onClose = vi.fn()
    const { toast } = await import("sonner")
    mockCreateChallenge.mockResolvedValueOnce(false)
    render(<CreateChallengeForm {...defaultProps} onCreated={onCreated} onClose={onClose} />)

    await submitWithTitle()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to create challenge")
    })
    expect(onCreated).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  // ── Affordability guard ─────────────────────────────────

  it("warns and blocks submission when balance can't cover the stake", async () => {
    walletBalance = 10 // default stake is 50
    render(<CreateChallengeForm {...defaultProps} />)

    expect(screen.getByTestId("insufficient-funds-warning")).toBeInTheDocument()
    expect(screen.getByTestId("challenge-submit")).toBeDisabled()

    await submitWithTitle()
    expect(mockCreateChallenge).not.toHaveBeenCalled()
  })

  it("shows the wallet balance in the stake note", () => {
    walletBalance = 250
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("stake-balance")).toHaveTextContent("250")
  })

  // ── Dismissal ───────────────────────────────────────────

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn()
    render(<CreateChallengeForm {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("challenge-form-close"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn()
    render(<CreateChallengeForm {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("challenge-form-backdrop"))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
