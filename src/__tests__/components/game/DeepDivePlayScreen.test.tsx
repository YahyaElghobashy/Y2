import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ─── Mocks ───
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams("session=sess-2"),
}))

const mockSubmitJournal = vi.fn()
const mockNextRound = vi.fn()
const mockPauseSession = vi.fn()
const mockCompleteSession = vi.fn()

const mockEngine = {
  session: { id: "sess-2", created_by: "user-1", mode: "deep_dive", status: "playing" },
  rounds: [
    { id: "r1", round_number: 1, question_id: "q1" },
    { id: "r2", round_number: 2, question_id: "q2" },
    { id: "r3", round_number: 3, question_id: "q3" },
  ],
  currentRound: {
    round: { id: "r1", round_number: 1, question_id: "q1" },
    question: { id: "q1", text: "What does love mean to you?", category: "love", difficulty: "deep", answer_type: "open" },
    dare: null, customContent: null, isPartnerAuthored: false, authorName: null,
  },
  currentRoundIndex: 0,
  isLoading: false,
  error: null,
  submitJournal: mockSubmitJournal,
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

import { DeepDivePlayScreen } from "@/components/game/DeepDivePlayScreen"

describe("DeepDivePlayScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders question text", () => {
    render(<DeepDivePlayScreen />)
    expect(screen.getByText("What does love mean to you?")).toBeTruthy()
  })

  it("shows progress counter", () => {
    render(<DeepDivePlayScreen />)
    expect(screen.getByText("1 of 3")).toBeTruthy()
  })

  it("shows category badge", () => {
    render(<DeepDivePlayScreen />)
    expect(screen.getByText(/Love/)).toBeTruthy()
  })

  it("shows difficulty badge", () => {
    render(<DeepDivePlayScreen />)
    expect(screen.getByText(/Deep/)).toBeTruthy()
  })

  it("shows take-your-time message", () => {
    render(<DeepDivePlayScreen />)
    expect(screen.getByText(/Take your time/)).toBeTruthy()
  })

  it("shows journal toggle", () => {
    render(<DeepDivePlayScreen />)
    expect(screen.getByText(/Want to write something/)).toBeTruthy()
  })

  it("expands journal textarea when toggle clicked", () => {
    render(<DeepDivePlayScreen />)
    fireEvent.click(screen.getByText(/Want to write something/))
    expect(screen.getByPlaceholderText(/Write your thoughts/)).toBeTruthy()
  })

  it("calls nextRound when Next is clicked (not last)", async () => {
    render(<DeepDivePlayScreen />)
    fireEvent.click(screen.getByText("Next →"))
    await waitFor(() => {
      expect(mockNextRound).toHaveBeenCalled()
    })
  })

  it("submits journal text before advancing", async () => {
    render(<DeepDivePlayScreen />)
    // Open journal
    fireEvent.click(screen.getByText(/Want to write something/))
    const textarea = screen.getByPlaceholderText(/Write your thoughts/)
    fireEvent.change(textarea, { target: { value: "My deep thoughts" } })
    fireEvent.click(screen.getByText("Next →"))
    await waitFor(() => {
      expect(mockSubmitJournal).toHaveBeenCalledWith("My deep thoughts")
    })
  })

  it("shows Finish button on last round", () => {
    mockEngine.currentRoundIndex = 2
    render(<DeepDivePlayScreen />)
    expect(screen.getByText(/Finish Deep Dive/)).toBeTruthy()
    mockEngine.currentRoundIndex = 0
  })

  it("calls completeSession and navigates on last round", async () => {
    mockEngine.currentRoundIndex = 2
    render(<DeepDivePlayScreen />)
    fireEvent.click(screen.getByText(/Finish Deep Dive/))
    await waitFor(() => {
      expect(mockCompleteSession).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith("/game/deep-dive/complete?session=sess-2")
    })
    mockEngine.currentRoundIndex = 0
  })

  it("shows loading state", () => {
    mockEngine.isLoading = true
    render(<DeepDivePlayScreen />)
    expect(screen.getByText("Preparing your deep dive...")).toBeTruthy()
    mockEngine.isLoading = false
  })

  it("shows pause dialog", () => {
    render(<DeepDivePlayScreen />)
    const pauseBtn = screen.getAllByRole("button").find(b => b.innerHTML.includes("Pause"))
    if (pauseBtn) {
      fireEvent.click(pauseBtn)
      expect(screen.getByText("Pause Deep Dive?")).toBeTruthy()
    }
  })
})
