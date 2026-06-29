import { describe, it, expect } from "vitest"
import {
  aggregateCountries,
  mutualPins,
  mutualPinDetails,
  ourNextTrip,
  statusFill,
  depthOpacity,
  statusSummary,
} from "@/lib/travels/country-status"
import type { CountryVisit, CountryPin } from "@/lib/types/world-map.types"

const ME = "11111111-1111-1111-1111-111111111111"
const PARTNER = "22222222-2222-2222-2222-222222222222"

let seq = 0
function visit(p: Partial<CountryVisit>): CountryVisit {
  seq += 1
  return {
    id: `v-${seq}`,
    created_by: ME,
    traveler_id: ME,
    country_code: "NL",
    is_together: false,
    place: null,
    visited_year: null,
    visited_on: null,
    companions: null,
    memorable: null,
    recommendation: null,
    partner_note: null,
    trip_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...p,
  }
}

function pin(p: Partial<CountryPin>): CountryPin {
  seq += 1
  return {
    id: `p-${seq}`,
    owner_id: ME,
    country_code: "JP",
    note: null,
    created_at: "2024-01-01T00:00:00Z",
    ...p,
  }
}

describe("aggregateCountries", () => {
  it("models the Amsterdam hybrid: Yahya solo 2019 + together 2024", () => {
    const map = aggregateCountries(
      [
        visit({ country_code: "NL", is_together: false, traveler_id: ME, visited_year: 2019, companions: "with friends" }),
        visit({ country_code: "NL", is_together: true, traveler_id: ME, visited_year: 2024, memorable: "canals at dusk" }),
      ],
      ME,
      PARTNER
    )
    const nl = map.get("NL")!
    expect(nl.status).toBe("together") // together wins the base fill
    expect(nl.meVisits).toBe(2) // 2019 solo + 2024 together
    expect(nl.partnerVisits).toBe(1) // only the together one
    expect(nl.togetherVisits).toBe(1)
    expect(nl.soloMeVisits).toBe(1)
    expect(nl.hasMeSolo).toBe(true) // nuance marker for the corner wedge
    expect(nl.hasTogether).toBe(true)
    expect(nl.lastYear).toBe(2024)
    expect(nl.name).toBe("Netherlands")
  })

  it("marks both-apart when each visited separately, never together", () => {
    const map = aggregateCountries(
      [
        visit({ country_code: "FR", is_together: false, traveler_id: ME }),
        visit({ country_code: "FR", is_together: false, traveler_id: PARTNER }),
      ],
      ME,
      PARTNER
    )
    expect(map.get("FR")!.status).toBe("both-apart")
    expect(map.get("FR")!.hasMeSolo).toBe(true)
    expect(map.get("FR")!.hasPartnerSolo).toBe(true)
  })

  it("classifies me-solo and partner-solo", () => {
    const map = aggregateCountries(
      [
        visit({ country_code: "EG", traveler_id: ME }),
        visit({ country_code: "JP", traveler_id: PARTNER }),
      ],
      ME,
      PARTNER
    )
    expect(map.get("EG")!.status).toBe("me-solo")
    expect(map.get("JP")!.status).toBe("partner-solo")
  })

  it("raises depth with visit count (1→1, 2→2, 3+→3)", () => {
    const single = aggregateCountries([visit({ country_code: "IT", traveler_id: ME })], ME, PARTNER)
    expect(single.get("IT")!.depth).toBe(1)
    const triple = aggregateCountries(
      [
        visit({ country_code: "IT", traveler_id: ME }),
        visit({ country_code: "IT", traveler_id: ME }),
        visit({ country_code: "IT", traveler_id: ME }),
        visit({ country_code: "IT", traveler_id: ME }),
      ],
      ME,
      PARTNER
    )
    expect(triple.get("IT")!.depth).toBe(3)
  })

  it("a together visit counts for both even when partnerId is provided", () => {
    const map = aggregateCountries(
      [visit({ country_code: "GR", is_together: true, traveler_id: ME })],
      ME,
      PARTNER
    )
    expect(map.get("GR")!.partnerVisits).toBe(1)
  })

  it("ignores rows with an invalid country_code length", () => {
    const map = aggregateCountries([visit({ country_code: "XXX", traveler_id: ME })], ME, PARTNER)
    expect(map.size).toBe(0)
  })

  it("lowercases input codes are normalised to uppercase keys", () => {
    const map = aggregateCountries([visit({ country_code: "nl", traveler_id: ME })], ME, PARTNER)
    expect(map.has("NL")).toBe(true)
  })
})

