"use client"

import { useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Plus, Globe } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { MapLegend } from "@/components/travels/MapLegend"
import { CountryTooltip } from "@/components/travels/CountryTooltip"
import { CountryDetailSheet } from "@/components/travels/CountryDetailSheet"
import { LogVisitForm } from "@/components/travels/LogVisitForm"
import { OurNextTrip } from "@/components/travels/OurNextTrip"
import {
  statusSummary,
  mutualPins,
  aggregateCountries,
  ourNextTrip,
} from "@/lib/travels/country-status"
import { COUNTRY_NAME } from "@/lib/data/iso-country-codes"
import type {
  CountryAggregate,
  CountryPin,
  CountryVisit,
  LogVisitData,
  OurNextTrip as OurNextTripData,
  PinLayer,
} from "@/lib/types/world-map.types"

// d3-geo + the topojson bundle are client-only + heavy → keep them out of SSR.
const WorldMap = dynamic(
  () => import("@/components/travels/WorldMap").then((m) => m.WorldMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[180px] items-center justify-center rounded-xl"
        style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)" }}
      >
        <Globe className="animate-pulse" size={28} />
      </div>
    ),
  }
)

export type WorldMapViewProps = {
  countries: Map<string, CountryAggregate>
  pins: PinLayer
  myPins: CountryPin[]
  ourNextTrip: OurNextTripData | null
  meId: string
  partnerId: string | null
  meName?: string
  partnerName?: string
  visitsFor: (iso2: string) => CountryVisit[]
  isLoading?: boolean
  /** Real on the authed page; omitted in /preview so affordances are inert. */
  onAddVisit?: (data: LogVisitData) => Promise<void>
  onTogglePin?: (iso2: string, currentlyPinned: boolean) => Promise<void>
  onAddPartnerNote?: (visitId: string, note: string) => Promise<void>
  onStartPlanning?: (countryCode: string) => void
}

const noop = async () => {}

export function WorldMapView({
  countries,
  pins,
  myPins,
  ourNextTrip: next,
  meId,
  partnerId,
  meName = "Yahya",
  partnerName = "Yara",
  visitsFor,
  isLoading = false,
  onAddVisit,
  onTogglePin,
  onAddPartnerNote,
  onStartPlanning,
}: WorldMapViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [selected, setSelected] = useState<string | null>(null)
  const [logOpen, setLogOpen] = useState(false)
  const [preset, setPreset] = useState<string | null>(null)

  const pinnedSet = useMemo(
    () => new Set(myPins.map((p) => p.country_code.toUpperCase())),
    [myPins]
  )

  const hoverAgg = hovered ? countries.get(hovered) : undefined
  const hoverName = hovered ? COUNTRY_NAME[hovered] ?? hovered : ""
  const hoverSummary = hoverAgg ? statusSummary(hoverAgg) : "Not yet visited"
  const hoverPinned = hovered
    ? pins.me.includes(hovered) ||
      pins.partner.includes(hovered) ||
      pins.mutual.includes(hovered)
    : false

  const visitedCount = countries.size

  const selectedVisits = selected ? visitsFor(selected) : []

  return (
    <div
      className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p
            className="text-[12px] font-bold uppercase tracking-[0.28em]"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-teal)" }}
          >
            رحلاتنا
          </p>
          <h1 className="text-[30px] font-extrabold leading-[1.02]" style={{ fontFamily: "var(--font-display)" }}>
            Where we&apos;ve been
          </h1>
          <p className="mt-0.5 text-[13px]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>
            {visitedCount} {visitedCount === 1 ? "country" : "countries"} on the map
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPreset(null)
            setLogOpen(true)
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold text-white"
          style={{ background: "var(--color-coral)", fontFamily: "var(--font-nav)" }}
        >
          <Plus size={16} />
          Log a visit
        </button>
      </div>

      {/* Our Next Adventure */}
      {next && (
        <div className="mb-4">
          <OurNextTrip next={next} onStartPlanning={onStartPlanning} />
        </div>
      )}

      {/* Map */}
      <PosterCard accent="teal" className="overflow-visible">
        <div
          ref={wrapRef}
          className="relative"
          onMouseMove={(e) => {
            if (!hovered || !wrapRef.current) return
            const r = wrapRef.current.getBoundingClientRect()
            setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
          }}
        >
          {isLoading ? (
            <div
              className="flex h-[180px] items-center justify-center rounded-xl"
              style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)" }}
            >
              <Globe className="animate-pulse" size={28} />
            </div>
          ) : (
            <WorldMap
              countries={countries}
              pins={pins}
              focusedIso={hovered}
              onHover={setHovered}
              onSelect={(iso2) => setSelected(iso2)}
            />
          )}

          {hovered && (
            <CountryTooltip
              name={hoverName}
              summary={hoverSummary}
              pinned={hoverPinned}
              x={pos.x}
              y={pos.y}
            />
          )}
        </div>

        <div className="mt-4">
          <MapLegend />
        </div>
      </PosterCard>

      {/* Detail sheet */}
      {selected && (
        <CountryDetailSheet
          open={!!selected}
          onClose={() => setSelected(null)}
          iso2={selected}
          name={COUNTRY_NAME[selected] ?? selected}
          region={countries.get(selected)?.region ?? "Other"}
          visits={selectedVisits}
          isPinned={pinnedSet.has(selected)}
          pinDisabled={myPins.length >= 3}
          meId={meId}
          partnerId={partnerId}
          meName={meName}
          partnerName={partnerName}
          onTogglePin={() =>
            (onTogglePin ?? noop)(selected, pinnedSet.has(selected))
          }
          onLogVisit={() => {
            setPreset(selected)
            setLogOpen(true)
          }}
          onAddPartnerNote={onAddPartnerNote ?? noop}
        />
      )}

      {/* Log a visit */}
      <LogVisitForm
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSubmit={onAddVisit ?? noop}
        presetCountry={preset}
        meName={meName}
        partnerName={partnerName}
      />
    </div>
  )
}

