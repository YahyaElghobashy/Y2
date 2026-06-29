"use client"

import { STATUS_VISUALS } from "@/lib/travels/country-status"

/**
 * MapLegend — the visual key for the world map: who-visited gradients + the pin
 * markers. Token colours only.
 */
const PIN_LEGEND: { label: string; color: string }[] = [
  { label: "Yahya's pin", color: "var(--color-amber)" },
  { label: "Yara's pin", color: "var(--color-teal)" },
  { label: "Shared dream", color: "var(--color-coral)" },
]

function Swatch({ from, to, pattern }: { from: string; to: string; pattern?: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-[4px]"
      style={{
        background: pattern
          ? `repeating-linear-gradient(45deg, var(${from}), var(${from}) 3px, var(${to}) 3px, var(${to}) 6px)`
          : `linear-gradient(180deg, var(${from}), var(${to}))`,
        boxShadow: "inset 0 0 0 1px rgba(42,32,24,0.12)",
      }}
    />
  )
}

export function MapLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]"
      style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
    >
      {STATUS_VISUALS.filter((v) => v.status !== "unvisited").map((v) => (
        <span key={v.status} className="inline-flex items-center gap-1.5">
          <Swatch from={v.from} to={v.to} pattern={v.pattern} />
          {v.label}
        </span>
      ))}
      <span aria-hidden className="opacity-40">
        ·
      </span>
      {PIN_LEGEND.map((p) => (
        <span key={p.label} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: p.color }}
          />
          {p.label}
        </span>
      ))}
    </div>
  )
}
