import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// ─── Mocks ───

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => (key === "session" ? "sess-1" : null),
  }),
}))

const mockSession = {
  alignment_score: 78,
  category_scores: { communication: 85, intimacy: 60 },
  player1_score: 25,
  player2_score: 18,
  total_coyyns_earned: 43,
  created_by: "user-1",
  config: {},
  duration_seconds: null,
}

const mockRounds = [
  { id: "r1", dare_completed: true, is_skipped: false, custom_content_id: null },
  { id: "r2", dare_completed: false, is_skipped: true, custom_content_id: null },
  { id: "r3", dare_completed: true, is_skipped: false, custom_content_id: "custom-1" },
  { id: "r4", dare_completed: false, is_skipped: false, custom_content_id: null },
]

let currentSession: typeof mockSession | null = mockSession

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => ({
    session: currentSession,
    rounds: mockRounds,
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
    circle: (props: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <circle {...rest} />
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

import { GameComplete } from "@/components/game/GameComplete"

// ─── Tests ───

describe("GameComplete", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentSession = mockSession
  })

  // ─── Loading state ───

  describe("loading state", () => {
    it("shows 'Loading results...' when session is null", () => {
      currentSession = null
      render(<GameComplete mode="check_in" />)
      expect(screen.getByText("Loading results...")).toBeTruthy()
    })
  })

  // ─── Check-In Mode ───

  describe("check_in mode", () => {
    it("shows 'Check-In Complete' heading", () => {
      render(<GameComplete mode="check_in" />)
      expect(screen.getByText(/Check-In Complete/)).toBeTruthy()
    })

    it("shows alignment score percentage (78)", () => {
      render(<GameComplete mode="check_in" />)
      expect(screen.getByText("78")).toBeTruthy()
      expect(screen.getByText("%")).toBeTruthy()
    })

    it("shows 'Category Alignment' section", () => {
      render(<GameComplete mode="check_in" />)
      expect(screen.getByText("Category Alignment")).toBeTruthy()
    })

    it("shows category bars with scores (communication: 85%, intimacy: 60%)", () => {
      render(<GameComplete mode="check_in" />)
      expect(screen.getByText("85%")).toBeTruthy()
      expect(screen.getByText("60%")).toBeTruthy()
    })

    it("shows 'Most Aligned' highlight card", () => {
      render(<GameComplete mode="check_in" />)
      expect(screen.getByText("Most Aligned")).toBeTruthy()
      // communication is the highest at 85
      expect(screen.getByText(/Communication: 85%/)).toBeTruthy()
    })

    it("shows 'Biggest Gap' highlight card", () => {
      render(<GameComplete mode="check_in" />)
      expect(screen.getByText("Biggest Gap")).toBeTruthy()
      // intimacy is the lowest at 60
      expect(screen.getByText(/Intimacy: 60%/)).toBeTruthy()
    })

    it("shows 'Schedule Next Check-In' button", () => {
      render(<GameComplete mode="check_in" />)
      expect(screen.getByText(/Schedule Next Check-In/)).toBeTruthy()
    })

    it("shows 'Back to Games' button", () => {
      render(<GameComplete mode="check_in" />)
      expect(screen.getByText("Back to Games")).toBeTruthy()
    })

    it("navigates to /game when Back to Games clicked", () => {
      render(<GameComplete mode="check_in" />)
      fireEvent.click(screen.getByText("Back to Games"))
      expect(mockPush).toHaveBeenCalledWith("/game")
    })
  })

  // ─── Date Night Mode ───

  describe("date_night mode", () => {
    it("shows 'Game Over!' heading", () => {
      render(<GameComplete mode="date_night" />)
      expect(screen.getByText("Game Over!")).toBeTruthy()
    })

    it("shows my score and partner score (25 vs 18)", () => {
      render(<GameComplete mode="date_night" />)
      // isPlayer1 is true (created_by matches user.id), so myScore=25, pScore=18
      expect(screen.getByText("25")).toBeTruthy()
      expect(screen.getByText("18")).toBeTruthy()
    })

    it("shows crown emoji for winner", () => {
      render(<GameComplete mode="date_night" />)
      // Player1 (user) has 25 > 18 so they win — crown appears under "You"
      const crowns = screen.getAllByText("\u{1F451}")
      expect(crowns.length).toBeGreaterThanOrEqual(1)
    })

    it("shows dare stats (Total, Dares Done, Dares Skipped)", () => {
      render(<GameComplete mode="date_night" />)
      // total_coyyns_earned = 43
      expect(screen.getByText("43")).toBeTruthy()
      expect(screen.getByText(/Total/)).toBeTruthy()
      // daresCompleted = 2 (r1 and r3 have dare_completed: true)
      expect(screen.getByText("2")).toBeTruthy()
      expect(screen.getByText("Dares Done")).toBeTruthy()
      // daresSkipped = 1 (r2 has dare_completed: false && is_skipped: true)
      expect(screen.getByText("1")).toBeTruthy()
      expect(screen.getByText("Dares Skipped")).toBeTruthy()
    })

    it("shows 'Play Again' button", () => {
      render(<GameComplete mode="date_night" />)
      expect(screen.getByText(/Play Again/)).toBeTruthy()
    })

    it("navigates to /game/date-night/setup when Play Again clicked", () => {
      render(<GameComplete mode="date_night" />)
      fireEvent.click(screen.getByText(/Play Again/))
      expect(mockPush).toHaveBeenCalledWith("/game/date-night/setup")
    })

    it("shows partner-authored highlight when partnerAuthored > 0", () => {
      // r3 has custom_content_id set, so partnerAuthored = 1
      render(<GameComplete mode="date_night" />)
      expect(screen.getByText(/Partner Cards/)).toBeTruthy()
      expect(screen.getByText(/1 question written by Yara just for you/)).toBeTruthy()
    })
  })
})
