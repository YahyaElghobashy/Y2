/**
 * Pure Rock-Paper-Scissors rules + best-of-N match maths. No React, no I/O —
 * kept here so the game's brain is deterministic and unit-testable in isolation
 * from the animated UI in `index.tsx`.
 */

export type Throw = "rock" | "paper" | "scissors"
export type Side = "a" | "b"
/** Outcome of a single throw-off. `null` = tie (replay the round). */
export type RoundWinner = Side | null

export const THROWS: Throw[] = ["rock", "paper", "scissors"]

/** what each throw defeats — rock crushes scissors, etc. */
const BEATS: Record<Throw, Throw> = {
  rock: "scissors",
  scissors: "paper",
  paper: "rock",
}

export const THROW_LABEL: Record<Throw, string> = {
  rock: "Rock",
  paper: "Paper",
  scissors: "Scissors",
}

/** Does throw `x` beat throw `y`? */
export function beats(x: Throw, y: Throw): boolean {
  return BEATS[x] === y
}

/** Resolve one throw-off between side A and side B. `null` on a tie. */
export function resolveThrow(a: Throw, b: Throw): RoundWinner {
  if (a === b) return null
  return beats(a, b) ? "a" : "b"
}

/** Short "Rock beats Scissors" line for a decided throw; tie message otherwise. */
export function throwHeadline(a: Throw, b: Throw): string {
  if (a === b) return `Both threw ${THROW_LABEL[a]}`
  const [win, lose] = beats(a, b) ? [a, b] : [b, a]
  return `${THROW_LABEL[win]} beats ${THROW_LABEL[lose]}`
}

/** Wins needed to take a best-of-N match (majority). best-of-3 → 2. */
export function winsNeeded(bestOf: number): number {
  return Math.floor(Math.max(1, bestOf) / 2) + 1
}

/** Has the match been won? Returns the winning side or `null` if still live. */
export function matchWinner(scoreA: number, scoreB: number, bestOf: number): RoundWinner {
  const need = winsNeeded(bestOf)
  if (scoreA >= need) return "a"
  if (scoreB >= need) return "b"
  return null
}

/** Allowed match lengths offered in setup (odd → no draw-able match). */
export const BEST_OF_OPTIONS = [1, 3, 5] as const
