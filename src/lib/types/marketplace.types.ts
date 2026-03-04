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
