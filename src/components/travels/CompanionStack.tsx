"use client"

import { cn } from "@/lib/utils"
import type { TripCompanion } from "@/lib/types/trips.types"

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}

/**
 * CompanionStack — an overlapping avatar row for a trip's logged companions.
 * Companions are free-form people (not Y2 accounts), so an avatar may just be
 * an initial on a sand chip. Presentational; safe with an empty list.
 */
export function CompanionStack({
  companions,
  size = 28,
  max = 4,
  className,
}: {
  companions: TripCompanion[]
  size?: number
  max?: number
  className?: string
}) {
  if (companions.length === 0) return null

  const shown = companions.slice(0, max)
  const overflow = companions.length - shown.length

  return (
    <div className={cn("flex items-center", className)} aria-label="Companions">
      {shown.map((c, i) => (
        <span
          key={c.id}
          className="grid place-items-center overflow-hidden rounded-full border-2"
          style={{
            width: size,
            height: size,
            marginInlineStart: i === 0 ? 0 : -size * 0.32,
            borderColor: "var(--card)",
            background: "var(--color-sand)",
            zIndex: shown.length - i,
          }}
          title={c.relation ? `${c.name} · ${c.relation}` : c.name}
        >
          {c.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.avatar_url}
              alt=""
              onError={hideOnError}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="font-extrabold leading-none"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-terracotta)",
                fontSize: Math.round(size * 0.42),
              }}
            >
              {c.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="grid place-items-center rounded-full border-2 font-bold leading-none"
          style={{
            width: size,
            height: size,
            marginInlineStart: -size * 0.32,
            borderColor: "var(--card)",
            background: "var(--color-clay)",
            color: "var(--color-ink)",
            fontSize: Math.round(size * 0.36),
            fontFamily: "var(--font-nav)",
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
