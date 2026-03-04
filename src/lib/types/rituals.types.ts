import type { Database } from "./database.types"

export type Ritual = Database["public"]["Tables"]["rituals"]["Row"]
export type RitualInsert = Database["public"]["Tables"]["rituals"]["Insert"]
export type RitualLog = Database["public"]["Tables"]["ritual_logs"]["Row"]
export type RitualLogInsert = Database["public"]["Tables"]["ritual_logs"]["Insert"]

export const CADENCES = ["daily", "weekly", "monthly"] as const
export type Cadence = (typeof CADENCES)[number]
