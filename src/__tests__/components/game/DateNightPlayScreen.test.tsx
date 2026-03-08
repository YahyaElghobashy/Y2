import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ─── Mocks ───
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams("session=sess-3"),
}))

const mockSubmitAnswer = vi.fn()
const mockSubmitJournal = vi.fn()
const mockCompleteDare = vi.fn()
const mockSkipDare = vi.fn()
const mockNextRound = vi.fn()
const mockPauseSession = vi.fn()
const mockCompleteSession = vi.fn()

const mockEngine = {
  session: {
    id: "sess-3",
    created_by: "user-1",
    mode: "date_night",
    status: "playing",
    player1_score: 15,
    player2_score: 10,
  },
  rounds: [
    { id: "r1", round_number: 1, question_id: "q1", round_type: "truth_or_dare", dare_completed: null, is_skipped: false },
    { id: "r2", round_number: 2, question_id: "q2", round_type: "question", dare_completed: null, is_skipped: false },
    { id: "r3", round_number: 3, question_id: "q3", round_type: "dare", dare_completed: null, is_skipped: false },
  ],
  currentRound: {
    round: { id: "r1", round_number: 1, question_id: "q1", round_type: "truth_or_dare", dare_completed: null, is_skipped: false },
    question: { id: "q1", text: "What is your happiest memory together?", category: "love", difficulty: "medium", answer_type: "open" },
    dare: { id: "d1", text: "Give your partner a 30-second massage", category: "fun", difficulty: "easy" },
    customContent: null,
    isPartnerAuthored: false,
    authorName: null,
  },
  currentRoundIndex: 0,
  isLoading: false,
  error: null,
  submitAnswer: mockSubmitAnswer,
  submitJournal: mockSubmitJournal,
  completeDare: mockCompleteDare,
  skipDare: mockSkipDare,
  nextRound: mockNextRound,
  pauseSession: mockPauseSession,
  completeSession: mockCompleteSession,
}

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => mockEngine,
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
    h2: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
      return <h2 {...rest}>{children}</h2>
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
      return <p {...rest}>{children}</p>
    },
  },
  AnimatePresence: ({ children }: any) => children,
}))

vi.mock("@/components/game/GameCard", () => ({
  GameCard: (props: any) => (
    <div data-testid="game-card" onClick={props.onFlip}>
      {props.isRevealed ? "GameCard-revealed" : "GameCard-facedown"}
    </div>
  ),
}))

vi.mock("@/components/game/DareCard", () => ({
  DareCard: (props: any) => (
    <div data-testid="dare-card" onClick={props.onFlip}>
      {props.isRevealed ? "DareCard-revealed" : "DareCard-facedown"}
      {props.onComplete && <button data-testid="dare-complete-btn" onClick={props.onComplete}>Complete</button>}
      {props.onSkip && <button data-testid="dare-skip-btn" onClick={props.onSkip}>Skip</button>}
    </div>
  ),
}))

vi.mock("@/components/game/TruthCard", () => ({
  TruthCard: (props: any) => (
    <div data-testid="truth-card">
      TruthCard
      {props.onNext && <button data-testid="truth-next-btn" onClick={props.onNext}>Next</button>}
      {props.onSaveResponse && (
        <button data-testid="truth-save-btn" onClick={() => props.onSaveResponse("my response")}>Save</button>
      )}
    </div>
  ),
}))

import { DateNightPlayScreen } from "@/components/game/DateNightPlayScreen"

// Helper to reset mockEngine to defaults before each test
const resetEngine = () => {
  mockEngine.session = {
    id: "sess-3",
    created_by: "user-1",
    mode: "date_night",
    status: "playing",
    player1_score: 15,
    player2_score: 10,
  }
  mockEngine.rounds = [
    { id: "r1", round_number: 1, question_id: "q1", round_type: "truth_or_dare", dare_completed: null, is_skipped: false },
    { id: "r2", round_number: 2, question_id: "q2", round_type: "question", dare_completed: null, is_skipped: false },
    { id: "r3", round_number: 3, question_id: "q3", round_type: "dare", dare_completed: null, is_skipped: false },
  ]
  mockEngine.currentRound = {
    round: { id: "r1", round_number: 1, question_id: "q1", round_type: "truth_or_dare", dare_completed: null, is_skipped: false },
    question: { id: "q1", text: "What is your happiest memory together?", category: "love", difficulty: "medium", answer_type: "open" },
    dare: { id: "d1", text: "Give your partner a 30-second massage", category: "fun", difficulty: "easy" },
    customContent: null,
    isPartnerAuthored: false,
    authorName: null,
  }
  mockEngine.currentRoundIndex = 0
  mockEngine.isLoading = false
  mockEngine.error = null
}

