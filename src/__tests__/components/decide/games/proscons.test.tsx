import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Mocks (ALL vi.mock calls BEFORE importing the module under test) ──────────

// framer-motion: Proxy passthrough — handles every motion.* tag + AnimatePresence + useReducedMotion.
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

import proscons, {
  scoreOptions,
  rankScores,
  buildResult,
  clampWeight,
  type WeighBoard,
} from "@/components/decide/games/proscons"
import type { DecideOption } from "@/components/decide/contract"
import { winnerSummary } from "@/components/decide/shared/random"

const Game = proscons.Component

// ── Helpers ──────────────────────────────────────────────────────────────────

const opts = (...labels: string[]): DecideOption[] =>
  labels.map((label, i) => ({ id: `o${i}`, label }))

/** Set a controlled input's value and wait for React to commit it. */
async function setInput(testId: string, value: string) {
  const input = screen.getByTestId(testId)
  fireEvent.change(input, { target: { value } })
  await waitFor(() => expect(screen.getByTestId(testId)).toHaveValue(value))
}

beforeEach(() => vi.clearAllMocks())

// ══════════════════════════════════════════════════════════════════════════════
// UNIT — pure scoring helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("clampWeight", () => {
  it("clamps to 1–5, rounds, and floors non-finite (NaN/Infinity) to the minimum", () => {
    expect(clampWeight(0)).toBe(1)
    expect(clampWeight(9)).toBe(5)
    expect(clampWeight(3.4)).toBe(3)
    expect(clampWeight(3.6)).toBe(4)
    expect(clampWeight(Number.NaN)).toBe(1)
    expect(clampWeight(Infinity)).toBe(1)
  })
})

describe("scoreOptions", () => {
  const options = opts("A", "B")

  it("sums weighted pros and cons, ignoring blank-text rows", () => {
    const board: WeighBoard = {
      o0: {
        pros: [
          { id: "p1", text: "good", weight: 5 },
          { id: "p2", text: "   ", weight: 4 }, // blank → ignored
          { id: "p3", text: "ok", weight: 2 },
        ],
        cons: [{ id: "c1", text: "bad", weight: 3 }],
      },
      o1: { pros: [], cons: [] },
    }
    const [a, b] = scoreOptions(options, board)
    expect(a).toMatchObject({ pros: 7, cons: 3, net: 4, proCount: 2, conCount: 1 })
    expect(b).toMatchObject({ pros: 0, cons: 0, net: 0, proCount: 0, conCount: 0 })
  })

  it("clamps per-item weights before summing", () => {
    const board: WeighBoard = {
      o0: { pros: [{ id: "p", text: "x", weight: 99 }], cons: [{ id: "c", text: "y", weight: 0 }] },
      o1: { pros: [], cons: [] },
    }
    const [a] = scoreOptions(options, board)
    expect(a.pros).toBe(5) // 99 → 5
    expect(a.cons).toBe(1) // 0 → 1
    expect(a.net).toBe(4)
  })

  it("preserves option order and carries the option's own importance weight", () => {
    const weighted: DecideOption[] = [
      { id: "o0", label: "A", weight: 2 },
      { id: "o1", label: "B", weight: 4 },
    ]
    const scores = scoreOptions(weighted, { o0: { pros: [], cons: [] }, o1: { pros: [], cons: [] } })
    expect(scores.map((s) => s.label)).toEqual(["A", "B"])
    expect(scores.map((s) => s.weight)).toEqual([2, 4])
  })

  it("defaults missing board entries to a zero score", () => {
    const [a] = scoreOptions(opts("Lonely"), {})
    expect(a).toMatchObject({ pros: 0, cons: 0, net: 0 })
  })
})

