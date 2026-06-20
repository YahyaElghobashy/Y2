import type React from "react"

/**
 * ════════════════════════════════════════════════════════════════════════
 * THE DECIDE TOGETHER SUITE CONTRACT  (owned by D0 — do not fork)
 * ════════════════════════════════════════════════════════════════════════
 *
 * Every selector game is a self-contained module at
 *   src/components/decide/games/<id>/index.tsx
 * that DEFAULT-EXPORTS a `SelectorGame`. The registry (registry.ts) imports
 * each module; the hub renders `game.Component`. Parallel chats (D1–D5) only
 * replace their own `games/<id>/index.tsx` stub — they never edit this file
 * or the registry.
 *
 * A game receives `{ options, onResult }` and NOTHING else. It must call
 * `onResult(result)` exactly once when a decision is reached. Persistence,
 * celebration, history and option-editing are the hub's job — a game stays a
 * pure picker.
 */

/** Which situation a tool is built for. Drives THE DECIDER's recommendation. */
export type SelectorKind = "binary" | "many" | "weigh" | "playful"

/** One choice the user is deciding between. */
export type DecideOption = {
  id: string
  label: string
  /** Relative weight for weighted picks. Default 1. Ignore for unweighted games. */
  weight?: number
  /** Optional accent (hex or CSS var) for chips / wheel slices. */
  color?: string
}

/** The outcome a game emits via `onResult`. Persisted verbatim as `result` jsonb. */
export type DecideResult = {
  /** The chosen option. `null` only when there was nothing to decide. */
  winner: DecideOption | null
  /** Optional full ranking / multiple winners (bracket, top-3, etc.). */
  winners?: DecideOption[]
  /** Short human-readable outcome, e.g. "Shawarma wins". */
  summary: string
  /** Game-specific payload (rounds, dice faces, scores…) — free-form. */
  detail?: Record<string, unknown>
}

/** Props every game Component is handed. This shape is frozen. */
export type SelectorGameProps = {
  options: DecideOption[]
  onResult: (result: DecideResult) => void
}

/** The default export of every `games/<id>/index.tsx`. */
export type SelectorGame = {
  /** Stable id; also the import folder name and the persisted `tool_id`. */
  id: string
  /** English display name, e.g. "Spin the Wheel". */
  label: string
  /** Arabic display name (rendered with var(--font-arabic) + dir="rtl"). */
  arabicLabel: string
  /** One line on when to reach for this tool (shown on the selector card). */
  whenToUse: string
  kind: SelectorKind
  /** Decorative asset path under /public (guard <img> with onError). */
  asset: string
  Component: React.FC<SelectorGameProps>
}