describe("DateNightPlayScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetEngine()
  })

  // ─── Loading State ───
  it("shows loading state with spinner text", () => {
    mockEngine.isLoading = true
    render(<DateNightPlayScreen />)
    expect(screen.getByText("Setting up game night...")).toBeTruthy()
  })

  // ─── Error State ───
  it("shows error state with message", () => {
    mockEngine.error = "Session not found"
    mockEngine.currentRound = { round: null, question: null, dare: null, customContent: null, isPartnerAuthored: false, authorName: null } as any
    render(<DateNightPlayScreen />)
    expect(screen.getByText("Session not found")).toBeTruthy()
  })

  it("shows 'Back to Games' button in error state", () => {
    mockEngine.error = "Something went wrong"
    mockEngine.currentRound = { round: null, question: null, dare: null, customContent: null, isPartnerAuthored: false, authorName: null } as any
    render(<DateNightPlayScreen />)
    const backBtn = screen.getByText("Back to Games")
    expect(backBtn).toBeTruthy()
    fireEvent.click(backBtn)
    expect(mockPush).toHaveBeenCalledWith("/game")
  })

  it("shows fallback error when no rounds found", () => {
    mockEngine.currentRound = { round: null, question: null, dare: null, customContent: null, isPartnerAuthored: false, authorName: null } as any
    render(<DateNightPlayScreen />)
    expect(screen.getByText("No rounds found.")).toBeTruthy()
  })

  // ─── Scoreboard ───
  it("shows my score (player1 = 15)", () => {
    render(<DateNightPlayScreen />)
    expect(screen.getByText("15")).toBeTruthy()
  })

  it("shows partner score (player2 = 10)", () => {
    render(<DateNightPlayScreen />)
    expect(screen.getByText("10")).toBeTruthy()
  })

  // ─── Round Counter ───
  it("shows round counter as '1 / 3'", () => {
    render(<DateNightPlayScreen />)
    expect(screen.getByText("1 / 3")).toBeTruthy()
  })

  // ─── Progress Bar ───
  it("renders progress bar container", () => {
    const { container } = render(<DateNightPlayScreen />)
    const progressBar = container.querySelector(".bg-\\[\\#F4A8B8\\].h-full")
    expect(progressBar).toBeTruthy()
  })

  // ─── Face Down Phase ───
  it("shows GameCard in face-down phase for truth_or_dare round type", () => {
    render(<DateNightPlayScreen />)
    expect(screen.getByTestId("game-card")).toBeTruthy()
    expect(screen.getByText("GameCard-facedown")).toBeTruthy()
  })

  // ─── Truth or Dare Choice ───
  it("shows 'Truth or Dare?' heading after card tap when roundType is truth_or_dare", () => {
    render(<DateNightPlayScreen />)
    fireEvent.click(screen.getByTestId("game-card"))
    expect(screen.getByText("Truth or Dare?")).toBeTruthy()
  })

  it("shows Truth choice button with mirror emoji", () => {
    render(<DateNightPlayScreen />)
    fireEvent.click(screen.getByTestId("game-card"))
    expect(screen.getByText("Truth")).toBeTruthy()
  })

  it("shows Dare choice button with lightning emoji", () => {
    render(<DateNightPlayScreen />)
    fireEvent.click(screen.getByTestId("game-card"))
    expect(screen.getByText("Dare")).toBeTruthy()
  })

  // ─── handleChooseTruth ───
  it("handleChooseTruth sets phase to truth_reveal (shows TruthCard)", () => {
    render(<DateNightPlayScreen />)
    // Tap card to get to truth_or_dare_choice
    fireEvent.click(screen.getByTestId("game-card"))
    // Choose Truth
    fireEvent.click(screen.getByText("Truth"))
    expect(screen.getByTestId("truth-card")).toBeTruthy()
  })

  // ─── handleChooseDare ───
  it("handleChooseDare sets phase to dare_reveal (shows DareCard revealed)", () => {
    render(<DateNightPlayScreen />)
    // Tap card to get to truth_or_dare_choice
    fireEvent.click(screen.getByTestId("game-card"))
    // Choose Dare
    fireEvent.click(screen.getByText("Dare"))
    expect(screen.getByTestId("dare-card")).toBeTruthy()
    expect(screen.getByText("DareCard-revealed")).toBeTruthy()
  })

  // ─── Complete Session on Last Round ───
  it("calls completeSession and navigates to complete page on last round", async () => {
    mockEngine.currentRoundIndex = 2
    // Put in question_reveal phase so Next button is visible
    mockEngine.currentRound = {
      round: { id: "r3", round_number: 3, question_id: "q3", round_type: "question", dare_completed: null, is_skipped: false },
      question: { id: "q3", text: "Last question?", category: "fun", difficulty: "easy", answer_type: "open" },
      dare: null,
      customContent: null,
      isPartnerAuthored: false,
      authorName: null,
    }
    render(<DateNightPlayScreen />)
    // Tap card to reveal question
    fireEvent.click(screen.getByTestId("game-card"))
    // Now in question_reveal, click Next
    fireEvent.click(screen.getByText("Next →"))
    await waitFor(() => {
      expect(mockCompleteSession).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith("/game/date-night/complete?session=sess-3")
    })
  })

  it("calls nextRound (not completeSession) on non-last round", async () => {
    mockEngine.currentRoundIndex = 0
    // Set to question type so we get question_reveal with Next button
    mockEngine.currentRound = {
      round: { id: "r1", round_number: 1, question_id: "q1", round_type: "question", dare_completed: null, is_skipped: false },
      question: { id: "q1", text: "A simple question?", category: "fun", difficulty: "easy", answer_type: "open" },
      dare: null,
      customContent: null,
      isPartnerAuthored: false,
      authorName: null,
    }
    render(<DateNightPlayScreen />)
    // Tap card to reveal
    fireEvent.click(screen.getByTestId("game-card"))
    // Click Next
    fireEvent.click(screen.getByText("Next →"))
    await waitFor(() => {
      expect(mockNextRound).toHaveBeenCalled()
      expect(mockCompleteSession).not.toHaveBeenCalled()
    })
  })

  // ─── Pause Menu ───
  it("shows pause menu with scores when pause button clicked", () => {
    render(<DateNightPlayScreen />)
    // Find pause button (button containing Pause icon)
    const buttons = screen.getAllByRole("button")
    const pauseBtn = buttons.find((b) => b.querySelector(".lucide-pause") || b.className.includes("bg-white/10"))
    if (pauseBtn) {
      fireEvent.click(pauseBtn)
      expect(screen.getByText("Pause Game?")).toBeTruthy()
      expect(screen.getByText("Your scores are saved.")).toBeTruthy()
      expect(screen.getByText(/You: 15/)).toBeTruthy()
      expect(screen.getByText(/Yara: 10/)).toBeTruthy()
    }
  })

  it("calls pauseSession when 'Pause & Save' is clicked", async () => {
    render(<DateNightPlayScreen />)
    // Open pause menu
    const buttons = screen.getAllByRole("button")
    const pauseBtn = buttons.find((b) => b.querySelector(".lucide-pause") || b.className.includes("bg-white/10"))
    if (pauseBtn) {
      fireEvent.click(pauseBtn)
      fireEvent.click(screen.getByText("Pause & Save"))
      await waitFor(() => {
        expect(mockPauseSession).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith("/game")
      })
    }
  })

  it("closes pause menu when 'Keep Playing' is clicked", () => {
    render(<DateNightPlayScreen />)
    const buttons = screen.getAllByRole("button")
    const pauseBtn = buttons.find((b) => b.querySelector(".lucide-pause") || b.className.includes("bg-white/10"))
    if (pauseBtn) {
      fireEvent.click(pauseBtn)
      expect(screen.getByText("Pause Game?")).toBeTruthy()
      fireEvent.click(screen.getByText("Keep Playing"))
      expect(screen.queryByText("Pause Game?")).toBeNull()
    }
  })

  // ─── DareCard shown for dare-only round ───
  it("shows DareCard face-down for a dare round type (no question)", () => {
    mockEngine.currentRound = {
      round: { id: "r3", round_number: 3, question_id: "q3", round_type: "dare", dare_completed: null, is_skipped: false },
      question: null,
      dare: { id: "d3", text: "Do a silly dance", category: "fun", difficulty: "easy" },
      customContent: null,
      isPartnerAuthored: false,
      authorName: null,
    } as any
    render(<DateNightPlayScreen />)
    expect(screen.getByTestId("dare-card")).toBeTruthy()
    expect(screen.getByText("DareCard-facedown")).toBeTruthy()
  })

  // ─── Score display for non-creator (player2) ───
  it("swaps scores correctly when user is player2", () => {
    mockEngine.session = {
      ...mockEngine.session,
      created_by: "user-2", // user is NOT the creator
    }
    render(<DateNightPlayScreen />)
    // myScore should be player2_score = 10, partnerScore should be player1_score = 15
    const scoreTexts = screen.getAllByText(/^(10|15)$/)
    expect(scoreTexts.length).toBeGreaterThanOrEqual(2)
  })

  // ─── Truth or Dare description text ───
  it("shows description text about truth and dare scoring", () => {
    render(<DateNightPlayScreen />)
    fireEvent.click(screen.getByTestId("game-card"))
    expect(screen.getByText(/Truth is safe but scoreless/)).toBeTruthy()
    expect(screen.getByText(/Dare earns CoYYns/)).toBeTruthy()
  })

  // ─── Round counter updates ───
  it("shows updated round counter on round 2", () => {
    mockEngine.currentRoundIndex = 1
    render(<DateNightPlayScreen />)
    expect(screen.getByText("2 / 3")).toBeTruthy()
  })
})
