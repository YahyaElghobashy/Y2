import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// ─── Mocks ───

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

const mockLoadActiveSession = vi.fn()
const mockActiveSession = null as any

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => ({
    activeSession: mockActiveSession,
    loadActiveSession: mockLoadActiveSession,
  }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    partner: { id: "user-2", display_name: "Yara" },
    isLoading: false,
  }),
}))

// Minimal framer-motion mock
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...stripMotionProps(props)}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...stripMotionProps(props)}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

function stripMotionProps(props: any) {
  const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
  return rest
}

import GameHomePage from "@/app/(main)/game/page"

describe("GameHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Unit: Renders correctly ───

  it("renders the Together Time heading", () => {
    render(<GameHomePage />)
    expect(screen.getByText(/Together Time/)).toBeTruthy()
  })

  it("renders all 3 game mode cards", () => {
    render(<GameHomePage />)

    expect(screen.getByText(/Alignment Check-In/)).toBeTruthy()
    expect(screen.getByText(/Deep Dive/)).toBeTruthy()
    expect(screen.getByText(/Date Night Game/)).toBeTruthy()
  })

  it("renders Arabic mode names", () => {
    render(<GameHomePage />)

    expect(screen.getByText("الميزان")).toBeTruthy()
    expect(screen.getByText("غوص")).toBeTruthy()
    expect(screen.getByText("لعبة")).toBeTruthy()
  })

  it("renders mode descriptions", () => {
    render(<GameHomePage />)

    expect(screen.getByText(/Answer the same questions independently/)).toBeTruthy()
    expect(screen.getByText(/Pick a topic. Go deep/)).toBeTruthy()
    expect(screen.getByText(/Questions, dares, CoYYns stakes/)).toBeTruthy()
  })

  it("renders quick action buttons for each mode", () => {
    render(<GameHomePage />)

    expect(screen.getByText(/Monthly Check-In/)).toBeTruthy()
    expect(screen.getByText(/Start Exploring/)).toBeTruthy()
    expect(screen.getByText(/Light & Fun/)).toBeTruthy()
    expect(screen.getByText(/Full Experience/)).toBeTruthy()
  })

  it("renders Question Bank link", () => {
    render(<GameHomePage />)
    expect(screen.getByText(/Question Bank/)).toBeTruthy()
  })

  // ─── Interaction: Navigation ───

  it("navigates to check-in setup when Monthly Check-In is clicked", () => {
    render(<GameHomePage />)

    const btn = screen.getByText(/Monthly Check-In/)
    fireEvent.click(btn)

    expect(mockPush).toHaveBeenCalledWith("/game/check-in/setup")
  })

  it("navigates to deep-dive setup when Start Exploring is clicked", () => {
    render(<GameHomePage />)

    const btn = screen.getByText(/Start Exploring/)
    fireEvent.click(btn)

    expect(mockPush).toHaveBeenCalledWith("/game/deep-dive/setup")
  })

  it("navigates to date-night setup when Light & Fun is clicked", () => {
    render(<GameHomePage />)

    const btn = screen.getByText(/Light & Fun/)
    fireEvent.click(btn)

    expect(mockPush).toHaveBeenCalledWith("/game/date-night/setup")
  })

  it("navigates to question bank when link is clicked", () => {
    render(<GameHomePage />)

    const btn = screen.getByText(/Question Bank/)
    fireEvent.click(btn)

    expect(mockPush).toHaveBeenCalledWith("/game/bank")
  })

  // ─── Integration: Active session detection ───

  it("calls loadActiveSession on mount", () => {
    render(<GameHomePage />)
    expect(mockLoadActiveSession).toHaveBeenCalled()
  })

  // ─── Category pills for date_night ───

  it("renders category pills for date night mode", () => {
    render(<GameHomePage />)

    // Pills render as "emoji label", e.g. "❤️ Love"
    expect(screen.getByText(/Love/)).toBeTruthy()
    expect(screen.getByText(/Finances/)).toBeTruthy()
    expect(screen.getByText(/Family/)).toBeTruthy()
  })
})
