import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// ─── Mocks ───

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => (key === "session" ? "sess-2" : null),
  }),
}))

const mockSession = {
  config: { primaryCategory: "intimacy" },
  duration_seconds: 1800,
  created_by: "user-1",
  alignment_score: null,
  category_scores: null,
  player1_score: null,
  player2_score: null,
  total_coyyns_earned: null,
}

const mockRoundsWithJournals = [
  {
    id: "r1",
    question_id: "q1",
    player1_journal: "I feel we've grown closer.",
    player2_journal: "This was meaningful to me.",
  },
  {
    id: "r2",
    question_id: "q2",
    player1_journal: "Sharing this was special.",
    player2_journal: null,
  },
  {
    id: "r3",
    question_id: "q3",
    player1_journal: null,
    player2_journal: null,
  },
]

const mockRoundsNoJournals = [
  { id: "r1", question_id: "q1", player1_journal: null, player2_journal: null },
  { id: "r2", question_id: "q2", player1_journal: null, player2_journal: null },
]

let currentSession: typeof mockSession | null = mockSession
let currentRounds: typeof mockRoundsWithJournals = mockRoundsWithJournals

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => ({
    session: currentSession,
    rounds: currentRounds,
  }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    partner: { id: "user-2", display_name: "Yara" },
    isLoading: false,
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
  },
  AnimatePresence: ({ children }: any) => children,
}))

vi.mock("@/lib/types/game.types", () => ({
  CATEGORY_META: {
    communication: { emoji: "\u{1F4AC}", label: "Communication", color: "#6B9EC4" },
    intimacy: { emoji: "\u{1F495}", label: "Intimacy", color: "#C27070" },
    finances: { emoji: "\u{1F4B0}", label: "Finances", color: "#7CB67C" },
    faith: { emoji: "\u{1F932}", label: "Faith", color: "#D4A04A" },
    family: { emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}", label: "Family", color: "#B87333" },
    lifestyle: { emoji: "\u{1F3E1}", label: "Lifestyle", color: "#8B7EC8" },
    dreams: { emoji: "\u2728", label: "Dreams", color: "#C4956A" },
    conflict: { emoji: "\u{1F91D}", label: "Conflict", color: "#C27070" },
    vulnerability: { emoji: "\u{1FAF6}", label: "Vulnerability", color: "#D4A04A" },
    love: { emoji: "\u2764\uFE0F", label: "Love", color: "#C27070" },
    travel: { emoji: "\u2708\uFE0F", label: "Travel", color: "#6B9EC4" },
    home: { emoji: "\u{1F3E0}", label: "Home", color: "#7CB67C" },
  },
}))

import { DeepDiveComplete } from "@/components/game/DeepDiveComplete"

// ─── Tests ───

describe("DeepDiveComplete", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentSession = mockSession
    currentRounds = mockRoundsWithJournals
  })

  // ─── Loading state ───

  describe("loading state", () => {
    it("shows 'Loading...' when session is null", () => {
      currentSession = null
      render(<DeepDiveComplete />)
      expect(screen.getByText("Loading...")).toBeTruthy()
    })
  })

  // ─── Header ───

  describe("header", () => {
    it("shows 'Deep Dive Complete' heading", () => {
      render(<DeepDiveComplete />)
      expect(screen.getByText("Deep Dive Complete")).toBeTruthy()
    })
  })

  // ─── Exploration summary ───

  describe("exploration summary", () => {
    it("shows question count", () => {
      render(<DeepDiveComplete />)
      // 3 rounds total
      expect(screen.getByText(/3 questions/)).toBeTruthy()
    })

    it("shows category emoji and label (Intimacy)", () => {
      render(<DeepDiveComplete />)
      expect(screen.getByText("\u{1F495}")).toBeTruthy()
      expect(screen.getByText("Intimacy")).toBeTruthy()
    })

    it("shows duration in minutes ('30 minutes')", () => {
      render(<DeepDiveComplete />)
      // 1800 seconds = 30 minutes
      expect(screen.getByText(/30 minutes/)).toBeTruthy()
    })
  })

  // ─── Journals (with entries) ───

  describe("journal reflections (with entries)", () => {
    it("shows 'Your reflections' section when journals exist", () => {
      render(<DeepDiveComplete />)
      expect(screen.getByText(/Your reflections/)).toBeTruthy()
    })

    it("shows journal entries with 'You wrote:' and partner entries with 'Yara wrote:'", () => {
      render(<DeepDiveComplete />)
      // isPlayer1 is true, so myEntry = player1_journal, partnerEntry = player2_journal
      // r1: player1_journal + player2_journal both exist
      expect(screen.getAllByText("You wrote:").length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText("I feel we've grown closer.")).toBeTruthy()
      expect(screen.getAllByText("Yara wrote:").length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText("This was meaningful to me.")).toBeTruthy()
      // r2: only player1_journal
      expect(screen.getByText("Sharing this was special.")).toBeTruthy()
    })
  })

  // ─── Journals (empty) ───

  describe("journal reflections (no entries)", () => {
    it("shows empty state message when no journals exist", () => {
      currentRounds = mockRoundsNoJournals
      render(<DeepDiveComplete />)
      expect(
        screen.getByText("You chose to keep this conversation between you. Beautiful.")
      ).toBeTruthy()
    })
  })

  // ─── Saved confirmation ───

  describe("saved confirmation", () => {
    it("shows 'This session is saved in your history'", () => {
      render(<DeepDiveComplete />)
      expect(screen.getByText(/This session is saved in your history/)).toBeTruthy()
    })
  })

  // ─── CTAs ───

  describe("CTA buttons", () => {
    it("shows 'Explore Another Topic' button", () => {
      render(<DeepDiveComplete />)
      expect(screen.getByText(/Explore Another Topic/)).toBeTruthy()
    })

    it("shows 'Back to Home' button", () => {
      render(<DeepDiveComplete />)
      expect(screen.getByText("Back to Home")).toBeTruthy()
    })

    it("navigates to /game/deep-dive/setup when Explore clicked", () => {
      render(<DeepDiveComplete />)
      fireEvent.click(screen.getByText(/Explore Another Topic/))
      expect(mockPush).toHaveBeenCalledWith("/game/deep-dive/setup")
    })
  })
})
