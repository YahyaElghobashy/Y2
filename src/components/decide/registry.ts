import type { SelectorGame, SelectorKind } from "./contract"
import wheel from "./games/wheel"
import dice from "./games/dice"
import rps from "./games/rps"
import proscons from "./games/proscons"
import bonus from "./games/bonus"

/**
 * The suite registry. Every selector game is imported here exactly once, in
 * display order. D1–D5 replace their `games/<id>/index.tsx` stub — this file
 * never changes when a game's internals change.
 */
export const GAMES: SelectorGame[] = [wheel, dice, rps, proscons, bonus]

export const GAMES_BY_ID: Record<string, SelectorGame> = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
)

export function getGame(id: string): SelectorGame | undefined {
  return GAMES_BY_ID[id]
}

export function gamesForKind(kind: SelectorKind): SelectorGame[] {
  return GAMES.filter((g) => g.kind === kind)
}

// Re-export the contract so consumers can `import { SelectorGame } from "@/components/decide/registry"`.
export * from "./contract"