// ── Preview mock ─────────────────────────────────────────────
const MOCK_ME = "mock-me"
const MOCK_PARTNER = "mock-partner"

const MOCK_VISITS: CountryVisit[] = [
  // Amsterdam hybrid: Yahya solo 2019 + together 2024
  {
    id: "mv1", created_by: MOCK_ME, traveler_id: MOCK_ME, country_code: "NL",
    is_together: false, place: "Amsterdam", visited_year: 2019, visited_on: null,
    companions: "with uni friends", memorable: null,
    recommendation: "Rent bikes along the canals and find the little pancake place.",
    partner_note: null, trip_id: null, created_at: "", updated_at: "",
  },
  {
    id: "mv2", created_by: MOCK_ME, traveler_id: MOCK_ME, country_code: "NL",
    is_together: true, place: "Amsterdam", visited_year: 2024, visited_on: null,
    companions: null, memorable: "Stroopwafels at the floating market, golden hour on the canals.",
    recommendation: null, partner_note: "The houseboat breakfast 🥹", trip_id: null,
    created_at: "", updated_at: "",
  },
  // Yara solo
  {
    id: "mv3", created_by: MOCK_PARTNER, traveler_id: MOCK_PARTNER, country_code: "FR",
    is_together: false, place: "Paris", visited_year: 2018, visited_on: null,
    companions: "with family", memorable: null,
    recommendation: "Skip the Tower queue — picnic at Champ de Mars instead.",
    partner_note: null, trip_id: null, created_at: "", updated_at: "",
  },
  // Both apart (Italy): me 2017, partner 2022
  {
    id: "mv4", created_by: MOCK_ME, traveler_id: MOCK_ME, country_code: "IT",
    is_together: false, place: "Rome", visited_year: 2017, visited_on: null,
    companions: null, memorable: null, recommendation: "Trastevere at night.",
    partner_note: null, trip_id: null, created_at: "", updated_at: "",
  },
  {
    id: "mv5", created_by: MOCK_PARTNER, traveler_id: MOCK_PARTNER, country_code: "IT",
    is_together: false, place: "Florence", visited_year: 2022, visited_on: null,
    companions: null, memorable: null, recommendation: "The Uffizi, early.",
    partner_note: null, trip_id: null, created_at: "", updated_at: "",
  },
  // Together only (Greece)
  {
    id: "mv6", created_by: MOCK_ME, traveler_id: MOCK_ME, country_code: "GR",
    is_together: true, place: "Santorini", visited_year: 2023, visited_on: null,
    companions: null, memorable: "That sunset in Oia we still talk about.",
    recommendation: null, partner_note: null, trip_id: null, created_at: "", updated_at: "",
  },
]

const MOCK_MY_PINS: CountryPin[] = [
  { id: "mp1", owner_id: MOCK_ME, country_code: "JP", note: "Cherry blossoms.", created_at: "" },
  { id: "mp2", owner_id: MOCK_ME, country_code: "BR", note: null, created_at: "" },
]
const MOCK_PARTNER_PINS: CountryPin[] = [
  { id: "mp3", owner_id: MOCK_PARTNER, country_code: "JP", note: "Kyoto temples.", created_at: "" },
  { id: "mp4", owner_id: MOCK_PARTNER, country_code: "MA", note: null, created_at: "" },
]

const MOCK_COUNTRIES = aggregateCountries(MOCK_VISITS, MOCK_ME, MOCK_PARTNER)
const MOCK_MUTUAL = mutualPins(MOCK_MY_PINS, MOCK_PARTNER_PINS)

export const WORLD_MAP_MOCK: WorldMapViewProps = {
  countries: MOCK_COUNTRIES,
  pins: {
    me: MOCK_MY_PINS.map((p) => p.country_code),
    partner: MOCK_PARTNER_PINS.map((p) => p.country_code),
    mutual: MOCK_MUTUAL,
  },
  myPins: MOCK_MY_PINS,
  ourNextTrip: ourNextTrip(MOCK_MUTUAL, []),
  meId: MOCK_ME,
  partnerId: MOCK_PARTNER,
  meName: "Yahya",
  partnerName: "Yara",
  visitsFor: (iso2: string) =>
    MOCK_VISITS.filter((v) => v.country_code.toUpperCase() === iso2.toUpperCase()),
}
