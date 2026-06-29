import type { Database } from "@/lib/types/database.types"

// ── DB rows ──────────────────────────────────────────────────
export type CountryVisit = Database["public"]["Tables"]["country_visits"]["Row"]
export type CountryVisitInsert =
  Database["public"]["Tables"]["country_visits"]["Insert"]
export type CountryVisitUpdate =
  Database["public"]["Tables"]["country_visits"]["Update"]

export type CountryPin = Database["public"]["Tables"]["country_pins"]["Row"]
export type CountryPinInsert =
  Database["public"]["Tables"]["country_pins"]["Insert"]

// ── Who, relative to the signed-in user ──────────────────────
export type Traveler = "me" | "partner"

// ── Derived per-country display status ───────────────────────
// Mutually exclusive base fill. Hybrids (e.g. together + a solo visit) keep the
// strongest base status and carry nuance flags (hasMeSolo / hasPartnerSolo).
export type CountryStatus =
  | "unvisited"
  | "me-solo"
  | "partner-solo"
  | "both-apart"
  | "together"

/** Folded view of every visit for one country, ready to paint + summarise. */
export type CountryAggregate = {
  iso2: string
  name: string
  region: string
  status: CountryStatus
  /** Visit-count depth tier driving fill saturation: 1 | 2 | 3 (3 = 3+). */
  depth: 1 | 2 | 3
  meVisits: number
  partnerVisits: number
  togetherVisits: number
  soloMeVisits: number
  soloPartnerVisits: number
  /** Nuance markers for hybrid states (a together country that is also solo). */
  hasMeSolo: boolean
  hasPartnerSolo: boolean
  hasTogether: boolean
  lastYear: number | null
}

/** A country pinned by both partners → a shared dream. */
export type MutualPin = {
  countryCode: string
  name: string
  myNote: string | null
  partnerNote: string | null
}

/** The highlighted upcoming destination derived from mutual pins. */
export type OurNextTrip = {
  countryCode: string
  name: string
  /** true when more than one mutual pin exists and the couple should pick one. */
  needsChoice: boolean
  candidates: string[]
  /** An existing trips row (status='upcoming') that matches, if any. */
  upcomingTripId: string | null
}

// ── Form payload for logging a visit ─────────────────────────
export type LogVisitData = {
  countryCode: string
  /** Whose visit (solo). Ignored when isTogether is true. */
  traveler: Traveler
  isTogether: boolean
  place?: string | null
  visitedYear?: number | null
  visitedOn?: string | null
  companions?: string | null
  memorable?: string | null
  recommendation?: string | null
  tripId?: string | null
}

// ── Pin marker layer for the map ─────────────────────────────
export type PinLayer = { me: string[]; partner: string[]; mutual: string[] }
