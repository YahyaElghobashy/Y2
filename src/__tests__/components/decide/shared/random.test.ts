import { describe, it, expect, vi, beforeEach } from "vitest"

import {
  uid,
  makeOption,
  weightedPick,
  shuffle,
  winnerSummary,
} from "@/components/decide/shared/random"
import type { DecideOption } from "@/components/decide/contract"

/**
 * Pure-helper tests for the Decide-Together randomness utilities.
 *
 * These are dependency-free pure functions whose only nondeterminism is the
 * injectable `rng`. Every branch is exercised with a deterministic rng so the
 * assertions are exact (no flakiness), plus the real-rng paths (uid) are
 * sanity-checked for uniqueness / shape.
 */

const opt = (label: string, extra?: Partial<Omit<DecideOption, "label">>): DecideOption => ({
  id: label.toLowerCase(),
  label,
  ...extra,
})

describe("decide/shared/random", () => {
  describe("uid", () => {
    it("returns a non-empty string", () => {
      const id = uid()
      expect(typeof id).toBe("string")
      expect(id.length).toBeGreaterThan(0)
    })

    it("returns a different value on each call (uniqueness)", () => {
      const ids = new Set(Array.from({ length: 100 }, () => uid()))
      // No collisions across 100 calls.
      expect(ids.size).toBe(100)
    })

    it("falls back to a non-crypto string when crypto.randomUUID is unavailable", () => {
      // Force the fallback branch (older webviews / SSR).
      const original = globalThis.crypto
      // @ts-expect-error — intentionally removing crypto to hit the fallback path.
      delete (globalThis as { crypto?: unknown }).crypto
      try {
        const a = uid()
        const b = uid()
        expect(typeof a).toBe("string")
        expect(a.length).toBeGreaterThan(0)
        expect(a).not.toBe(b)
      } finally {
        // Restore for the rest of the suite.
        Object.defineProperty(globalThis, "crypto", {
          value: original,
          configurable: true,
          writable: true,
        })
      }
    })
  })

  describe("makeOption", () => {
    it("returns an object with an id and the given label", () => {
      const o = makeOption("Pizza")
      expect(o).toMatchObject({ label: "Pizza" })
      expect(typeof o.id).toBe("string")
      expect(o.id.length).toBeGreaterThan(0)
    })

    it("spreads extra fields (weight + color) onto the option", () => {
      const o = makeOption("Sushi", { weight: 3, color: "#ff0000" })
      expect(o.label).toBe("Sushi")
      expect(o.weight).toBe(3)
      expect(o.color).toBe("#ff0000")
      expect(typeof o.id).toBe("string")
      expect(o.id.length).toBeGreaterThan(0)
    })

    it("produces a different id on two calls with the same label", () => {
      const a = makeOption("Tacos")
      const b = makeOption("Tacos")
      expect(a.id).not.toBe(b.id)
      expect(a.label).toBe(b.label)
    })
  })

  describe("weightedPick", () => {
    it("returns null for an empty list", () => {
      expect(weightedPick([])).toBeNull()
      // Even with an injected rng, empty -> null (rng never consulted).
      const rng = vi.fn(() => 0.5)
      expect(weightedPick([], rng)).toBeNull()
      expect(rng).not.toHaveBeenCalled()
    })

    it("returns the only option for a single-element list", () => {
      const only = opt("A")
      expect(weightedPick([only], () => 0)).toBe(only)
      expect(weightedPick([only], () => 0.999)).toBe(only)
    })

    it("rng() => 0 picks the FIRST positive-weight option", () => {
      const a = opt("A")
      const b = opt("B")
      const c = opt("C")
      expect(weightedPick([a, b, c], () => 0)).toBe(a)
    })

    it("rng near 1 picks the LAST option", () => {
      const a = opt("A")
      const b = opt("B")
      const c = opt("C")
      // 0.999 * total lands inside the last slice.
      expect(weightedPick([a, b, c], () => 0.999)).toBe(c)
    })

    it("respects weights — verifies the slice boundary between a 3-weight and a 1-weight option", () => {
      const heavy = opt("Heavy", { weight: 3 })
      const light = opt("Light", { weight: 1 })
      // total = 4. Slice for `heavy` is [0,3), for `light` is [3,4).
      // r = rng() * 4.
      // rng = 0.74 -> r = 2.96 -> still inside heavy's slice (< 3).
      expect(weightedPick([heavy, light], () => 0.74)).toBe(heavy)
      // rng = 0.75 -> r = 3.0 -> after subtracting heavy's 3, r = 0, not <= 0?
      //   r=3 -> r-=3 -> 0 -> 0<=0 true -> still `heavy` (boundary belongs to heavy).
      expect(weightedPick([heavy, light], () => 0.75)).toBe(heavy)
      // rng = 0.76 -> r = 3.04 -> r-=3 -> 0.04 (>0, skip heavy) -> r-=1 -> -0.96 -> light.
      expect(weightedPick([heavy, light], () => 0.76)).toBe(light)
    })

    it("a heavier option is overwhelmingly favored across many deterministic draws", () => {
      const heavy = opt("Heavy", { weight: 3 })
      const light = opt("Light", { weight: 1 })
      // Sweep rng evenly across [0,1): ~3/4 of draws should land on `heavy`.
      let heavyCount = 0
      const N = 1000
      for (let i = 0; i < N; i++) {
        const r = i / N
        if (weightedPick([heavy, light], () => r) === heavy) heavyCount++
      }
      // Expect right around 750 (3/4); allow a small boundary slack.
      expect(heavyCount).toBeGreaterThan(740)
      expect(heavyCount).toBeLessThan(760)
    })

    it("falls back to uniform selection (never null) when all weights are 0", () => {
      const a = opt("A", { weight: 0 })
      const b = opt("B", { weight: 0 })
      const c = opt("C", { weight: 0 })
      const options = [a, b, c]
      // rng -> index via Math.floor(rng * length). Verify each bucket.
      expect(weightedPick(options, () => 0)).toBe(a) // floor(0*3)=0
      expect(weightedPick(options, () => 0.4)).toBe(b) // floor(1.2)=1
      expect(weightedPick(options, () => 0.7)).toBe(c) // floor(2.1)=2
      // Always returns an option, never null.
      expect(weightedPick(options, () => 0.99)).not.toBeNull()
    })

    it("treats negative weights as 0 (clamped) and still falls back when all are non-positive", () => {
      const a = opt("A", { weight: -5 })
      const b = opt("B", { weight: -1 })
      const result = weightedPick([a, b], () => 0)
      expect(result).not.toBeNull()
      // floor(0 * 2) = 0 -> first option.
      expect(result).toBe(a)
    })
  })

  describe("shuffle", () => {
    it("returns a NEW array and does not mutate the input (original order preserved)", () => {
      const input = [1, 2, 3, 4, 5]
      const snapshot = [...input]
      const out = shuffle(input, () => 0)
      expect(out).not.toBe(input) // new reference
      expect(input).toEqual(snapshot) // input untouched
    })

    it("preserves the same multiset of elements", () => {
      const input = ["a", "b", "c", "d", "e"]
      const out = shuffle(input, () => 0.5)
      expect(out).toHaveLength(input.length)
      expect([...out].sort()).toEqual([...input].sort())
    })

    it("is deterministic given the same injected rng", () => {
      const input = [10, 20, 30, 40, 50]
      const rngFactory = () => {
        const seq = [0.1, 0.9, 0.3, 0.7]
        let i = 0
        return () => seq[i++ % seq.length]
      }
      const a = shuffle(input, rngFactory())
      const b = shuffle(input, rngFactory())
      expect(a).toEqual(b)
    })

    it("rng() => 0 maps each Fisher-Yates step to j=0, producing a known permutation", () => {
      // For i = len-1..1, j = floor(0 * (i+1)) = 0, so each step swaps a[i] with a[0].
      // Walk the algorithm by hand for [1,2,3]:
      //   i=2: swap a[2],a[0] -> [3,2,1]
      //   i=1: swap a[1],a[0] -> [2,3,1]
      const out = shuffle([1, 2, 3], () => 0)
      expect(out).toEqual([2, 3, 1])
    })

    it("returns an equal (but new) array for a single-element input", () => {
      const input = [99]
      const out = shuffle(input, () => 0)
      expect(out).toEqual([99])
      expect(out).not.toBe(input)
    })

    it("returns an empty array for an empty input", () => {
      const out = shuffle([], () => 0.5)
      expect(out).toEqual([])
    })
  })

  describe("winnerSummary", () => {
    it("formats a winner as 'Label wins'", () => {
      expect(winnerSummary(opt("Shawarma"))).toBe("Shawarma wins")
    })

    it("returns 'No decision' for a null winner", () => {
      expect(winnerSummary(null)).toBe("No decision")
    })
  })
})