describe("mutualPins", () => {
  it("returns only countries pinned by both", () => {
    const mine = [pin({ country_code: "JP" }), pin({ country_code: "IT" })]
    const theirs = [pin({ owner_id: PARTNER, country_code: "IT" }), pin({ owner_id: PARTNER, country_code: "BR" })]
    expect(mutualPins(mine, theirs)).toEqual(["IT"])
  })

  it("is empty when there is no overlap", () => {
    expect(mutualPins([pin({ country_code: "JP" })], [pin({ owner_id: PARTNER, country_code: "BR" })])).toEqual([])
  })

  it("mutualPinDetails carries both notes", () => {
    const d = mutualPinDetails(
      [pin({ country_code: "IT", note: "Rome!" })],
      [pin({ owner_id: PARTNER, country_code: "IT", note: "Florence!" })]
    )
    expect(d).toHaveLength(1)
    expect(d[0].name).toBe("Italy")
    expect(d[0].myNote).toBe("Rome!")
    expect(d[0].partnerNote).toBe("Florence!")
  })
})

describe("ourNextTrip", () => {
  it("returns null with no mutual pins", () => {
    expect(ourNextTrip([])).toBeNull()
  })

  it("a single mutual pin becomes the next trip (no choice needed)", () => {
    const next = ourNextTrip(["IT"])!
    expect(next.countryCode).toBe("IT")
    expect(next.name).toBe("Italy")
    expect(next.needsChoice).toBe(false)
    expect(next.upcomingTripId).toBeNull()
  })

  it("several mutual pins flag needsChoice", () => {
    const next = ourNextTrip(["IT", "JP"])!
    expect(next.needsChoice).toBe(true)
    expect(next.candidates).toEqual(["IT", "JP"])
  })

  it("prefers a mutual country that already has a matching upcoming trip", () => {
    const next = ourNextTrip(["IT", "JP"], [
      { id: "trip-9", destination: "Japan, spring", status: "upcoming" },
    ])!
    expect(next.countryCode).toBe("JP")
    expect(next.upcomingTripId).toBe("trip-9")
  })
})

describe("visual registry", () => {
  it("statusFill points at the right gradient/pattern id", () => {
    expect(statusFill("together")).toBe("url(#wm-grad-together)")
    expect(statusFill("both-apart")).toBe("url(#wm-pattern-both-apart)")
    expect(statusFill("unvisited")).toBe("url(#wm-grad-unvisited)")
  })

  it("depthOpacity increases with depth", () => {
    expect(depthOpacity(1)).toBeLessThan(depthOpacity(2))
    expect(depthOpacity(2)).toBeLessThan(depthOpacity(3))
    expect(depthOpacity(3)).toBe(1)
  })

  it("statusSummary reads naturally for a hybrid", () => {
    const map = aggregateCountries(
      [
        visit({ country_code: "NL", traveler_id: ME, visited_year: 2019 }),
        visit({ country_code: "NL", is_together: true, traveler_id: ME, visited_year: 2024 }),
      ],
      ME,
      PARTNER
    )
    const s = statusSummary(map.get("NL")!)
    expect(s).toContain("Together")
    expect(s).toContain("Yahya")
    expect(s).toContain("2024")
  })

  it("statusSummary handles unvisited", () => {
    const map = aggregateCountries([visit({ country_code: "NL", traveler_id: ME })], ME, PARTNER)
    // NL is visited here; craft an unvisited aggregate via empty input instead:
    expect(statusSummary({
      iso2: "ZZ", name: "Nowhere", region: "Other", status: "unvisited", depth: 1,
      meVisits: 0, partnerVisits: 0, togetherVisits: 0, soloMeVisits: 0, soloPartnerVisits: 0,
      hasMeSolo: false, hasPartnerSolo: false, hasTogether: false, lastYear: null,
    })).toBe("Not yet visited")
    expect(map.get("NL")!.status).toBe("me-solo")
  })
})
