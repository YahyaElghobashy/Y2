import type { DecideOption } from "../contract"

/**
 * Pure randomness + option helpers shared by every selector game. Kept
 * dependency-free and injectable (`rng`) so games and tests stay deterministic.
 */

/** UUID with a non-crypto fallback (older webviews / SSR). */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

/** Build an option with a fresh id. */
export function makeOption(label: string, extra?: Partial<Omit<DecideOption, "label">>): DecideOption {
  return { id: uid(), label, ...extra }
}

/**
 * Weighted random pick. Falls back to uniform when all weights are <= 0.
 * Returns null for an empty list. `rng` defaults to Math.random (inject for tests).
 */
export function weightedPick<T extends DecideOption>(options: T[], rng: () => number = Math.random): T | null {
  if (options.length === 0) return null
  const weights = options.map((o) => Math.max(0, o.weight ?? 1))
  const total = weights.reduce((s, w) => s + w, 0)
  if (total <= 0) return options[Math.floor(rng() * options.length)] ?? options[0]
  let r = rng() * total
  for (let i = 0; i < options.length; i++) {
    r -= weights[i]
    if (r <= 0) return options[i]
  }
  return options[options.length - 1]
}

/** Fisher–Yates shuffle (non-mutating). */
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** A short, human "x wins" summary for a result. */
export function winnerSummary(winner: DecideOption | null): string {
  return winner ? `${winner.label} wins` : "No decision"
}
