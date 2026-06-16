import { describe, it, expect } from "vitest"
import { computeWeightTrend } from "@/lib/utils/weight-trend"
import type { WeightLog } from "@/lib/types/health.types"

function log(partial: Partial<WeightLog> & { weight_kg: number; logged_at: string }): WeightLog {
  return {
    id: partial.id ?? `${partial.logged_at}-${partial.weight_kg}`,
    user_id: "u1",
    weight_kg: partial.weight_kg,
    logged_at: partial.logged_at,
    note: partial.note ?? null,
    created_at: partial.created_at ?? `${partial.logged_at}T07:00:00Z`,
  }
}

describe("computeWeightTrend", () => {
  // ── Edge: empty ──
  it("returns all-null trend for empty history", () => {
    const t = computeWeightTrend([])
    expect(t.latest).toBeNull()
    expect(t.previous).toBeNull()
    expect(t.deltaSinceLast).toBeNull()
    expect(t.deltaOverRange).toBeNull()
    expect(t.direction).toBeNull()
  })

  // ── Edge: single entry ──
  it("sets latest but null deltas/direction for a single entry", () => {
    const t = computeWeightTrend([log({ weight_kg: 90, logged_at: "2026-06-01" })])
    expect(t.latest?.weight_kg).toBe(90)
    expect(t.previous).toBeNull()
    expect(t.deltaSinceLast).toBeNull()
    expect(t.deltaOverRange).toBeNull()
    expect(t.direction).toBeNull()
  })

  // ── Sorting independence ──
  it("sorts newest-first regardless of input order", () => {
    const t = computeWeightTrend([
      log({ weight_kg: 91, logged_at: "2026-06-01" }),
      log({ weight_kg: 88, logged_at: "2026-06-15" }),
      log({ weight_kg: 90, logged_at: "2026-06-08" }),
    ])
    expect(t.latest?.logged_at).toBe("2026-06-15")
    expect(t.previous?.logged_at).toBe("2026-06-08")
  })

  // ── Deltas + downward direction ──
  it("computes deltaSinceLast vs previous and deltaOverRange vs oldest (down)", () => {
    const t = computeWeightTrend([
      log({ weight_kg: 96, logged_at: "2026-05-01" }), // oldest
      log({ weight_kg: 92, logged_at: "2026-05-15" }), // previous
      log({ weight_kg: 90, logged_at: "2026-06-01" }), // latest
    ])
    expect(t.deltaSinceLast).toBe(-2) // 90 - 92
    expect(t.deltaOverRange).toBe(-6) // 90 - 96
    expect(t.direction).toBe("down")
  })

  // ── Upward direction ──
  it("reports 'up' when latest exceeds oldest", () => {
    const t = computeWeightTrend([
      log({ weight_kg: 88, logged_at: "2026-05-01" }),
      log({ weight_kg: 90, logged_at: "2026-06-01" }),
    ])
    expect(t.deltaOverRange).toBe(2)
    expect(t.direction).toBe("up")
  })

  // ── Flat direction ──
  it("reports 'flat' when latest equals oldest", () => {
    const t = computeWeightTrend([
      log({ weight_kg: 90, logged_at: "2026-05-01" }),
      log({ weight_kg: 91, logged_at: "2026-05-15" }),
      log({ weight_kg: 90, logged_at: "2026-06-01" }),
    ])
    expect(t.deltaOverRange).toBe(0)
    expect(t.direction).toBe("flat")
  })

  // ── Floating point cleanliness ──
  it("rounds deltas to 2 decimals (no float noise)", () => {
    const t = computeWeightTrend([
      log({ weight_kg: 90.1, logged_at: "2026-05-01" }),
      log({ weight_kg: 90.4, logged_at: "2026-06-01" }),
    ])
    expect(t.deltaOverRange).toBe(0.3) // not 0.30000000000000004
  })

  // ── Same-day tie-break on created_at ──
  it("orders same-day entries by created_at (newest first)", () => {
    const t = computeWeightTrend([
      log({ id: "a", weight_kg: 90, logged_at: "2026-06-01", created_at: "2026-06-01T06:00:00Z" }),
      log({ id: "b", weight_kg: 89, logged_at: "2026-06-01", created_at: "2026-06-01T20:00:00Z" }),
    ])
    expect(t.latest?.id).toBe("b")
    expect(t.previous?.id).toBe("a")
  })
})
