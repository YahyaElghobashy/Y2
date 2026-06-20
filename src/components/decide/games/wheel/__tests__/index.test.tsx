import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import wheel, {
  Wheel,
  buildSectors,
  landingRotation,
  sectorUnderPointer,
  sectorPath,
  sliceTextColor,
  RISO_SECTORS,
} from "../index"
import type { DecideOption, DecideResult } from "../../../contract"

// ── framer-motion mock (strip animation props, render plain DOM) ─────────────
let mockReduced = false

vi.mock("framer-motion", () => {
  const passthrough =
    (Tag: string) =>
    ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { animate, transition, initial, whileTap, exit, ...dom } = props as Record<string, unknown>
      const Comp = Tag as unknown as React.ElementType
      return <Comp {...(dom as Record<string, unknown>)}>{children}</Comp>
    }
  return {
    motion: { svg: passthrough("svg"), button: passthrough("button"), div: passthrough("div") },
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useReducedMotion: () => mockReduced,
  }
})

// ── helpers ──────────────────────────────────────────────────────────────────

/** Sequential RNG: returns queued values in order, repeating the last. */
function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

function opts(labels: string[], weights?: number[]): DecideOption[] {
  return labels.map((label, i) => ({ id: `o${i}`, label, weight: weights?.[i] }))
}

const FOUR = opts(["Pizza", "Sushi", "Tacos", "Pasta"])

beforeEach(() => {
  mockReduced = false
  vi.clearAllMocks()
})

// ════════════════════════════════════════════════════════════════════════════
// UNIT — pure geometry (the correctness core)
// ════════════════════════════════════════════════════════════════════════════

describe("buildSectors", () => {
  it("returns equal arcs that tile the full circle for unweighted options", () => {
    const s = buildSectors(FOUR)
    expect(s).toHaveLength(4)
    for (const sec of s) expect(sec.arc).toBeCloseTo(90)
    expect(s[0].start).toBeCloseTo(0)
    expect(s[3].end).toBeCloseTo(360)
    expect(s[1].mid).toBeCloseTo(135)
  })

  it("sizes arcs in proportion to weight", () => {
    const s = buildSectors(opts(["A", "B"], [3, 1]))
    expect(s[0].arc).toBeCloseTo(270)
    expect(s[1].arc).toBeCloseTo(90)
  })

  it("falls back to equal arcs when every weight is <= 0", () => {
    const s = buildSectors(opts(["A", "B", "C"], [0, 0, 0]))
    for (const sec of s) expect(sec.arc).toBeCloseTo(120)
  })

  it("returns an empty list for no options", () => {
    expect(buildSectors([])).toEqual([])
  })
})

describe("landingRotation + sectorUnderPointer", () => {
  const cases = [
    { name: "2 equal", o: opts(["Yes", "No"]) },
    { name: "4 equal", o: FOUR },
    { name: "7 equal", o: opts(Array.from({ length: 7 }, (_, i) => `O${i}`)) },
    { name: "12 equal", o: opts(Array.from({ length: 12 }, (_, i) => `O${i}`)) },
    { name: "weighted", o: opts(["Big", "Mid", "Small"], [6, 3, 1]) },
  ]

  for (const { name, o } of cases) {
    it(`lands the pointer inside the chosen sector for every winner (${name})`, () => {
      const sectors = buildSectors(o)
      for (let idx = 0; idx < sectors.length; idx++) {
        // sweep the jitter extremes — the winner must hold at the arc edges
        for (const rand of [0, 0.5, 1]) {
          const target = landingRotation(0, sectors[idx], rand)
          expect(sectorUnderPointer(sectors, target)).toBe(idx)
        }
      }
    })
  }

  it("always advances at least 4 full turns past the resting rotation", () => {
    const sectors = buildSectors(FOUR)
    const from = 123
    const target = landingRotation(from, sectors[2], 0.5)
    expect(target - from).toBeGreaterThanOrEqual(4 * 360)
  })

  it("keeps landing on the winner from a non-zero resting rotation", () => {
    const sectors = buildSectors(FOUR)
    const target = landingRotation(2050, sectors[1], 0.5)
    expect(sectorUnderPointer(sectors, target)).toBe(1)
  })
})

describe("sectorPath", () => {
  it("builds a closed pie wedge path", () => {
    const p = sectorPath(150, 150, 100, 0, 90)
    expect(p.startsWith("M 150 150")).toBe(true)
    expect(p.trim().endsWith("Z")).toBe(true)
  })

  it("splits a full circle into two arcs (single-option wheel)", () => {
    const p = sectorPath(150, 150, 100, 0, 360)
    // two "A" arc commands when split
    expect((p.match(/A /g) ?? []).length).toBe(2)
  })
})

