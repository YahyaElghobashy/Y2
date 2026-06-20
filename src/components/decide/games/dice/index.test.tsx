import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"

// ── framer-motion mock: passthrough motion.* + AnimatePresence + useReducedMotion.
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
      void initial
      void animate
      void exit
      void transition
      void whileHover
      void whileTap
      void whileInView
      void layout
      void layoutId
      void variants
      void drag
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

import dice, { resolveRoll, mapIndex, rollFace, type DiceCount } from "./index"
import type { DecideOption, DecideResult } from "../../contract"

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Deterministic PRNG (mulberry32) so seeded outcomes are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const opts = (...labels: string[]): DecideOption[] => labels.map((label, i) => ({ id: `o${i}`, label }))

/** Total roll + reveal window for the default (non-reduced) timings. */
const FULL_MS = 1300 + 700 + 20

// ════════════════════════════════════════════════════════════════════════════
// UNIT — pure roll logic
// ════════════════════════════════════════════════════════════════════════════

describe("dice/mapIndex", () => {
  it("maps a single die (total-1) mod n", () => {
    expect(mapIndex(1, 1, 3)).toBe(0)
    expect(mapIndex(2, 1, 3)).toBe(1)
    expect(mapIndex(3, 1, 3)).toBe(2)
    expect(mapIndex(4, 1, 3)).toBe(0)
    expect(mapIndex(6, 1, 3)).toBe(2)
  })

  it("maps two dice (total-2) mod n", () => {
    expect(mapIndex(2, 2, 4)).toBe(0)
    expect(mapIndex(5, 2, 4)).toBe(3)
    expect(mapIndex(6, 2, 4)).toBe(0)
    expect(mapIndex(12, 2, 4)).toBe(2)
  })

  it("returns -1 when there are no options", () => {
    expect(mapIndex(4, 1, 0)).toBe(-1)
    expect(mapIndex(7, 2, 0)).toBe(-1)
  })
})

describe("dice/rollFace", () => {
  it("always returns an integer in 1..6", () => {
    const rng = mulberry32(99)
    for (let i = 0; i < 500; i++) {
      const f = rollFace(rng)
      expect(Number.isInteger(f)).toBe(true)
      expect(f).toBeGreaterThanOrEqual(1)
      expect(f).toBeLessThanOrEqual(6)
    }
  })

  it("covers all six faces over many rolls", () => {
    const rng = mulberry32(7)
    const seen = new Set<number>()
    for (let i = 0; i < 300; i++) seen.add(rollFace(rng))
    expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6]))
  })
})

describe("dice/resolveRoll — empty options (plain roll)", () => {
  it("returns no winner and the rolled number for 1 die", () => {
    const out = resolveRoll([], 1, mulberry32(3))
    expect(out.winner).toBeNull()
    expect(out.index).toBeNull()
    expect(out.dice).toHaveLength(1)
    expect(out.total).toBe(out.dice[0])
  })

  it("returns no winner for 2 dice with a summed total", () => {
    const out = resolveRoll([], 2, mulberry32(3))
    expect(out.winner).toBeNull()
    expect(out.dice).toHaveLength(2)
    expect(out.total).toBe(out.dice[0] + out.dice[1])
  })
})

