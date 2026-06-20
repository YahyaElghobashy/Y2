import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import React from "react"
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react"

// ── framer-motion: Proxy passthrough so motion.* + AnimatePresence render ─────
vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    React.forwardRef<HTMLElement, Record<string, unknown>>(({ children, ...props }, ref) => {
      const {
        initial, animate, exit, transition, whileHover, whileTap, whileInView,
        layout, layoutId, variants, drag, mode, ...rest
      } = props as Record<string, unknown>
      void initial; void animate; void exit; void transition; void whileHover
      void whileTap; void whileInView; void layout; void layoutId; void variants; void drag; void mode
      return React.createElement(tag, { ref, ...rest }, children as React.ReactNode)
    })
  const motion = new Proxy({}, { get: (_t, tag: string) => passthrough(tag) })
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  }
})

import rps from "./index"
import {
  beats, resolveThrow, throwHeadline, winsNeeded, matchWinner, THROWS,
} from "./logic"
import type { DecideOption, DecideResult } from "../../contract"

// ════════════════════════════════════════════════════════════════════════════
// Unit — pure logic
// ════════════════════════════════════════════════════════════════════════════

describe("rps/logic", () => {
  it("beats: the classic cycle, nothing else", () => {
    expect(beats("rock", "scissors")).toBe(true)
    expect(beats("scissors", "paper")).toBe(true)
    expect(beats("paper", "rock")).toBe(true)
    expect(beats("scissors", "rock")).toBe(false)
    expect(beats("paper", "scissors")).toBe(false)
    expect(beats("rock", "paper")).toBe(false)
    for (const t of THROWS) expect(beats(t, t)).toBe(false)
  })

  it("resolveThrow: a-win, b-win, and ties", () => {
    expect(resolveThrow("rock", "scissors")).toBe("a")
    expect(resolveThrow("scissors", "rock")).toBe("b")
    expect(resolveThrow("paper", "paper")).toBeNull()
    expect(resolveThrow("rock", "rock")).toBeNull()
  })

  it("throwHeadline: decided vs tie phrasing", () => {
    expect(throwHeadline("rock", "scissors")).toBe("Rock beats Scissors")
    expect(throwHeadline("scissors", "rock")).toBe("Rock beats Scissors")
    expect(throwHeadline("paper", "paper")).toBe("Both threw Paper")
  })

  it("winsNeeded: majority of N", () => {
    expect(winsNeeded(1)).toBe(1)
    expect(winsNeeded(3)).toBe(2)
    expect(winsNeeded(5)).toBe(3)
    expect(winsNeeded(0)).toBe(1) // clamps to a sane floor
  })

  it("matchWinner: live until majority reached", () => {
    expect(matchWinner(0, 0, 3)).toBeNull()
    expect(matchWinner(1, 1, 3)).toBeNull()
    expect(matchWinner(2, 1, 3)).toBe("a")
    expect(matchWinner(1, 2, 3)).toBe("b")
    expect(matchWinner(1, 0, 1)).toBe("a")
    expect(matchWinner(3, 2, 5)).toBe("a")
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Interaction + integration — the Component
// ════════════════════════════════════════════════════════════════════════════

const Game = rps.Component
const OPTIONS: DecideOption[] = [
  { id: "o1", label: "Pizza" },
  { id: "o2", label: "Sushi" },
]
const REVEAL_MS = 560 * 3 + 360 + 50 // full countdown + flash + slack

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

/** Run one throw-off from a `pickA` stage and flush to the reveal. */
function throwOff(a: string, b: string) {
  fireEvent.click(screen.getByTestId(`rps-pick-${a}`)) // A picks (hidden)
  fireEvent.click(screen.getByTestId("rps-pass-continue")) // hand over
  fireEvent.click(screen.getByTestId(`rps-pick-${b}`)) // B picks → shoot
  advance(REVEAL_MS)
}

describe("rps/Component", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("exports a contract-shaped SelectorGame", () => {
    expect(rps.id).toBe("rps")
    expect(rps.kind).toBe("binary")
    expect(rps.label).toBe("Rock Paper Scissors")
    expect(rps.arabicLabel.length).toBeGreaterThan(0)
    expect(typeof rps.Component).toBe("function")
  })

  it("guards against fewer than two options", () => {
    render(<Game options={[{ id: "x", label: "Only" }]} onResult={vi.fn()} />)
    expect(screen.getByText(/add two options/i)).toBeInTheDocument()
  })

  it("starts on the stakes setup with both sides bound by default", () => {
    render(<Game options={OPTIONS} onResult={vi.fn()} />)
    expect(screen.getByTestId("rps-setup")).toBeInTheDocument()
    expect((screen.getByTestId("rps-bind-a") as HTMLSelectElement).value).toBe("o1")
    expect((screen.getByTestId("rps-bind-b") as HTMLSelectElement).value).toBe("o2")
    expect((screen.getByTestId("rps-name-a") as HTMLInputElement).value).toBe("Player A")
  })

  it("plays a best-of-1 match and emits the winning side's bound option once", () => {
    const onResult = vi.fn<(r: DecideResult) => void>()
    render(<Game options={OPTIONS} onResult={onResult} />)

    fireEvent.click(screen.getByTestId("rps-bestof-1"))
    fireEvent.click(screen.getByTestId("rps-start"))

    // A=rock beats B=scissors → A wins, match over at best-of-1
    throwOff("rock", "scissors")

    expect(screen.getByTestId("rps-headline")).toHaveTextContent("Rock beats Scissors")
    fireEvent.click(screen.getByTestId("rps-verdict"))

    expect(onResult).toHaveBeenCalledTimes(1)
    const r = onResult.mock.calls[0][0]
    expect(r.winner?.id).toBe("o1")
    expect(r.winner?.label).toBe("Pizza")
    expect(r.detail).toMatchObject({ tool: "rps", bestOf: 1, winnerSide: "a", scoreA: 1, scoreB: 0 })
    expect((r.detail?.rounds as unknown[]).length).toBe(1)
    expect(r.summary).toContain("Pizza wins")
  })

  it("a tie replays the same round without scoring", () => {
    const onResult = vi.fn()
    render(<Game options={OPTIONS} onResult={onResult} />)
    fireEvent.click(screen.getByTestId("rps-start")) // default best-of-3

    throwOff("rock", "rock") // tie
    expect(screen.getByTestId("rps-headline")).toHaveTextContent(/tie/i)
    expect(screen.getByTestId("rps-again")).toBeInTheDocument()
    expect(screen.queryByTestId("rps-verdict")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("rps-again"))
    // Back to a fresh secret pick for the SAME round — score still 0–0
    expect(screen.getByTestId("rps-pick-rock")).toBeInTheDocument()
    expect(screen.getByText(/Round 1/)).toBeInTheDocument()
    expect(onResult).not.toHaveBeenCalled()
  })

  it("needs two round wins for best-of-3 and maps the bound option", () => {
    const onResult = vi.fn<(r: DecideResult) => void>()
    render(<Game options={OPTIONS} onResult={onResult} />)
    fireEvent.click(screen.getByTestId("rps-start"))

    // Round 1: B wins (scissors beats paper)
    throwOff("paper", "scissors")
    expect(screen.queryByTestId("rps-verdict")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("rps-next"))

    // Round 2: B wins again → match over (0–2)
    throwOff("rock", "paper")
    fireEvent.click(screen.getByTestId("rps-verdict"))

    expect(onResult).toHaveBeenCalledTimes(1)
    const r = onResult.mock.calls[0][0]
    expect(r.winner?.id).toBe("o2") // Side 2 = Sushi
    expect(r.detail).toMatchObject({ winnerSide: "b", scoreA: 0, scoreB: 2, bestOf: 3 })
  })

  it("hides Player A's pick during the handoff", () => {
    render(<Game options={OPTIONS} onResult={vi.fn()} />)
    fireEvent.click(screen.getByTestId("rps-start"))
    fireEvent.click(screen.getByTestId("rps-pick-scissors"))

    // Handoff screen: no chooser, no leak of the secret throw
    expect(screen.getByText(/Locked in/i)).toBeInTheDocument()
    expect(screen.queryByTestId("rps-pick-rock")).not.toBeInTheDocument()
    expect(screen.queryByTestId("rps-pick-scissors")).not.toBeInTheDocument()
  })

  it("respects a free-text stake and a rebound option in the result", () => {
    const onResult = vi.fn<(r: DecideResult) => void>()
    render(<Game options={OPTIONS} onResult={onResult} />)

    fireEvent.change(screen.getByTestId("rps-name-a"), { target: { value: "Yahya" } })
    fireEvent.change(screen.getByTestId("rps-bind-a"), { target: { value: "o2" } }) // A now plays Sushi
    fireEvent.change(screen.getByTestId("rps-stake"), { target: { value: "loser cooks" } })
    fireEvent.click(screen.getByTestId("rps-bestof-1"))
    fireEvent.click(screen.getByTestId("rps-start"))

    throwOff("rock", "scissors") // A wins
    fireEvent.click(screen.getByTestId("rps-verdict"))

    const r = onResult.mock.calls[0][0]
    expect(r.winner?.label).toBe("Sushi")
    expect(r.summary).toContain("Yahya")
    expect(r.summary).toContain("loser cooks")
    expect(r.detail).toMatchObject({ stake: "loser cooks", players: { a: "Yahya", b: "Player B" } })
  })

  it("emits onResult only once even if the verdict is tapped twice", () => {
    const onResult = vi.fn()
    render(<Game options={OPTIONS} onResult={onResult} />)
    fireEvent.click(screen.getByTestId("rps-bestof-1"))
    fireEvent.click(screen.getByTestId("rps-start"))
    throwOff("rock", "scissors")

    fireEvent.click(screen.getByTestId("rps-verdict"))
    fireEvent.click(screen.getByTestId("rps-verdict"))
    expect(onResult).toHaveBeenCalledTimes(1)
  })
})
