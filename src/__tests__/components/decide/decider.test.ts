import { describe, it, expect } from "vitest"
import { classifyKind, recommendTool } from "@/components/decide/decider"
import type { DeciderInput, Recommendation } from "@/components/decide/decider"
import { GAMES } from "@/components/decide/registry"
import type { SelectorGame, SelectorKind } from "@/components/decide/contract"

/**
 * Tests for the PURE meta-picker (no JSX, no I/O, fully deterministic).
 *
 * `classifyKind`  — maps a free-text description + option count to a SelectorKind.
 * `recommendTool` — picks the preferred game for that kind, exposes a reason and
 *                   same-kind alternatives, and throws when no games exist.
 *
 * We assert against the REAL registry ids/kinds (imported GAMES) rather than a
 * hand-rolled fixture so the test breaks if the suite's wiring drifts.
 */

// ── Sanity: the registry contains the ids the recommender depends on ──────────
function gameById(id: string): SelectorGame {
  const g = GAMES.find((x) => x.id === id)
  if (!g) throw new Error(`test fixture invariant: registry missing game "${id}"`)
  return g
}

describe("decide/decider — registry invariants", () => {
  it("exposes the canonical ids/kinds the recommender maps to", () => {
    // These pairings are the contract the recommender encodes; if a game's kind
    // changes in the registry this guards the rest of the suite from lying.
    expect(gameById("rps").kind).toBe<SelectorKind>("binary")
    expect(gameById("wheel").kind).toBe<SelectorKind>("many")
    expect(gameById("proscons").kind).toBe<SelectorKind>("weigh")
    expect(gameById("dice").kind).toBe<SelectorKind>("playful")
    expect(gameById("bonus").kind).toBe<SelectorKind>("playful")
  })
})

// ── UNIT: classifyKind ────────────────────────────────────────────────────────
describe("classifyKind — option-count signals", () => {
  it("classifies exactly 2 options as binary", () => {
    expect(classifyKind({ optionCount: 2 })).toBe("binary")
  })

  it("classifies 4 options as many", () => {
    expect(classifyKind({ optionCount: 4 })).toBe("many")
  })

  it("classifies 3 options (the >=3 boundary) as many", () => {
    expect(classifyKind({ optionCount: 3 })).toBe("many")
  })

  it("classifies 1 option as many (no decisive signal → wheel default)", () => {
    // n < 2 and no 'or' signal falls through to the catch-all 'many'.
    expect(classifyKind({ optionCount: 1 })).toBe("many")
  })

  it("defaults an empty input to many", () => {
    expect(classifyKind({})).toBe("many")
  })
})

describe("classifyKind — description hints", () => {
  it("treats an important career decision as weigh", () => {
    expect(classifyKind({ description: "this is an important career decision" })).toBe("weigh")
  })

  it("treats a fun 'surprise me' prompt as playful", () => {
    expect(classifyKind({ description: "let's just have fun, surprise me" })).toBe("playful")
  })

  it("treats 'should i ... or not' as binary", () => {
    expect(classifyKind({ description: "should i text first or not" })).toBe("binary")
  })

  it("treats a phrase with two 'or' separators as many", () => {
    expect(classifyKind({ description: "pizza or sushi or koshari" })).toBe("many")
  })

  it("treats a single 'or' separator as binary", () => {
    expect(classifyKind({ description: "tea or coffee" })).toBe("binary")
  })
})

describe("classifyKind — precedence & edge cases", () => {
  it("prefers a weigh hint over option count (description wins)", () => {
    // 'important' is a weigh hint; even with 4 options it should not be 'many'.
    expect(classifyKind({ description: "an important call", optionCount: 4 })).toBe("weigh")
  })

  it("prefers a playful hint over a binary option count", () => {
    expect(classifyKind({ description: "surprise me!", optionCount: 2 })).toBe("playful")
  })

  it("is case-insensitive for hints", () => {
    expect(classifyKind({ description: "This Is An IMPORTANT Decision" })).toBe("weigh")
  })

  it("handles whitespace-only / blank descriptions by falling back to count then default", () => {
    expect(classifyKind({ description: "   " })).toBe("many")
    expect(classifyKind({ description: "   ", optionCount: 2 })).toBe("binary")
  })
})