describe("dice/resolveRoll — invariants (faces always match the winner)", () => {
  const cases: Array<{ count: DiceCount; n: number }> = [
    { count: 1, n: 2 },
    { count: 1, n: 3 },
    { count: 1, n: 6 },
    { count: 1, n: 8 }, // > range → fallback branch exercised
    { count: 2, n: 2 },
    { count: 2, n: 5 },
    { count: 2, n: 11 },
  ]

  for (const { count, n } of cases) {
    it(`count=${count} n=${n}: winner ∈ options, dice in range, mapping === winner index`, () => {
      const options = opts(...Array.from({ length: n }, (_, i) => `opt-${i}`))
      const rng = mulberry32(n * 31 + count)
      for (let i = 0; i < 200; i++) {
        const out = resolveRoll(options, count, rng)
        // Winner is a real element of options.
        expect(out.winner).not.toBeNull()
        expect(options).toContain(out.winner as DecideOption)
        // Dice are the right count and each in 1..6.
        expect(out.dice).toHaveLength(count)
        for (const d of out.dice) {
          expect(d).toBeGreaterThanOrEqual(1)
          expect(d).toBeLessThanOrEqual(6)
        }
        expect(out.total).toBe(out.dice.reduce((s, d) => s + d, 0))
        // The crux: the displayed faces' mapping resolves to exactly the winner.
        expect(out.index).toBe(options.indexOf(out.winner as DecideOption))
        expect(mapIndex(out.total, count, n)).toBe(out.index)
      }
    })
  }

  it("two dice totals always fall within 2..12", () => {
    const options = opts("a", "b", "c")
    const rng = mulberry32(123)
    for (let i = 0; i < 200; i++) {
      const out = resolveRoll(options, 2, rng)
      expect(out.total).toBeGreaterThanOrEqual(2)
      expect(out.total).toBeLessThanOrEqual(12)
    }
  })

  it("is deterministic for a given seed", () => {
    const options = opts("a", "b", "c", "d")
    const a = resolveRoll(options, 2, mulberry32(42))
    const b = resolveRoll(options, 2, mulberry32(42))
    expect(b).toEqual(a)
  })

  it("respects weights — a dominant option wins the vast majority of rolls", () => {
    const options: DecideOption[] = [
      { id: "x", label: "rare", weight: 1 },
      { id: "y", label: "common", weight: 50 },
    ]
    const rng = mulberry32(2024)
    let common = 0
    for (let i = 0; i < 400; i++) {
      if (resolveRoll(options, 1, rng).winner?.id === "y") common++
    }
    expect(common).toBeGreaterThan(360) // ~98% expected
  })
})

// ════════════════════════════════════════════════════════════════════════════
// META — registry shape
// ════════════════════════════════════════════════════════════════════════════

