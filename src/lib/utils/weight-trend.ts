import type { WeightLog, WeightTrend } from "@/lib/types/health.types"

/**
 * Compute a weight trend from a history array.
 *
 * Accepts history in ANY order; sorts a copy newest-first internally so the
 * caller doesn't have to. Pure and side-effect free for easy unit testing.
 *
 * Edge cases:
 * - empty   → all-null trend, direction null
 * - single  → latest set, previous null, both deltas null, direction null
 * - 2+      → deltaSinceLast (vs 2nd-newest) + deltaOverRange (vs oldest)
 */
export function computeWeightTrend(history: WeightLog[]): WeightTrend {
  if (history.length === 0) {
    return {
      latest: null,
      previous: null,
      deltaSinceLast: null,
      deltaOverRange: null,
      direction: null,
    }
  }

  // Newest first. Tie-break on created_at so same-day rows are deterministic.
  const sorted = [...history].sort((a, b) => {
    if (a.logged_at !== b.logged_at) return a.logged_at < b.logged_at ? 1 : -1
    return a.created_at < b.created_at ? 1 : -1
  })

  const latest = sorted[0]

  if (sorted.length === 1) {
    return {
      latest,
      previous: null,
      deltaSinceLast: null,
      deltaOverRange: null,
      direction: null,
    }
  }

  const previous = sorted[1]
  const oldest = sorted[sorted.length - 1]

  const deltaSinceLast = round2(latest.weight_kg - previous.weight_kg)
  const deltaOverRange = round2(latest.weight_kg - oldest.weight_kg)

  const direction: WeightTrend["direction"] =
    deltaOverRange < 0 ? "down" : deltaOverRange > 0 ? "up" : "flat"

  return { latest, previous, deltaSinceLast, deltaOverRange, direction }
}

/** Round to 2 decimals, avoiding floating-point noise (e.g. 0.1 + 0.2). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
