"use client"

import { Plane, Sparkles } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { COUNTRY_NAME } from "@/lib/data/iso-country-codes"
import type { OurNextTrip as OurNextTripData } from "@/lib/types/world-map.types"

/**
 * OurNextTrip — the highlighted shared destination derived from mutual pins.
 * Rendered on the Travels map AND (compact) on Home. Presentational: the
 * "Start planning" CTA is an optional callback (inert in /preview).
 */
export type OurNextTripProps = {
  next: OurNextTripData | null
  /** Tap to make it an upcoming trip. Omitted in /preview. */
  onStartPlanning?: (countryCode: string) => void
  /** Pick a different mutual candidate (when more than one). */
  onChoose?: (countryCode: string) => void
  compact?: boolean
}

export function OurNextTrip({ next, onStartPlanning, onChoose, compact }: OurNextTripProps) {
  if (!next) return null

  return (
    <PosterCard accent="coral" className={compact ? "p-4" : undefined}>
      <div className="flex items-center gap-1.5">
        <Sparkles size={14} style={{ color: "var(--color-coral)" }} />
        <p
          className="text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ fontFamily: "var(--font-nav)", color: "var(--color-coral)" }}
        >
          Our Next Adventure
        </p>
      </div>

      <h3
        className={compact ? "mt-1 text-[22px] font-bold" : "mt-1 text-[28px] font-bold leading-tight"}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {next.name}
      </h3>

      <p
        className="mt-0.5 text-[13px] italic"
        style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}
      >
        You both pinned it. {next.needsChoice ? "One of your shared dreams." : "Your shared dream."}
      </p>

      {next.needsChoice && next.candidates.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {next.candidates.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onChoose?.(code)}
              className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
              style={{
                fontFamily: "var(--font-nav)",
                background: code === next.countryCode ? "var(--color-coral)" : "var(--background)",
                color: code === next.countryCode ? "#fff" : "var(--color-ink)",
                border: "1px solid var(--border)",
              }}
            >
              {COUNTRY_NAME[code] ?? code}
            </button>
          ))}
        </div>
      )}

      {onStartPlanning && (
        <button
          type="button"
          onClick={() => onStartPlanning(next.countryCode)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-white"
          style={{ background: "var(--color-coral)", fontFamily: "var(--font-nav)" }}
        >
          <Plane size={15} />
          {next.upcomingTripId ? "View the plan" : "Start planning"}
        </button>
      )}
    </PosterCard>
  )
}
