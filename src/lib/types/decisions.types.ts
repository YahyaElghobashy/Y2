import type { Database } from "./database.types"
import type { DecideOption, DecideResult, SelectorKind } from "@/components/decide/contract"

/** Raw DB shapes (jsonb columns are `Json`). */
export type DecisionRow = Database["public"]["Tables"]["decision_history"]["Row"]
export type DecisionInsert = Database["public"]["Tables"]["decision_history"]["Insert"]

/** App-facing decision — jsonb columns narrowed to the suite contract types. */
export type Decision = {
  id: string
  created_by: string
  kind: SelectorKind
  tool_id: string
  options: DecideOption[]
  result: DecideResult
  created_at: string
}

/** What the hub hands `saveDecision` after a game emits its result. */
export type SaveDecisionInput = {
  kind: SelectorKind
  toolId: string
  options: DecideOption[]
  result: DecideResult
}