// ── UNIT + INTEGRATION: recommendTool against the real registry ───────────────
describe("recommendTool — chosen game per kind", () => {
  it("recommends rps for a binary decision", () => {
    const rec = recommendTool({ optionCount: 2 })
    expect(rec.kind).toBe("binary")
    expect(rec.game.id).toBe("rps")
  })

  it("recommends wheel for a many decision", () => {
    const rec = recommendTool({ optionCount: 4 })
    expect(rec.kind).toBe("many")
    expect(rec.game.id).toBe("wheel")
  })

  it("recommends proscons for a weigh decision", () => {
    const rec = recommendTool({ description: "this is an important career decision" })
    expect(rec.kind).toBe("weigh")
    expect(rec.game.id).toBe("proscons")
  })

  it("recommends dice for a playful decision", () => {
    const rec = recommendTool({ description: "let's just have fun, surprise me" })
    expect(rec.kind).toBe("playful")
    expect(rec.game.id).toBe("dice")
  })
})

describe("recommendTool — recommendation shape", () => {
  const cases: Array<{ name: string; input: DeciderInput; expectedKind: SelectorKind; expectedId: string }> = [
    { name: "binary", input: { optionCount: 2 }, expectedKind: "binary", expectedId: "rps" },
    { name: "many", input: { optionCount: 4 }, expectedKind: "many", expectedId: "wheel" },
    {
      name: "weigh",
      input: { description: "this is an important career decision" },
      expectedKind: "weigh",
      expectedId: "proscons",
    },
    {
      name: "playful",
      input: { description: "let's just have fun, surprise me" },
      expectedKind: "playful",
      expectedId: "dice",
    },
  ]

  for (const c of cases) {
    it(`(${c.name}) reason is a non-empty string`, () => {
      const rec: Recommendation = recommendTool(c.input)
      expect(typeof rec.reason).toBe("string")
      expect(rec.reason.trim().length).toBeGreaterThan(0)
    })

    it(`(${c.name}) recommended game.kind matches the classified kind`, () => {
      const rec = recommendTool(c.input)
      // The classified kind, the recommendation kind, and the game's own kind
      // must all agree — the recommender must never hand back a mismatched tool.
      expect(rec.kind).toBe(c.expectedKind)
      expect(classifyKind(c.input)).toBe(c.expectedKind)
      expect(rec.game.kind).toBe(c.expectedKind)
    })

    it(`(${c.name}) alternatives are same-kind games excluding the chosen one`, () => {
      const rec = recommendTool(c.input)
      // Chosen game is never in its own alternatives list.
      expect(rec.alternatives.map((g) => g.id)).not.toContain(rec.game.id)
      // Every alternative shares the recommendation's kind.
      for (const alt of rec.alternatives) {
        expect(alt.kind).toBe(c.expectedKind)
      }
      // Alternatives are exactly the registry's same-kind games minus the pick.
      const expectedAlts = GAMES.filter((g) => g.kind === c.expectedKind && g.id !== c.expectedId)
        .map((g) => g.id)
        .sort()
      expect(rec.alternatives.map((g) => g.id).sort()).toEqual(expectedAlts)
    })
  }

  it("(playful) surfaces bonus as the alternative to dice", () => {
    // dice + bonus are both playful in the real registry → bonus must appear.
    const rec = recommendTool({ description: "surprise me, just for fun" })
    expect(rec.game.id).toBe("dice")
    expect(rec.alternatives.map((g) => g.id)).toContain("bonus")
    expect(rec.alternatives.map((g) => g.id)).not.toContain("dice")
  })

  it("(binary) has no alternatives — rps is the only binary game", () => {
    const rec = recommendTool({ optionCount: 2 })
    expect(rec.alternatives).toEqual([])
  })
})

// ── EDGE / ERROR PATH ─────────────────────────────────────────────────────────
describe("recommendTool — empty registry", () => {
  it("throws when no games are registered", () => {
    expect(() => recommendTool({}, [])).toThrow()
  })

  it("throws a descriptive error referencing the recommender", () => {
    expect(() => recommendTool({ optionCount: 2 }, [])).toThrow(/recommendTool/i)
  })
})

// ── INTEGRATION: injected (non-default) games are honoured ────────────────────
describe("recommendTool — injectable games param", () => {
  it("uses the injected games array instead of the default registry", () => {
    const fakeBinary: SelectorGame = { ...gameById("wheel"), id: "fake-binary", kind: "binary" }
    // Only one game, of kind binary → for a binary input it must be the pick,
    // chosen via the `games.find(kind)` fallback (its id isn't in PREFERRED).
    const rec = recommendTool({ optionCount: 2 }, [fakeBinary])
    expect(rec.kind).toBe("binary")
    expect(rec.game.id).toBe("fake-binary")
    expect(rec.alternatives).toEqual([])
  })
})