describe("rankScores", () => {
  it("orders by net descending", () => {
    const ranked = rankScores([
      { id: "a", label: "A", pros: 1, cons: 0, net: 1, proCount: 1, conCount: 0, weight: 1 },
      { id: "b", label: "B", pros: 5, cons: 0, net: 5, proCount: 1, conCount: 0, weight: 1 },
      { id: "c", label: "C", pros: 3, cons: 0, net: 3, proCount: 1, conCount: 0, weight: 1 },
    ])
    expect(ranked.map((s) => s.id)).toEqual(["b", "c", "a"])
  })

  it("breaks net ties by proCount, then option weight, then stable input order", () => {
    const base = { pros: 0, cons: 0, net: 0 }
    // all net 0 → proCount desc, then weight desc, then index
    const ranked = rankScores([
      { id: "first", label: "f", ...base, proCount: 0, conCount: 0, weight: 1 },
      { id: "moreWeight", label: "w", ...base, proCount: 0, conCount: 0, weight: 5 },
      { id: "morePros", label: "p", ...base, proCount: 2, conCount: 2, weight: 1 },
    ])
    expect(ranked.map((s) => s.id)).toEqual(["morePros", "moreWeight", "first"])
  })

  it("does not mutate its input array", () => {
    const input = [
      { id: "a", label: "A", pros: 1, cons: 0, net: 1, proCount: 1, conCount: 0, weight: 1 },
      { id: "b", label: "B", pros: 5, cons: 0, net: 5, proCount: 1, conCount: 0, weight: 1 },
    ]
    const before = input.map((s) => s.id)
    rankScores(input)
    expect(input.map((s) => s.id)).toEqual(before)
  })
})

