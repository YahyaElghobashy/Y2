"use client"

import { useMemo } from "react"
import { geoNaturalEarth1, geoPath } from "d3-geo"
import { feature } from "topojson-client"
import worldTopo from "@/lib/data/world-countries-110m.json"
import { iso2FromNumeric } from "@/lib/data/iso-country-codes"
import {
  STATUS_VISUALS,
  statusFill,
  depthOpacity,
  statusSummary,
} from "@/lib/travels/country-status"
import type { CountryAggregate, PinLayer } from "@/lib/types/world-map.types"
import { PinBadge } from "@/components/travels/PinBadge"

// Flat editorial projection (not a slippy/Mercator map). Computed ONCE at module
// load against a fixed viewBox; the <svg> scales responsively.
const W = 800
const H = 412

type GeoFeature = {
  key: string
  iso2: string | null
  d: string
  centroid: [number, number]
}

const GEO: GeoFeature[] = (() => {
  // topojson-client + the world-atlas bundle are untyped JSON; cast narrowly.
  const topo = worldTopo as unknown as Parameters<typeof feature>[0]
  const fc = feature(
    topo,
    (worldTopo as unknown as { objects: { countries: unknown } }).objects
      .countries as never
  ) as unknown as { features: Array<{ id: string | number }> }
  const projection = geoNaturalEarth1().fitSize([W, H], fc as never)
  const path = geoPath(projection)
  return (fc.features as never[]).map((f, i) => {
    const feat = f as { id: string | number }
    return {
      // Some 110m geometries lack an id → use the index for a stable unique key.
      key: `geo-${i}`,
      iso2: iso2FromNumeric(feat.id),
      d: path(f as never) || "",
      centroid: path.centroid(f as never) as [number, number],
    }
  })
})()

const FEATURE_BY_ISO2: Record<string, GeoFeature> = (() => {
  const m: Record<string, GeoFeature> = {}
  for (const g of GEO) if (g.iso2) m[g.iso2] = g
  return m
})()

export type WorldMapProps = {
  countries: Map<string, CountryAggregate>
  pins: PinLayer
  onHover?: (iso2: string | null) => void
  onSelect?: (iso2: string) => void
  focusedIso?: string | null
}

export function WorldMap({
  countries,
  pins,
  onHover,
  onSelect,
  focusedIso,
}: WorldMapProps) {
  const pinSet = useMemo(
    () => ({
      me: new Set(pins.me.map((c) => c.toUpperCase())),
      partner: new Set(pins.partner.map((c) => c.toUpperCase())),
      mutual: new Set(pins.mutual.map((c) => c.toUpperCase())),
    }),
    [pins]
  )

  const pinnedCentroids = useMemo(() => {
    const all = new Set<string>([
      ...pinSet.me,
      ...pinSet.partner,
      ...pinSet.mutual,
    ])
    return [...all]
      .map((iso2) => {
        const g = FEATURE_BY_ISO2[iso2]
        if (!g) return null
        const kind = pinSet.mutual.has(iso2)
          ? "mutual"
          : pinSet.me.has(iso2)
            ? "me"
            : "partner"
        return { iso2, x: g.centroid[0], y: g.centroid[1], kind } as const
      })
      .filter(Boolean) as { iso2: string; x: number; y: number; kind: "me" | "partner" | "mutual" }[]
  }, [pinSet])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Map of the countries we've visited"
      className="wm-svg block w-full"
      style={{ height: "auto" }}
    >
      <title>Where we&apos;ve been</title>
      <desc>
        An interactive world map. Visited countries are shaded by who went; tap a
        country for details.
      </desc>

      <defs>
        {STATUS_VISUALS.filter((v) => !v.pattern).map((v) => (
          <linearGradient
            key={v.gradientId}
            id={v.gradientId}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={`var(${v.from})`} />
            <stop offset="100%" stopColor={`var(${v.to})`} />
          </linearGradient>
        ))}
        {/* both-apart → diagonal two-tone (amber / teal). */}
        <pattern
          id="wm-pattern-both-apart"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45)"
        >
          <rect width="6" height="6" fill="var(--color-amber)" />
          <rect width="3" height="6" fill="var(--color-teal)" />
        </pattern>
      </defs>

      {/* Ocean / ground */}
      <rect
        x={0}
        y={0}
        width={W}
        height={H}
        fill="var(--color-paper)"
        opacity={0.5}
      />

      <g>
        {GEO.map((g) => {
          const agg = g.iso2 ? countries.get(g.iso2) : undefined
          const status = agg?.status ?? "unvisited"
          const focused = focusedIso && g.iso2 === focusedIso
          return (
            <path
              key={g.key}
              d={g.d}
              fill={statusFill(status)}
              fillOpacity={agg ? depthOpacity(agg.depth) : 0.5}
              stroke={focused ? "var(--color-ink)" : "var(--color-ink-soft)"}
              strokeOpacity={focused ? 0.9 : 0.25}
              strokeWidth={focused ? 1.1 : 0.4}
              className="wm-country"
              tabIndex={g.iso2 ? 0 : -1}
              role={g.iso2 ? "button" : undefined}
              aria-label={
                g.iso2 && agg
                  ? `${agg.name}: ${statusSummary(agg)}`
                  : g.iso2
                    ? "Not yet visited"
                    : undefined
              }
              onMouseEnter={() => g.iso2 && onHover?.(g.iso2)}
              onMouseLeave={() => onHover?.(null)}
              onFocus={() => g.iso2 && onHover?.(g.iso2)}
              onBlur={() => onHover?.(null)}
              onClick={() => g.iso2 && onSelect?.(g.iso2)}
              onKeyDown={(e) => {
                if (g.iso2 && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault()
                  onSelect?.(g.iso2)
                }
              }}
            />
          )
        })}

        {/* Hybrid nuance: a tiny solo dot on a together country that's also solo. */}
        {GEO.map((g) => {
          const agg = g.iso2 ? countries.get(g.iso2) : undefined
          if (!agg || agg.status !== "together") return null
          if (!agg.hasMeSolo && !agg.hasPartnerSolo) return null
          return (
            <circle
              key={`solo-${g.key}`}
              cx={g.centroid[0]}
              cy={g.centroid[1]}
              r={1.8}
              fill={
                agg.hasMeSolo ? "var(--color-amber)" : "var(--color-teal)"
              }
              stroke="var(--color-paper)"
              strokeWidth={0.5}
              pointerEvents="none"
            />
          )
        })}

        {/* Aspirational pins. */}
        {pinnedCentroids.map((p) => (
          <PinBadge key={`pin-${p.iso2}`} x={p.x} y={p.y} kind={p.kind} />
        ))}
      </g>
    </svg>
  )
}