describe("sliceTextColor", () => {
  it("returns ink on a light custom fill and paper on a dark one", () => {
    expect(sliceTextColor("#FFFFFF")).toBe("var(--color-ink)")
    expect(sliceTextColor("#F2A93B")).toBe("var(--color-ink)") // light amber
    expect(sliceTextColor("#000000")).toBe("var(--color-paper)")
    expect(sliceTextColor("#2B2F5E")).toBe("var(--color-paper)") // dark indigo
  })

  it("defaults to ink for non-hex (CSS var) fills so light values stay legible", () => {
    expect(sliceTextColor("var(--color-clay)")).toBe("var(--color-ink)")
  })
})

// ════════════════════════════════════════════════════════════════════════════
// UNIT — render
// ════════════════════════════════════════════════════════════════════════════

describe("Wheel render", () => {
  const noop = () => {}

  it("renders the wheel, pointer, hub button and one slice per option", () => {
    render(<Wheel options={FOUR} onResult={noop} />)
    expect(screen.getByTestId("decide-wheel")).toBeInTheDocument()
    expect(screen.getByTestId("wheel-svg")).toBeInTheDocument()
    expect(screen.getByTestId("wheel-pointer")).toBeInTheDocument()
    expect(screen.getByTestId("decide-game-run")).toBeInTheDocument()
    for (let i = 0; i < FOUR.length; i++) {
      expect(screen.getByTestId(`wheel-slice-${i}`)).toBeInTheDocument()
    }
    expect(screen.queryByTestId("wheel-slice-4")).not.toBeInTheDocument()
  })

  it("tints slices from the riso palette and honours a custom option color", () => {
    const colored = [
      { id: "a", label: "Red", color: "#FF0000" },
      { id: "b", label: "Plain" },
    ]
    render(<Wheel options={colored} onResult={noop} />)
    expect(screen.getByTestId("wheel-slice-0")).toHaveAttribute("fill", "#FF0000")
    expect(screen.getByTestId("wheel-slice-1")).toHaveAttribute("fill", RISO_SECTORS[1].fill)
  })

  it("renders labels and truncates long ones", () => {
    render(<Wheel options={opts(["A really really long label", "Hi"])} onResult={noop} />)
    expect(screen.getByText("Hi")).toBeInTheDocument()
    expect(screen.getByText(/…$/)).toBeInTheDocument()
  })

  it("ignores blank options and disables the hub when nothing is playable", () => {
    render(<Wheel options={opts(["", "   "])} onResult={noop} />)
    expect(screen.getByTestId("decide-game-run")).toBeDisabled()
    expect(screen.queryByTestId("wheel-slice-0")).not.toBeInTheDocument()
    expect(screen.getByText("Add options to spin")).toBeInTheDocument()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// INTERACTION
// ════════════════════════════════════════════════════════════════════════════

describe("Wheel spin interaction", () => {
  beforeEach(() => vi.useFakeTimers())

  it("spins, then reveals the deterministic winner and reports it once", () => {
    const onResult = vi.fn()
    // first rng → winner pick (idx 2), second rng → jitter
    render(<Wheel options={FOUR} onResult={onResult} rng={seqRng([0.6, 0.5])} spinMs={4000} />)

    fireEvent.click(screen.getByTestId("decide-game-run"))
    // result is gated behind the spin animation
    expect(onResult).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(4000))

    expect(onResult).toHaveBeenCalledTimes(1)
    const r = onResult.mock.calls[0][0] as DecideResult
    expect(r.winner?.label).toBe("Tacos")
    expect(screen.getByTestId("wheel-winner")).toHaveTextContent("Tacos")
  })

  it("does not double-fire when the hub is clicked again mid-spin", () => {
    const onResult = vi.fn()
    render(<Wheel options={FOUR} onResult={onResult} rng={seqRng([0.1, 0.5])} spinMs={4000} />)
    const btn = screen.getByTestId("decide-game-run")

    fireEvent.click(btn)
    // DOM guard: the hub is explicitly disabled while spinning
    expect(btn).toBeDisabled()
    fireEvent.click(btn) // swallowed (disabled) + phase-guarded in the handler
    act(() => vi.advanceTimersByTime(4000))

    expect(onResult).toHaveBeenCalledTimes(1)
    // re-enabled after the result (so it can spin again)
    expect(btn).not.toBeDisabled()
  })

  it("FIX: spins again immediately after a result (no single-spin lock)", () => {
    const onResult = vi.fn()
    // spin1 → idx0 (Pizza); spin2 → idx2 (Tacos)
    render(<Wheel options={FOUR} onResult={onResult} rng={seqRng([0.1, 0.5, 0.6, 0.5])} spinMs={4000} />)

    fireEvent.click(screen.getByTestId("decide-game-run"))
    act(() => vi.advanceTimersByTime(4000))
    expect(onResult).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("wheel-winner")).toHaveTextContent("Pizza")

    // the "Spin again" affordance exists and works — old component jammed here
    fireEvent.click(screen.getByTestId("wheel-spin-again"))
    act(() => vi.advanceTimersByTime(4000))

    expect(onResult).toHaveBeenCalledTimes(2)
    expect((onResult.mock.calls[1][0] as DecideResult).winner?.label).toBe("Tacos")
    expect(screen.getByTestId("wheel-winner")).toHaveTextContent("Tacos")
  })
})

describe("Wheel reduced motion", () => {
  it("reveals immediately with no animation timer", () => {
    mockReduced = true
    const onResult = vi.fn()
    render(<Wheel options={FOUR} onResult={onResult} rng={seqRng([0.6, 0.5])} />)

    fireEvent.click(screen.getByTestId("decide-game-run"))

    expect(onResult).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("wheel-winner")).toHaveTextContent("Tacos")
  })
})

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION — contract payload + weighting
// ════════════════════════════════════════════════════════════════════════════

describe("Wheel contract integration", () => {
  beforeEach(() => vi.useFakeTimers())

  it("emits a DecideResult matching the frozen contract shape", () => {
    const onResult = vi.fn()
    render(<Wheel options={FOUR} onResult={onResult} rng={seqRng([0.1, 0.5])} spinMs={4000} />)
    fireEvent.click(screen.getByTestId("decide-game-run"))
    act(() => vi.advanceTimersByTime(4000))

    const r = onResult.mock.calls[0][0] as DecideResult
    expect(r.winner).toBe(FOUR[0]) // same option object identity
    expect(r.summary).toBe("Pizza wins")
    expect(r.detail).toMatchObject({ tool: "wheel", count: 4 })
  })

  it("respects weights — picks differently than a uniform draw would", () => {
    const onResult = vi.fn()
    // [1,1,8] total 10. rng=0.15 ⇒ weighted r=1.5 ⇒ idx1 "Mid".
    // A uniform-index regression would give floor(0.15*3)=0 ⇒ "Rare" — so this
    // assertion fails if weighting is dropped. rng=0.9 ⇒ r=9 ⇒ idx2 "Common".
    const weighted = opts(["Rare", "Mid", "Common"], [1, 1, 8])
    render(<Wheel options={weighted} onResult={onResult} rng={seqRng([0.15, 0.5, 0.9, 0.5])} spinMs={4000} />)

    fireEvent.click(screen.getByTestId("decide-game-run"))
    act(() => vi.advanceTimersByTime(4000))
    expect((onResult.mock.calls[0][0] as DecideResult).winner?.label).toBe("Mid")

    fireEvent.click(screen.getByTestId("wheel-spin-again"))
    act(() => vi.advanceTimersByTime(4000))
    expect((onResult.mock.calls[1][0] as DecideResult).winner?.label).toBe("Common")
  })

  it("excludes blank options from selection and the reported count", () => {
    const onResult = vi.fn()
    // playable = [Pizza, Sushi]; rng=0.1 ⇒ idx0 Pizza
    render(<Wheel options={opts(["Pizza", "", "Sushi"])} onResult={onResult} rng={seqRng([0.1, 0.5])} spinMs={4000} />)
    fireEvent.click(screen.getByTestId("decide-game-run"))
    act(() => vi.advanceTimersByTime(4000))

    const r = onResult.mock.calls[0][0] as DecideResult
    expect(r.detail).toMatchObject({ tool: "wheel", count: 2 })
    expect(["Pizza", "Sushi"]).toContain(r.winner?.label)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// CONTRACT — default export metadata
// ════════════════════════════════════════════════════════════════════════════

describe("wheel SelectorGame export", () => {
  it("default-exports the frozen SelectorGame shape", () => {
    expect(wheel.id).toBe("wheel")
    expect(wheel.kind).toBe("many")
    expect(wheel.label).toBe("Spin the Wheel")
    expect(wheel.arabicLabel.length).toBeGreaterThan(0)
    expect(typeof wheel.whenToUse).toBe("string")
    expect(typeof wheel.asset).toBe("string")
    expect(wheel.Component).toBe(Wheel)
  })
})