describe("buildResult", () => {
  const options = opts("Cairo", "Stay")

  it("emits the highest-net option as winner with a winnerSummary, full ranking, and breakdown detail", () => {
    const ranked = rankScores(
      scoreOptions(options, {
        o0: { pros: [{ id: "p", text: "warm", weight: 5 }], cons: [] },
        o1: { pros: [], cons: [{ id: "c", text: "dull", weight: 2 }] },
      }),
    )
    const result = buildResult(options, ranked)
    expect(result.winner?.id).toBe("o0")
    expect(result.winner?.label).toBe("Cairo")
    expect(result.summary).toBe(winnerSummary(result.winner)) // reuses the shared helper
    expect(result.summary).toMatch(/wins$/)
    expect(result.winners?.map((w) => w.id)).toEqual(["o0", "o1"]) // ranked best-first
    expect(result.detail).toMatchObject({ tool: "proscons", winnerId: "o0", winnerNet: 5, margin: 7, tie: false })
    expect(Array.isArray((result.detail as { scores: unknown[] }).scores)).toBe(true)
  })

  it("flags a dead-heat as a tie (margin 0) and still names a winner", () => {
    const ranked = rankScores(scoreOptions(options, { o0: { pros: [], cons: [] }, o1: { pros: [], cons: [] } }))
    const result = buildResult(options, ranked)
    expect(result.detail).toMatchObject({ tie: true, margin: 0 })
    expect(result.winner).not.toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// INTERACTION + INTEGRATION — the rendered game
// ══════════════════════════════════════════════════════════════════════════════

describe("ProsConsGame — edit → weigh → commit flow", () => {
  it("edits pros/cons across two options, weighs, reveals the heavier winner, and persists once on commit", async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    render(<Game options={opts("Move to Cairo", "Stay put")} onResult={onResult} />)

    // Starts on option 0.
    expect(screen.getByTestId("proscons-active-label")).toHaveTextContent("Move to Cairo")

    // Option 0: one strong pro (weight 3 → 5) and a milder con (weight 3).
    await setInput("proscons-pros-input-0", "Sunshine")
    await user.click(within(screen.getByTestId("proscons-pros-input-0").closest("div")!).getByLabelText(/Raise importance/i))
    await user.click(within(screen.getByTestId("proscons-pros-input-0").closest("div")!).getByLabelText(/Raise importance/i))
    await setInput("proscons-cons-input-0", "Pricey")
    // net = pros(5) − cons(3) = +2
    await waitFor(() => expect(screen.getByTestId("proscons-active-net")).toHaveTextContent("+2"))

    // Switch to option 1 and give it a heavier con → negative net.
    await user.click(screen.getByTestId("proscons-tab-1"))
    expect(screen.getByTestId("proscons-active-label")).toHaveTextContent("Stay put")
    await setInput("proscons-cons-input-0", "Boring")
    await user.click(within(screen.getByTestId("proscons-cons-input-0").closest("div")!).getByLabelText(/Raise importance/i))
    // net = 0 − 4 = −4
    await waitFor(() => expect(screen.getByTestId("proscons-active-net")).toHaveTextContent("-4"))
    // The tab badge mirrors the live net.
    expect(screen.getByTestId("proscons-tab-net-1")).toHaveTextContent("-4")

    // Weigh → reveal. onResult must NOT fire yet.
    await user.click(screen.getByTestId("decide-game-run"))
    expect(await screen.findByTestId("proscons-winner")).toHaveTextContent("Move to Cairo")
    expect(onResult).not.toHaveBeenCalled()

    // Ranked rows are best-first: winner is row 0.
    expect(screen.getByTestId("proscons-score-0")).toHaveTextContent("Move to Cairo")
    expect(screen.getByTestId("proscons-score-net-0")).toHaveTextContent("+2")
    expect(screen.getByTestId("proscons-score-1")).toHaveTextContent("Stay put")
    expect(screen.getByTestId("proscons-score-net-1")).toHaveTextContent("-4")

    // Lock it in → exactly one onResult with the correct payload.
    await user.click(screen.getByTestId("proscons-commit"))
    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1))
    const result = onResult.mock.calls[0][0]
    expect(result.winner.label).toBe("Move to Cairo")
    expect(result.summary).toBe("Move to Cairo wins")
    expect(result.detail.tool).toBe("proscons")
    expect(result.detail.tie).toBe(false)
    expect(result.winners.map((w: DecideOption) => w.label)).toEqual(["Move to Cairo", "Stay put"])
  })

  it("does not call onResult more than once even if commit is pressed twice", async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    render(<Game options={opts("A", "B")} onResult={onResult} />)

    await setInput("proscons-pros-input-0", "good")
    await user.click(screen.getByTestId("decide-game-run"))
    const commit = await screen.findByTestId("proscons-commit")
    await user.click(commit)
    await user.click(commit) // guarded by committed flag
    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1))
  })

  it("re-weigh returns to the editor without persisting", async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    render(<Game options={opts("A", "B")} onResult={onResult} />)

    await user.click(screen.getByTestId("decide-game-run"))
    expect(await screen.findByTestId("proscons-winner")).toBeInTheDocument()

    await user.click(screen.getByTestId("proscons-reweigh"))
    expect(await screen.findByTestId("proscons-active-label")).toBeInTheDocument()
    expect(screen.queryByTestId("proscons-winner")).not.toBeInTheDocument()
    expect(onResult).not.toHaveBeenCalled()
  })

  it("adds and removes pro rows", async () => {
    const user = userEvent.setup()
    render(<Game options={opts("A", "B")} onResult={vi.fn()} />)

    expect(screen.getByTestId("proscons-pros-input-0")).toBeInTheDocument()
    expect(screen.queryByTestId("proscons-pros-input-1")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("proscons-add-pro"))
    expect(await screen.findByTestId("proscons-pros-input-1")).toBeInTheDocument()

    await user.click(screen.getByTestId("proscons-pros-remove-1"))
    await waitFor(() => expect(screen.queryByTestId("proscons-pros-input-1")).not.toBeInTheDocument())
  })

  it("an all-empty board reveals a tie and commits the first option as winner", async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    render(<Game options={opts("First", "Second")} onResult={onResult} />)

    await user.click(screen.getByTestId("decide-game-run"))
    expect(await screen.findByTestId("proscons-verdict")).toHaveTextContent(/dead heat/i)

    await user.click(screen.getByTestId("proscons-commit"))
    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1))
    const result = onResult.mock.calls[0][0]
    expect(result.winner.label).toBe("First")
    expect(result.detail.tie).toBe(true)
  })

  it("supports a single option (no switcher) with a lean verdict", async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    render(<Game options={opts("Take the job")} onResult={onResult} />)

    // No option switcher when there is only one option.
    expect(screen.queryByTestId("proscons-tab-0")).not.toBeInTheDocument()

    await setInput("proscons-cons-input-0", "Long commute")
    await user.click(screen.getByTestId("decide-game-run"))
    expect(await screen.findByTestId("proscons-verdict")).toHaveTextContent(/lean no/i)

    await user.click(screen.getByTestId("proscons-commit"))
    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1))
    expect(onResult.mock.calls[0][0].winner.label).toBe("Take the job")
  })

  it("renders a skip path with a null winner when there is nothing to weigh", async () => {
    const user = userEvent.setup()
    const onResult = vi.fn()
    render(<Game options={[]} onResult={onResult} />)

    await user.click(screen.getByTestId("decide-game-run"))
    expect(onResult).toHaveBeenCalledTimes(1)
    expect(onResult.mock.calls[0][0].winner).toBeNull()
    expect(onResult.mock.calls[0][0].summary).toBe(winnerSummary(null))
  })
})
