import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"

// ── Mocks (BEFORE importing the module under test) ──────────────────────────

// framer-motion: Proxy passthrough — every motion.* tag + AnimatePresence + useReducedMotion.
vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    React.forwardRef<HTMLElement, Record<string, unknown>>(({ children, ...props }, ref) => {
      const {
        initial,
        animate,
        exit,
        transition,
        whileHover,
        whileTap,
        whileInView,
        layout,
        layoutId,
        variants,
        drag,
        ...rest
      } = props as Record<string, unknown>
      void initial; void animate; void exit; void transition; void whileHover
      void whileTap; void whileInView; void layout; void layoutId; void variants; void drag
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

// Sound + haptic: spy-able no-ops so we can assert they fire without touching WebAudio.
vi.mock("@/components/decide/shared/primitives", () => ({
  playDecideSound: vi.fn(),
  haptic: vi.fn(),
}))

import bonus from "../index"
import { REVEAL_MS } from "../shared"
import { haptic, playDecideSound } from "@/components/decide/shared/primitives"
import type { DecideOption, DecideResult } from "../../../contract"

// ── Helpers ─────────────────────────────────────────────────────────────────

const Bonus = bonus.Component

function opts(n: number): DecideOption[] {
  return Array.from({ length: n }, (_, i) => ({ id: `o${i}`, label: `Opt${i}` }))
}

function renderBonus(n = 4) {
  const onResult = vi.fn<(r: DecideResult) => void>()
  render(<Bonus options={opts(n)} onResult={onResult} />)
  return onResult
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

/** The single saved result after a sub-tool commits (advances past the reveal beat). */
function commitResult(onResult: ReturnType<typeof vi.fn>): DecideResult {
  advance(REVEAL_MS)
  expect(onResult).toHaveBeenCalledTimes(1)
  return onResult.mock.calls[0][0] as DecideResult
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

// ── Module export contract (unit) ────────────────────────────────────────────

describe("bonus module export", () => {
  it("keeps the frozen SelectorGame shape (id/label/kind that TheDecider depends on)", () => {
    expect(bonus.id).toBe("bonus")
    expect(bonus.kind).toBe("playful")
    expect(bonus.label).toBe("Ask Fate") // asserted verbatim by TheDecider.test
    expect(bonus.arabicLabel.length).toBeGreaterThan(0)
    expect(bonus.asset).toMatch(/^\/assets\//)
    expect(typeof bonus.Component).toBe("function")
    expect(bonus.whenToUse.length).toBeGreaterThan(0)
  })
})

// ── Menu navigation (interaction) ─────────────────────────────────────────────

describe("decider menu", () => {
  const MENU = [
    "bonus-menu-coin",
    "bonus-menu-eightball",
    "bonus-menu-bracket",
    "bonus-menu-straws",
    "bonus-menu-countdown",
  ] as const

  it("renders all five quick-decider cards", () => {
    renderBonus()
    for (const id of MENU) expect(screen.getByTestId(id)).toBeInTheDocument()
  })

  it("opens a sub-tool and the back button returns to the menu", () => {
    renderBonus()
    fireEvent.click(screen.getByTestId("bonus-menu-coin"))
    expect(screen.getByTestId("coin-flip-btn")).toBeInTheDocument()
    expect(screen.queryByTestId("bonus-menu-coin")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("bonus-back"))
    expect(screen.getByTestId("bonus-menu-coin")).toBeInTheDocument()
    expect(screen.queryByTestId("coin-flip-btn")).not.toBeInTheDocument()
  })

  it("does not call onResult just from opening a tool", () => {
    const onResult = renderBonus()
    fireEvent.click(screen.getByTestId("bonus-menu-eightball"))
    advance(REVEAL_MS)
    expect(onResult).not.toHaveBeenCalled()
  })
})

// ── Coin Flip ─────────────────────────────────────────────────────────────────

describe("coin flip", () => {
  it("flips and commits one result whose winner is one of the first two options", () => {
    const onResult = renderBonus(2)
    fireEvent.click(screen.getByTestId("bonus-menu-coin"))
    fireEvent.click(screen.getByTestId("coin-flip-btn"))

    // The reveal beat is respected: nothing commits until REVEAL_MS elapses.
    expect(onResult).not.toHaveBeenCalled()

    const r = commitResult(onResult)
    expect(["Opt0", "Opt1"]).toContain(r.winner?.label)
    expect(r.summary).toMatch(/wins$/)
    expect(r.detail).toMatchObject({ subTool: "coin-flip", heads: "Opt0", tails: "Opt1" })
    expect(["heads", "tails"]).toContain(r.detail?.face)
    // The landed face must agree with the winning option it maps to.
    expect(r.winner?.label).toBe(r.detail?.face === "heads" ? "Opt0" : "Opt1")
    expect(playDecideSound).toHaveBeenCalledWith("spin")
    expect(haptic).toHaveBeenCalled()
  })

  it("does not commit if the user backs out during the reveal beat", () => {
    const onResult = renderBonus(2)
    fireEvent.click(screen.getByTestId("bonus-menu-coin"))
    fireEvent.click(screen.getByTestId("coin-flip-btn"))
    // Leave the tool (unmounts CoinFlip) before the pending commit fires.
    fireEvent.click(screen.getByTestId("bonus-back"))
    advance(REVEAL_MS * 2)
    expect(onResult).not.toHaveBeenCalled()
    expect(screen.getByTestId("bonus-menu-coin")).toBeInTheDocument()
  })

  it("binds only the first two options when more are supplied", () => {
    const onResult = renderBonus(3)
    fireEvent.click(screen.getByTestId("bonus-menu-coin"))
    expect(screen.getByText(/flips the first two options/i)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("coin-flip-btn"))

    const r = commitResult(onResult)
    expect(["Opt0", "Opt1"]).toContain(r.winner?.label)
    expect(r.winner?.label).not.toBe("Opt2")
  })

  it("commits exactly once even if the flip button is pressed twice", () => {
    const onResult = renderBonus(2)
    fireEvent.click(screen.getByTestId("bonus-menu-coin"))
    const btn = screen.getByTestId("coin-flip-btn")
    fireEvent.click(btn)
    fireEvent.click(btn)
    advance(REVEAL_MS)
    expect(onResult).toHaveBeenCalledTimes(1)
  })
})

// ── Magic 8-Ball ──────────────────────────────────────────────────────────────

describe("magic 8-ball", () => {
  it("answers with flavor text and commits a real option", () => {
    const onResult = renderBonus(3)
    fireEvent.click(screen.getByTestId("bonus-menu-eightball"))
    fireEvent.click(screen.getByTestId("eightball-ask-btn"))

    const r = commitResult(onResult)
    expect(["Opt0", "Opt1", "Opt2"]).toContain(r.winner?.label)
    expect(r.detail?.subTool).toBe("magic-8-ball")
    expect(typeof r.detail?.phrase).toBe("string")
    expect((r.detail?.phrase as string).length).toBeGreaterThan(0)
    expect(playDecideSound).toHaveBeenCalledWith("roll")
    expect(haptic).toHaveBeenCalled()
  })
})

// ── Knockout / bracket ────────────────────────────────────────────────────────

describe("knockout bracket", () => {
  /** Single-elimination always runs N-1 matches; always picking the left side reaches the champion. */
  function driveToChampion(n: number) {
    for (let i = 0; i < n - 1; i++) fireEvent.click(screen.getByTestId("bracket-pick-0"))
  }

  it("shows round/match progress for a 4-option field", () => {
    renderBonus(4)
    fireEvent.click(screen.getByTestId("bonus-menu-bracket"))
    expect(screen.getByText(/Round 1 · Match 1\/2/)).toBeInTheDocument()
  })

  it("treats a non-final pick as a step (tick sound, no commit yet)", () => {
    const onResult = renderBonus(4)
    fireEvent.click(screen.getByTestId("bonus-menu-bracket"))
    fireEvent.click(screen.getByTestId("bracket-pick-0")) // match 1 of 2 → not final
    expect(playDecideSound).toHaveBeenLastCalledWith("tick")
    advance(REVEAL_MS)
    expect(onResult).not.toHaveBeenCalled()
    expect(screen.getByText(/Round 1 · Match 2\/2/)).toBeInTheDocument()
  })

  // Even/odd fields exercise the bye + multi-round fold-in paths.
  it.each([
    { n: 4, rounds: 2 },
    { n: 3, rounds: 2 }, // odd → round-1 bye
    { n: 5, rounds: 3 }, // odd at two successive rounds
  ])("crowns one champion for a $n-option field with the right round count", ({ n, rounds }) => {
    const onResult = renderBonus(n)
    fireEvent.click(screen.getByTestId("bonus-menu-bracket"))
    driveToChampion(n)

    const r = commitResult(onResult)
    expect(r.detail?.subTool).toBe("knockout")
    expect(r.detail?.contenders).toBe(n)
    expect(r.detail?.rounds).toBe(rounds)
    expect(r.winners).toHaveLength(1)
    expect(opts(n).map((o) => o.label)).toContain(r.winner?.label)
    expect(playDecideSound).toHaveBeenCalledWith("win")
  })

  it("can break a match at random (2 options → one match → champion)", () => {
    const onResult = renderBonus(2)
    fireEvent.click(screen.getByTestId("bonus-menu-bracket"))
    fireEvent.click(screen.getByTestId("bracket-random"))

    const r = commitResult(onResult)
    expect(["Opt0", "Opt1"]).toContain(r.winner?.label)
    expect(r.detail?.subTool).toBe("knockout")
  })
})

// ── Draw Straws ───────────────────────────────────────────────────────────────

describe("draw straws", () => {
  it("commits exactly once when the short straw turns up, regardless of pull order", () => {
    const N = 5
    const onResult = renderBonus(N)
    fireEvent.click(screen.getByTestId("bonus-menu-straws"))
    // Pull every straw; exactly one is short and triggers the single commit.
    for (let i = 0; i < N; i++) fireEvent.click(screen.getByTestId(`straw-${i}`))

    const r = commitResult(onResult)
    expect(r.detail?.subTool).toBe("draw-straws")
    expect(typeof r.detail?.pulls).toBe("number")
    expect(r.detail?.pulls as number).toBeGreaterThanOrEqual(1)
    expect(opts(N).map((o) => o.label)).toContain(r.winner?.label)
    expect(playDecideSound).toHaveBeenCalledWith("win")
  })

  it("does not double-commit once the short straw is found", () => {
    const N = 4
    const onResult = renderBonus(N)
    fireEvent.click(screen.getByTestId("bonus-menu-straws"))
    for (let i = 0; i < N; i++) fireEvent.click(screen.getByTestId(`straw-${i}`))
    // Pull again after the short straw already committed — must stay at one.
    for (let i = 0; i < N; i++) fireEvent.click(screen.getByTestId(`straw-${i}`))
    advance(REVEAL_MS)
    expect(onResult).toHaveBeenCalledTimes(1)
  })
})

// ── Countdown Picker ──────────────────────────────────────────────────────────

describe("countdown picker", () => {
  it("ticks down once per second", () => {
    renderBonus(3)
    fireEvent.click(screen.getByTestId("bonus-menu-countdown"))
    expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("10")
    advance(3000)
    expect(screen.getByTestId("countdown-seconds")).toHaveTextContent("7")
  })

  it("pressure-picks immediately on tap", () => {
    const onResult = renderBonus(3)
    fireEvent.click(screen.getByTestId("bonus-menu-countdown"))
    fireEvent.click(screen.getByTestId("countdown-pick-btn"))

    const r = commitResult(onResult)
    expect(r.detail?.subTool).toBe("countdown")
    expect(typeof r.detail?.pickedAt).toBe("number")
    expect(["Opt0", "Opt1", "Opt2"]).toContain(r.winner?.label)
    expect(playDecideSound).toHaveBeenCalledWith("win")
  })

  it("auto-picks when the clock reaches zero (pickedAt 0)", () => {
    const onResult = renderBonus(3)
    fireEvent.click(screen.getByTestId("bonus-menu-countdown"))
    advance(10_000) // run the clock out
    const r = commitResult(onResult)
    expect(r.detail?.pickedAt).toBe(0)
    expect(["Opt0", "Opt1", "Opt2"]).toContain(r.winner?.label)
  })

  it("does not double-commit if tapped after auto-pick", () => {
    const onResult = renderBonus(3)
    fireEvent.click(screen.getByTestId("bonus-menu-countdown"))
    advance(10_000)
    fireEvent.click(screen.getByTestId("countdown-pick-btn"))
    advance(REVEAL_MS)
    expect(onResult).toHaveBeenCalledTimes(1)
  })
})
