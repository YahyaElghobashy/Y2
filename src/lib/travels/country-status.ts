// ============================================================
// Pure logic for the Travels world map. NO React, NO Supabase — fully
// unit-testable. Folds raw country_visits + country_pins into per-country
// display aggregates, derives mutual pins + "Our Next Adventure", and owns
// the status→gradient visual registry (token names only).
// ============================================================

import type {
  CountryVisit,
  CountryPin,
  CountryAggregate,
  CountryStatus,
  MutualPin,
  OurNextTrip,
} from "@/lib/types/world-map.types"
import { ISO_BY_NUMERIC, COUNTRY_NAME } from "@/lib/data/iso-country-codes"

// Region lookup by iso2 (reverse of ISO_BY_NUMERIC), built once.
const REGION_BY_ISO2: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const meta of Object.values(ISO_BY_NUMERIC)) m[meta.iso2] = meta.region
  return m
})()

const yearOf = (v: CountryVisit): number | null => {
  if (typeof v.visited_year === "number") return v.visited_year
  if (v.visited_on) {
    const y = Number(v.visited_on.slice(0, 4))
    return Number.isFinite(y) ? y : null
  }
  return null
}

const depthOf = (count: number): 1 | 2 | 3 =>
  count >= 3 ? 3 : count === 2 ? 2 : 1

/**
 * Fold every visit into a per-country aggregate keyed by ISO alpha-2.
 * Participation: a `together` visit counts for BOTH partners; a solo visit
 * counts only for its `traveler_id`. Status precedence:
 *   together > both-apart > me-solo > partner-solo > unvisited.
 */
export function aggregateCountries(
  visits: CountryVisit[],
  meId: string,
  partnerId: string | null
): Map<string, CountryAggregate> {
  type Acc = {
    me: number
    partner: number
    together: number
    soloMe: number
    soloPartner: number
    lastYear: number | null
  }
  const acc = new Map<string, Acc>()

  for (const v of visits) {
    const code = (v.country_code || "").toUpperCase()
    if (code.length !== 2) continue

    const meIn = v.is_together || v.traveler_id === meId
    const partnerIn =
      v.is_together || (partnerId != null && v.traveler_id === partnerId)

    // A visit nobody-relevant participated in (shouldn't happen) is skipped.
    if (!meIn && !partnerIn) continue

    const a =
      acc.get(code) ??
      ({
        me: 0,
        partner: 0,
        together: 0,
        soloMe: 0,
        soloPartner: 0,
        lastYear: null,
      } as Acc)

    if (meIn) a.me += 1
    if (partnerIn) a.partner += 1
    if (v.is_together) a.together += 1
    if (!v.is_together && meIn) a.soloMe += 1
    if (!v.is_together && partnerIn) a.soloPartner += 1

    const y = yearOf(v)
    if (y != null) a.lastYear = a.lastYear == null ? y : Math.max(a.lastYear, y)

    acc.set(code, a)
  }

  const out = new Map<string, CountryAggregate>()
  for (const [code, a] of acc) {
    const hasTogether = a.together > 0
    const hasMeSolo = a.soloMe > 0
    const hasPartnerSolo = a.soloPartner > 0

    let status: CountryStatus
    let depthCount: number
    if (hasTogether) {
      status = "together"
      depthCount = a.together
    } else if (a.me > 0 && a.partner > 0) {
      status = "both-apart"
      depthCount = Math.max(a.me, a.partner)
    } else if (a.me > 0) {
      status = "me-solo"
      depthCount = a.me
    } else if (a.partner > 0) {
      status = "partner-solo"
      depthCount = a.partner
    } else {
      status = "unvisited"
      depthCount = 0
    }

    out.set(code, {
      iso2: code,
      name: COUNTRY_NAME[code] ?? code,
      region: REGION_BY_ISO2[code] ?? "Other",
      status,
      depth: depthOf(depthCount),
      meVisits: a.me,
      partnerVisits: a.partner,
      togetherVisits: a.together,
      soloMeVisits: a.soloMe,
      soloPartnerVisits: a.soloPartner,
      hasMeSolo,
      hasPartnerSolo,
      hasTogether,
      lastYear: a.lastYear,
    })
  }
  return out
}

/** Country codes pinned by BOTH partners. */
export function mutualPins(
  myPins: CountryPin[],
  partnerPins: CountryPin[]
): string[] {
  const mine = new Set(myPins.map((p) => p.country_code.toUpperCase()))
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of partnerPins) {
    const c = p.country_code.toUpperCase()
    if (mine.has(c) && !seen.has(c)) {
      seen.add(c)
      out.push(c)
    }
  }
  return out
}

