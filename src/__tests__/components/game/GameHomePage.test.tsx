import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ─── Mocks ───
//
// The /game page was redesigned. It now renders the presentational PlayView
// (resume banner from activeSession + three mode links + wheel/bank), fed by
// the useGameEngine domain hook. Navigation is via <Link href> — there is no
// router.push and the page no longer reads useAuth directly (the hook does).
// We mock useGameEngine to return controlled data so the page renders, and
// mock AuthProvider defensively (imported transitively by the hook module).

const mockLoadActiveSession = vi.fn()

// Mutable holder so individual tests can flip activeSession before rendering.
const engineState: { activeSession: unknown } = { activeSession: null }

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => ({
    activeSession: engineState.activeSession,
    loadActiveSession: mockLoadActiveSession,
  }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    partner: { id: "user-2", display_name: "Yara" },
    profile: null,
    isLoading: false,
  }),
}))

// next/link → plain anchor so we can assert real hrefs.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// framer-motion → strip animation props, keep DOM (repo Proxy/strip pattern).
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLDivElement>,
      ) => {
        const { initial, animate, exit, transition, variants, whileHover, whileTap, layout, layoutId, ...rest } = props
        void initial; void animate; void exit; void transition; void variants
        void whileHover; void whileTap; void layout; void layoutId
        return <div ref={ref} {...rest}>{children}</div>
      },
    ),
    button: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLButtonElement>,
      ) => {
        const { initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, ...rest } = props
        void initial; void animate; void exit; void transition
        void whileHover; void whileTap; void layout; void layoutId
        return <button ref={ref} {...rest}>{children}</button>
      },
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
}))

import GameHomePage from "@/app/(main)/game/page"

// Helper: find the nearest enclosing <a> for a text node (mode/utility links).
function linkFor(text: RegExp | string): HTMLAnchorElement {
  const el = screen.getByText(text)
  const anchor = el.closest("a")
  if (!anchor) throw new Error(`No enclosing <a> for "${String(text)}"`)
  return anchor as HTMLAnchorElement
}

describe("GameHomePage (/game → PlayView)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    engineState.activeSession = null
  })

  // ─── Unit: header + surface render from the new PlayView ───

  it("renders the Play heading (not the removed 'Together Time')", () => {
    render(<GameHomePage />)
    expect(screen.getByRole("heading", { name: "Play" })).toBeInTheDocument()
    expect(screen.getByText("نلعب")).toBeInTheDocument()
    expect(screen.queryByText(/Together Time/)).toBeNull()
  })

  it("renders the three game-mode cards with new names + Arabic + copy", () => {
    render(<GameHomePage />)

    // English names (redesigned, shortened)
    expect(screen.getByText("Check-In")).toBeInTheDocument()
    expect(screen.getByText("Deep Dive")).toBeInTheDocument()
    expect(screen.getByText("Date Night")).toBeInTheDocument()

    // Arabic labels (redesigned)
    expect(screen.getByText("اطمئنان")).toBeInTheDocument()
    expect(screen.getByText("غوص")).toBeInTheDocument()
    expect(screen.getByText("ليلة")).toBeInTheDocument()

    // Descriptions (redesigned copy)
    expect(screen.getByText(/Five quick questions/)).toBeInTheDocument()
    expect(screen.getByText(/One topic\. All the way down\./)).toBeInTheDocument()
    expect(screen.getByText(/Truth, dare, and CoYYns on the line\./)).toBeInTheDocument()
  })

  it("renders the Wheel and Question Bank utility cards", () => {
    render(<GameHomePage />)
    expect(screen.getByText("Spin the Wheel")).toBeInTheDocument()
    expect(screen.getByText("Question Bank")).toBeInTheDocument()
  })

  // ─── Integration: mode + utility links point at the live /game flows ───

  it("links each mode card to its real route", () => {
    render(<GameHomePage />)
    expect(linkFor("Check-In")).toHaveAttribute("href", "/game/check-in")
    expect(linkFor("Deep Dive")).toHaveAttribute("href", "/game/deep-dive")
    expect(linkFor("Date Night")).toHaveAttribute("href", "/game/date-night")
  })

  it("links the wheel and question bank cards to their routes", () => {
    render(<GameHomePage />)
    expect(linkFor("Spin the Wheel")).toHaveAttribute("href", "/wheel")
    expect(linkFor("Question Bank")).toHaveAttribute("href", "/game/bank")
  })

  // ─── Integration: the page drives the domain hook ───

  it("calls loadActiveSession on mount (effect wiring)", () => {
    render(<GameHomePage />)
    expect(mockLoadActiveSession).toHaveBeenCalledTimes(1)
  })

  // ─── Unit: resume banner is derived from activeSession ───

  it("hides the resume banner when there is no active session", () => {
    engineState.activeSession = null
    render(<GameHomePage />)
    expect(screen.queryByText("Resume")).toBeNull()
    expect(screen.queryByText(/your turn|their turn/)).toBeNull()
  })

  it("shows the resume banner derived from an active date_night session", () => {
    // completed_rounds 2 → round (2+1)=3; mode date_night → label 'Date Night Game';
    // href built from mode.replace('_','-') + session id.
    engineState.activeSession = {
      id: "sess-9",
      mode: "date_night",
      completed_rounds: 2,
    }
    render(<GameHomePage />)

    expect(screen.getByText("Resume")).toBeInTheDocument()
    // mode label + round number are rendered together in the banner.
    expect(screen.getByText(/Date Night Game · Round 3/)).toBeInTheDocument()
    // yourTurn defaults to true in the page mapping.
    expect(screen.getByText("your turn")).toBeInTheDocument()

    // Banner deep-links into the in-progress session's play route.
    const banner = linkFor("Resume")
    expect(banner).toHaveAttribute(
      "href",
      "/game/date-night/play?session=sess-9",
    )
  })

  it("derives round number and label for a check_in session with no completed rounds", () => {
    // completed_rounds undefined → (0 ?? 0)+1 = round 1; mode check_in.
    engineState.activeSession = {
      id: "sess-1",
      mode: "check_in",
    }
    render(<GameHomePage />)

    expect(screen.getByText(/Alignment Check-In · Round 1/)).toBeInTheDocument()
    expect(linkFor("Resume")).toHaveAttribute(
      "href",
      "/game/check-in/play?session=sess-1",
    )
  })

  // ─── Integration: rendered inside the page-transition wrapper ───

  it("renders PlayView inside the PageTransition wrapper", () => {
    render(<GameHomePage />)
    const wrapper = screen.getByTestId("page-transition")
    expect(wrapper).toContainElement(screen.getByRole("heading", { name: "Play" }))
  })
})
