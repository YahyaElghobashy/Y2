import type { SelectorGame, SelectorKind } from "./contract"
import { GAMES } from "./registry"

/**
 * THE DECIDER — the meta-picker. Given a free-text description and/or an option
 * count, classify the decision and recommend the best tool. Pure + deterministic
 * (no randomness, no I/O) so it is fully unit-testable.
 *
 * Mapping (task spec):
 *   binary  → rock-paper-scissors / coin           (here: rps, then bonus)
 *   many    → wheel / bracket                       (here: wheel, then dice)
 *   weigh   → pros & cons                           (here: proscons)
 *   playful → dice / 8-ball                         (here: dice, then bonus)
 */

export type DeciderInput = {
  description?: string
  optionCount?: number
}

export type Recommendation = {
  kind: SelectorKind
  game: SelectorGame
  reason: string
  alternatives: SelectorGame[]
}

/** Tool preference per kind — first available id wins. */
const PREFERRED: Record<SelectorKind, string[]> = {
  binary: ["rps", "bonus"],
  many: ["wheel", "dice"],
  weigh: ["proscons"],
  playful: ["dice", "bonus"],
}

const REASONS: Record<SelectorKind, string> = {
  binary: "Two real choices — a head-to-head settles it fairly.",
  many: "Lots of options on the table — spin and let one win.",
  weigh: "This one actually matters — weigh it, don't gamble it.",
  playful: "Low stakes — make it fun and leave it to chance.",
}

const WEIGH_HINTS = [
  "important",
  "weigh",
  "pros",
  "cons",
  "serious",
  "career",
  "money",
  "matter",
  "big decision",
  "think",
]
const PLAYFUL_HINTS = ["fun", "random", "surprise", "fate", "silly", "whatever", "chance", "luck", "8 ball", "8-ball"]
const BINARY_HINTS = ["yes or no", "yes/no", "should i", "or not", "either or", "this or that"]

/** Count " or " separators as a cheap option-count signal. */
function orCount(text: string): number {
  return (text.match(/\bor\b/g) ?? []).length
}

/** Classify a decision into a kind from description + option count. */
export function classifyKind(input: DeciderInput): SelectorKind {
  const text = (input.description ?? "").toLowerCase().trim()
  const n = input.optionCount ?? 0

  if (WEIGH_HINTS.some((h) => text.includes(h))) return "weigh"
  if (PLAYFUL_HINTS.some((h) => text.includes(h))) return "playful"
  if (BINARY_HINTS.some((h) => text.includes(h))) return "binary"

  if (n >= 3) return "many"
  if (n === 2) return "binary"

  const ors = orCount(text)
  if (ors >= 2) return "many"
  if (ors === 1) return "binary"

  // Nothing decisive — default to the wheel (handles any option count).
  return "many"
}

/** Recommend a tool for a decision. `games` is injectable for tests. */
export function recommendTool(input: DeciderInput, games: SelectorGame[] = GAMES): Recommendation {
  if (games.length === 0) {
    throw new Error("recommendTool: no games registered")
  }

  const kind = classifyKind(input)
  const byId = new Map(games.map((g) => [g.id, g]))

  const game =
    PREFERRED[kind].map((id) => byId.get(id)).find((g): g is SelectorGame => Boolean(g)) ??
    games.find((g) => g.kind === kind) ??
    games[0]

  const alternatives = games.filter((g) => g.id !== game.id && g.kind === kind)

  return { kind, game, reason: REASONS[kind], alternatives }
}