/** Build the rich mutual-pin objects (with both notes) for display. */
export function mutualPinDetails(
  myPins: CountryPin[],
  partnerPins: CountryPin[]
): MutualPin[] {
  const codes = mutualPins(myPins, partnerPins)
  return codes.map((code) => ({
    countryCode: code,
    name: COUNTRY_NAME[code] ?? code,
    myNote: myPins.find((p) => p.country_code.toUpperCase() === code)?.note ?? null,
    partnerNote:
      partnerPins.find((p) => p.country_code.toUpperCase() === code)?.note ?? null,
  }))
}

type UpcomingTrip = { id: string; destination: string | null; status: string }

/**
 * Derive the highlighted "Our Next Adventure" from mutual pins.
 * - 0 mutual → null
 * - 1 mutual → that country (needsChoice=false)
 * - >1 mutual → prefer one that already has a matching upcoming trip, else the
 *   first; needsChoice=true so the UI lets them pick.
 */
export function ourNextTrip(
  mutual: string[],
  upcomingTrips: UpcomingTrip[] = []
): OurNextTrip | null {
  if (mutual.length === 0) return null

  const matchTripFor = (code: string): string | null => {
    const name = (COUNTRY_NAME[code] ?? "").toLowerCase()
    if (!name) return null
    const hit = upcomingTrips.find(
      (t) =>
        t.status === "upcoming" &&
        (t.destination ?? "").toLowerCase().includes(name)
    )
    return hit?.id ?? null
  }

  if (mutual.length === 1) {
    const code = mutual[0]
    return {
      countryCode: code,
      name: COUNTRY_NAME[code] ?? code,
      needsChoice: false,
      candidates: mutual,
      upcomingTripId: matchTripFor(code),
    }
  }

  // Several mutual pins: surface the one already being planned, else the first.
  const planned = mutual.find((c) => matchTripFor(c) != null)
  const chosen = planned ?? mutual[0]
  return {
    countryCode: chosen,
    name: COUNTRY_NAME[chosen] ?? chosen,
    needsChoice: true,
    candidates: mutual,
    upcomingTripId: matchTripFor(chosen),
  }
}

// ── Visual registry (token names only — no hardcoded hex) ────
// Each status maps to an SVG <linearGradient> id + its two token stops; depth
// is rendered as fill-opacity so multi-visited countries read deeper.

export type StatusVisual = {
  status: CountryStatus
  label: string
  gradientId: string
  /** CSS custom-property names for the gradient stops (top → bottom). */
  from: string
  to: string
  /** true → render as a two-tone <pattern> instead of a gradient. */
  pattern?: boolean
}

export const STATUS_VISUALS: StatusVisual[] = [
  {
    status: "together",
    label: "Together",
    gradientId: "wm-grad-together",
    from: "--color-coral",
    to: "--color-terracotta",
  },
  {
    status: "me-solo",
    label: "Yahya",
    gradientId: "wm-grad-me-solo",
    from: "--color-amber",
    to: "--color-accent-copper",
  },
  {
    status: "partner-solo",
    label: "Yara",
    gradientId: "wm-grad-partner-solo",
    from: "--color-teal",
    to: "--color-teal-deep",
  },
  {
    status: "both-apart",
    label: "Both, apart",
    gradientId: "wm-pattern-both-apart",
    from: "--color-amber",
    to: "--color-teal",
    pattern: true,
  },
  {
    status: "unvisited",
    label: "Not yet",
    gradientId: "wm-grad-unvisited",
    from: "--color-sand",
    to: "--color-sand",
  },
]

const VISUAL_BY_STATUS: Record<CountryStatus, StatusVisual> = STATUS_VISUALS.reduce(
  (m, v) => {
    m[v.status] = v
    return m
  },
  {} as Record<CountryStatus, StatusVisual>
)

/** The SVG fill reference for a status (url(#id)). */
export function statusFill(status: CountryStatus): string {
  return `url(#${VISUAL_BY_STATUS[status].gradientId})`
}

/** Fill opacity by depth tier (1 visit → faint, 3+ → full). */
export function depthOpacity(depth: 1 | 2 | 3): number {
  return depth >= 3 ? 1 : depth === 2 ? 0.82 : 0.62
}

/** Human one-liner for a country's status (tooltip). */
export function statusSummary(agg: CountryAggregate): string {
  if (agg.status === "unvisited") return "Not yet visited"
  const bits: string[] = []
  if (agg.togetherVisits > 0)
    bits.push(`Together${agg.togetherVisits > 1 ? ` ×${agg.togetherVisits}` : ""}`)
  if (agg.soloMeVisits > 0)
    bits.push(`Yahya${agg.soloMeVisits > 1 ? ` ×${agg.soloMeVisits}` : ""}`)
  if (agg.soloPartnerVisits > 0)
    bits.push(`Yara${agg.soloPartnerVisits > 1 ? ` ×${agg.soloPartnerVisits}` : ""}`)
  const head = bits.join(" · ")
  return agg.lastYear ? `${head} · last ${agg.lastYear}` : head
}
