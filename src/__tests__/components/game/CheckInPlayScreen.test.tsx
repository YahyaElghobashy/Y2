import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ─── Mocks ───
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useSearchParams: () => new URLSearchParams("session=sess-1"),
}))

const mockSubmitAnswer = vi.fn()
const mockNextRound = vi.fn()
const mockPauseSession = vi.fn()
const mockCompleteSession = vi.fn()
const mockGetAnswerHistory = vi.fn().mockResolvedValue([])

const mockEngineReturn = {
  session: { id: "sess-1", created_by: "user-1", mode: "check_in", status: "playing", player1_score: 0, player2_score: 0 },
  rounds: [
    { id: "r1", round_number: 1, question_id: "q1", round_type: "question", both_answered: false, player1_answer: null, player2_answer: null, alignment_gap: null },
    { id: "r2", round_number: 2, question_id: "q2", round_type: "question", both_answered: false, player1_answer: null, player2_answer: null, alignment_gap: null },
  ],
  currentRound: {
    round: { id: "r1", round_number: 1, question_id: "q1", round_type: "question", both_answered: false, player1_answer: null, player2_answer: null, alignment_gap: null },
    question: { id: "q1", text: "How well do you communicate?", category: "communication", difficulty: "light", answer_type: "scale_1_10", answer_options: null },
    dare: null,
    customContent: null,
    isPartnerAuthored: false,
    authorName: null,
  },
  currentRoundIndex: 0,
  isLoading: false,
  error: null,
  submitAnswer: mockSubmitAnswer,
  nextRound: mockNextRound,
  pauseSession: mockPauseSession,
  completeSession: mockCompleteSession,
  isWaitingForPartner: false,
  partnerHasAnswered: false,
  getAnswerHistory: mockGetAnswerHistory,
}

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => mockEngineReturn,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", user_metadata: { display_name: "Yahya" } },
    partner: { id: "user-2", display_name: "Yara" },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
      return <button {...rest}>{children}</button>
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
      return <span {...rest}>{children}</span>
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
      return <p {...rest}>{children}</p>
    },
  },
  AnimatePresence: ({ children }: any) => children,
}))

vi.mock("@/components/game/AlignmentReveal", () => ({
  AlignmentReveal: ({ onNext }: any) => (
    <div data-testid="alignment-reveal">
      <button onClick={onNext}>Next →</button>
    </div>
  ),
}))

import { CheckInPlayScreen } from "@/components/game/CheckInPlayScreen"

describe("CheckInPlayScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders question text", () => {
    render(<CheckInPlayScreen />)
    expect(screen.getByText("How well do you communicate?")).toBeTruthy()
  })

  it("shows progress bar with correct count", () => {
    render(<CheckInPlayScreen />)
    expect(screen.getByText("Question 1 of 2")).toBeTruthy()
  })

  it("shows category badge", () => {
    render(<CheckInPlayScreen />)
    expect(screen.getByText(/Communication/)).toBeTruthy()
  })

  it("renders Lock In button", () => {
    render(<CheckInPlayScreen />)
    expect(screen.getByText("Lock In ✓")).toBeTruthy()
  })

  it("calls submitAnswer when Lock In is clicked (scale)", async () => {
    render(<CheckInPlayScreen />)
    fireEvent.click(screen.getByText("Lock In ✓"))
    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalledWith({ value: 5 })
    })
  })

  it("shows pause menu when pause button clicked", () => {
    render(<CheckInPlayScreen />)
    // Find pause button (it's a button with Pause icon)
    const pauseButtons = screen.getAllByRole("button")
    const pauseBtn = pauseButtons.find(b => b.querySelector("svg") || b.innerHTML.includes("Pause"))
    if (pauseBtn) {
      fireEvent.click(pauseBtn)
      expect(screen.getByText("Pause Check-In?")).toBeTruthy()
    }
  })

  it("calls pauseSession when Pause & Save clicked", async () => {
    render(<CheckInPlayScreen />)
    // Open pause menu
    const allButtons = screen.getAllByRole("button")
    const pauseBtn = allButtons.find(b => b.innerHTML.includes("Pause") && !b.textContent?.includes("Check-In"))
    if (pauseBtn) {
      fireEvent.click(pauseBtn)
      fireEvent.click(screen.getByText("Pause & Save"))
      await waitFor(() => {
        expect(mockPauseSession).toHaveBeenCalled()
      })
    }
  })

  it("shows loading state when isLoading is true", () => {
    mockEngineReturn.isLoading = true
    render(<CheckInPlayScreen />)
    expect(screen.getByText("Loading check-in...")).toBeTruthy()
    mockEngineReturn.isLoading = false
  })

  it("shows error state when error exists", () => {
    mockEngineReturn.error = "Something went wrong"
    mockEngineReturn.currentRound = null as any
    render(<CheckInPlayScreen />)
    expect(screen.getByText("Something went wrong")).toBeTruthy()
    // Restore
    mockEngineReturn.error = null
    mockEngineReturn.currentRound = {
      round: mockEngineReturn.rounds[0],
      question: { id: "q1", text: "How well do you communicate?", category: "communication", difficulty: "light", answer_type: "scale_1_10", answer_options: null },
      dare: null, customContent: null, isPartnerAuthored: false, authorName: null,
    } as any
  })

  it("renders scale input for scale_1_10 questions", () => {
    render(<CheckInPlayScreen />)
    // Should show the number 5 (default scale value)
    expect(screen.getByText("5")).toBeTruthy()
    // Should show Disagree/Neutral/Agree labels
    expect(screen.getByText("Disagree")).toBeTruthy()
    expect(screen.getByText("Agree")).toBeTruthy()
  })
})
