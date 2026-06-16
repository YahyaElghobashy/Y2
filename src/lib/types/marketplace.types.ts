import type { Database } from "@/lib/types/database.types"

export type MarketplaceItem = Database["public"]["Tables"]["marketplace_items"]["Row"]

export type Purchase = Database["public"]["Tables"]["purchases"]["Row"]

export type EffectType = "extra_ping" | "veto" | "task_order" | "dnd_timer" | "wildcard"

export type PurchaseStatus = "pending" | "active" | "completed" | "expired" | "declined"

export type EffectConfig = {
  extra_sends?: number
  requires_input?: boolean
  input_prompt?: string
  deadline_hours?: number
  task_description?: string
  duration_minutes?: number
  negotiable?: boolean
}

/**
 * The five effect types enforced by the `marketplace_items_effect_type_check`
 * DB constraint. Used by the admin form to populate the type selector and to
 * client-validate before an insert/update is attempted (so a bad type surfaces
 * as a field error rather than a Postgres CHECK violation).
 */
export const EFFECT_TYPES = [
  { value: "extra_ping", label: "Extra Ping", emoji: "🔔" },
  { value: "veto", label: "Veto", emoji: "✋" },
  { value: "task_order", label: "Task Order", emoji: "🧹" },
  { value: "dnd_timer", label: "Do Not Disturb", emoji: "🤫" },
  { value: "wildcard", label: "Wildcard", emoji: "🃏" },
] as const satisfies ReadonlyArray<{ value: EffectType; label: string; emoji: string }>

/** Fields an admin supplies when creating or editing a marketplace item. */
export type MarketplaceItemInput = {
  name: string
  description: string
  price: number
  icon: string
  effect_type: EffectType
  effect_config: EffectConfig
  is_active: boolean
  sort_order: number
}