describe("dice — SelectorGame export", () => {
  it("exposes the frozen contract shape (id, kind=playful, asset, Component)", () => {
    expect(dice.id).toBe("dice")
    expect(dice.kind).toBe("playful") // decider.test.ts depends on this
    expect(typeof dice.label).toBe("string")
    expect(dice.arabicLabel.length).toBeGreaterThan(0)
    expect(dice.asset).toMatch(/^\/assets\//)
    expect(typeof dice.Component).toBe("function")
  })
})

// ════════════════════════════════════════════════════════════════════════════
// INTERACTION + INTEGRATION — the component
// ════════════════════════════════════════════════════════════════════════════

const Dice = dice.Component

describe("RollTheDice — interaction & integration", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms)
    })
  }

  it("renders the mode toggle and run button, defaulting to one die", () => {
    render(<Dice options={opts("Tea", "Coffee")} onResult={vi.fn()} />)
    expect(screen.getByTestId("dice-mode-1")).toHaveAttribute("aria-checked", "true")
    expect(screen.getByTestId("dice-mode-2")).toHaveAttribute("aria-checked", "false")
    expect(screen.getAllByTestId("die")).toHaveLength(1)
    expect(screen.getByTestId("decide-game-run")).toHaveTextContent("Roll")
  })

  it("switches to two dice when the 2-dice mode is selected", () => {
    render(<Dice options={opts("Tea", "Coffee")} onResult={vi.fn()} />)
    fireEvent.click(screen.getByTestId("dice-mode-2"))
    expect(screen.getAllByTestId("die")).toHaveLength(2)
    expect(screen.getByTestId("decide-game-run")).toHaveTextContent("Roll both")
  })

  it("goes idle → rolling → settled and only calls onResult after the reveal beat", () => {
    const onResult = vi.fn()
    render(<Dice options={opts("Pizza", "Sushi", "Koshari")} onResult={onResult} />)

    fireEvent.click(screen.getByTestId("decide-game-run"))
    advance(10) // flush the state update; still mid-tumble (< 1300ms)

    // Rolling: button disabled + labelled, dice in the rolling phase.
    // (The framer mock returns a fresh component per render, so re-query nodes.)
    expect(screen.getByTestId("decide-game-run")).toBeDisabled()
    expect(screen.getByTestId("decide-game-run")).toHaveTextContent("Rolling…")
    expect(screen.getAllByTestId("die")[0]).toHaveAttribute("data-phase", "rolling")
    expect(onResult).not.toHaveBeenCalled()

    // After the tumble it settles, but still hasn't reported.
    advance(1300)
    expect(screen.getAllByTestId("die")[0]).toHaveAttribute("data-phase", "settled")
    expect(screen.getByTestId("dice-reveal")).toBeInTheDocument()
    expect(onResult).not.toHaveBeenCalled()

    // Only after the reveal window does it hand the result to the hub — exactly once.
    advance(720)
    expect(onResult).toHaveBeenCalledTimes(1)
  })

  it("emits a consistent payload: settled faces map to the winning option", () => {
    const onResult = vi.fn()
    const options = opts("Pizza", "Sushi", "Koshari", "Ramen")
    render(<Dice options={options} onResult={onResult} />)

    fireEvent.click(screen.getByTestId("decide-game-run"))
    advance(1300)

    // The faces shown after settle are the ones we should report.
    const shownFaces = screen.getAllByTestId("die").map((d) => Number(d.getAttribute("data-face")))

    advance(720)
    const result = onResult.mock.calls[0][0] as DecideResult
    const detail = result.detail as { tool: string; mode: string; dice: number[]; total: number; index: number }

    expect(detail.tool).toBe("dice")
    expect(detail.mode).toBe("single")
    expect(detail.dice).toEqual(shownFaces) // displayed === reported
    expect(detail.total).toBe(shownFaces.reduce((s, d) => s + d, 0))

    // Winner is a real option and the dice mapping resolves to it.
    expect(result.winner).not.toBeNull()
    expect(options.map((o) => o.label)).toContain(result.winner?.label)
    expect(mapIndex(detail.total, 1, options.length)).toBe(options.indexOf(result.winner as DecideOption))
    expect(result.summary).toBe(`${result.winner?.label} wins`)
    // The in-game reveal shows the winning label.
    expect(screen.getByTestId("dice-reveal")).toHaveTextContent(result.winner?.label as string)
  })

  it("reports two dice with a summed total in two-dice mode", () => {
    const onResult = vi.fn()
    const options = opts("A", "B", "C", "D", "E")
    render(<Dice options={options} onResult={onResult} />)

    fireEvent.click(screen.getByTestId("dice-mode-2"))
    fireEvent.click(screen.getByTestId("decide-game-run"))
    advance(FULL_MS)

    const result = onResult.mock.calls[0][0] as DecideResult
    const detail = result.detail as { mode: string; dice: number[]; total: number }
    expect(detail.mode).toBe("pair")
    expect(detail.dice).toHaveLength(2)
    expect(detail.total).toBe(detail.dice[0] + detail.dice[1])
    expect(mapIndex(detail.total, 2, options.length)).toBe(options.indexOf(result.winner as DecideOption))
  })

  it("with no options it rolls a plain number (null winner, 'Rolled N' summary)", () => {
    const onResult = vi.fn()
    render(<Dice options={[]} onResult={onResult} />)

    fireEvent.click(screen.getByTestId("decide-game-run"))
    advance(FULL_MS)

    const result = onResult.mock.calls[0][0] as DecideResult
    expect(result.winner).toBeNull()
    const detail = result.detail as { index: number | null; total: number }
    expect(detail.index).toBeNull()
    expect(result.summary).toBe(`Rolled ${detail.total}`)
    expect(screen.getByTestId("dice-reveal")).toHaveTextContent(`Rolled ${detail.total}`)
  })

  it("ignores extra clicks while a roll is in flight (single onResult)", () => {
    const onResult = vi.fn()
    render(<Dice options={opts("A", "B")} onResult={onResult} />)

    const run = screen.getByTestId("decide-game-run")
    fireEvent.click(run)
    advance(400)
    fireEvent.click(run) // ignored — still rolling
    fireEvent.click(run)
    advance(FULL_MS)

    expect(onResult).toHaveBeenCalledTimes(1)
  })

  it("clears its timers on unmount — no result after teardown", () => {
    const onResult = vi.fn()
    const { unmount } = render(<Dice options={opts("A", "B")} onResult={onResult} />)
    fireEvent.click(screen.getByTestId("decide-game-run"))
    advance(400)
    unmount()
    advance(FULL_MS)
    expect(onResult).not.toHaveBeenCalled()
  })

  it("runs many rolls and never reports an inconsistent winner (integration)", () => {
    const options = opts("A", "B", "C")
    for (let i = 0; i < 12; i++) {
      const onResult = vi.fn()
      const { unmount } = render(<Dice options={options} onResult={onResult} />)
      fireEvent.click(screen.getByTestId("decide-game-run"))
      advance(FULL_MS)
      const result = onResult.mock.calls[0][0] as DecideResult
      const detail = result.detail as { total: number }
      expect(mapIndex(detail.total, 1, options.length)).toBe(options.indexOf(result.winner as DecideOption))
      unmount()
    }
  })
})
