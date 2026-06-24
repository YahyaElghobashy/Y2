import type { Database } from "./database.types"

// ── Row / Insert / Update aliases (mirror shared-list.types.ts) ──
export type Trip = Database["public"]["Tables"]["trips"]["Row"]
export type TripInsert = Database["public"]["Tables"]["trips"]["Insert"]
export type TripUpdate = Database["public"]["Tables"]["trips"]["Update"]

export type TripCompanion = Database["public"]["Tables"]["trip_companions"]["Row"]
export type TripCompanionInsert =
  Database["public"]["Tables"]["trip_companions"]["Insert"]

// ── Enums (kept as const tuples so forms can iterate) ──
export const TRIP_KINDS = ["native", "hosted"] as const
export type TripKind = (typeof TRIP_KINDS)[number]

export const TRIP_STATUSES = ["upcoming", "ongoing", "past"] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  past: "Past",
}

// ── Composed shape used by views (a trip + its companions) ──
export type TripWithCompanions = Trip & {
  companions: TripCompanion[]
}

// ── Form payloads ──
export type CompanionDraft = {
  name: string
  relation?: string | null
  avatar_url?: string | null
}

export type CreateTripData = {
  title: string
  destination?: string | null
  start_date?: string | null
  end_date?: string | null
  cover_image?: string | null
  summary?: string | null
  kind?: TripKind
  hosted_path?: string | null
  status?: TripStatus
  companions?: CompanionDraft[]
}
