"use client"

import { motion } from "framer-motion"
import { MapPin, Plus, Plane, ChevronRight, ExternalLink } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { CompanionStack } from "@/components/travels/CompanionStack"
import { formatDateRange } from "@/components/travels/format"
import {
  TRIP_STATUS_LABELS,
  type TripWithCompanions,
  type TripStatus,
} from "@/lib/types/trips.types"

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none"
}

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: EASE, delay: Math.min(i, 6) * 0.05 },
})

// Status → accent hairline + chip colour (design tokens only).
const STATUS_ACCENT: Record<TripStatus, "teal" | "amber" | "terracotta"> = {
  upcoming: "teal",
  ongoing: "amber",
  past: "terracotta",
}
const STATUS_CHIP: Record<TripStatus, string> = {
  upcoming: "var(--color-teal)",
  ongoing: "var(--color-amber)",
  past: "var(--color-terracotta)",
}

// Order trips so the story reads upcoming → ongoing → past.
const STATUS_ORDER: Record<string, number> = { ongoing: 0, upcoming: 1, past: 2 }

export type TravelsViewProps = {
  trips: TripWithCompanions[]
  isLoading?: boolean
  /** Real on the authed page; omitted in /preview so the affordance is inert. */
  onLogTravel?: () => void
  /** Per-trip tap. Omitted in /preview. */
  onOpenTrip?: (tripId: string) => void
}

export function TravelsView({
  trips,
  isLoading = false,
  onLogTravel,
  onOpenTrip,
}: TravelsViewProps) {
  const ordered = [...trips].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 9
    const sb = STATUS_ORDER[b.status] ?? 9
    if (sa !== sb) return sa - sb
    // within a status, newest first
    return (b.start_date ?? b.created_at).localeCompare(
      a.start_date ?? a.created_at
    )
  })

  return (
    <div
      className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6"
      style={{ background: "var(--background)" }}
    >
      {/* ── Header ── */}
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p
            className="text-[19px] leading-none"
            style={{
              fontFamily: "var(--font-arabic)",
              color: "var(--color-teal-deep)",
            }}
          >
            رحلاتنا
          </p>
          <h1
            className="mt-1 text-[30px] font-extrabold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--foreground)",
            }}
          >
            Travels
          </h1>
          <p
            className="mt-1 text-[15px]"
            style={{
              fontFamily: "var(--font-handwritten)",
              color: "var(--color-ink-soft)",
            }}
          >
            everywhere you&apos;ve wandered, together
          </p>
        </div>

        {onLogTravel && (
          <motion.button
            type="button"
            onClick={onLogTravel}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.15 }}
            aria-label="Log a travel"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            style={{
              background: "var(--gradient-copper)",
              color: "#FFF7EF",
              boxShadow: "var(--shadow-warm-md)",
            }}
          >
            <Plus size={22} strokeWidth={2.25} />
          </motion.button>
        )}
      </header>

      {/* ── Body ── */}
      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[220px] w-full animate-pulse rounded-[24px]"
              style={{ background: "var(--color-sand)" }}
            />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={<Plane size={26} strokeWidth={1.75} />}
          title="No travels yet"
          subtitle="Log your first trip — where you went, who came along, the little moments."
          actionLabel={onLogTravel ? "Log a travel" : undefined}
          onAction={onLogTravel}
        />
      ) : (
        <div className="space-y-4">
          {ordered.map((trip, i) => (
            <motion.div key={trip.id} {...fadeUp(i)}>
              <TripCard trip={trip} onOpen={onOpenTrip} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function TripCard({
  trip,
  onOpen,
}: {
  trip: TripWithCompanions
  onOpen?: (tripId: string) => void
}) {
  const status = (trip.status as TripStatus) ?? "past"
  const dateRange = formatDateRange(trip.start_date, trip.end_date)
  const isHosted = trip.kind === "hosted"

  return (
    <PosterCard
      accent={STATUS_ACCENT[status]}
      interactive={!!onOpen}
      grain={false}
      onClick={onOpen ? () => onOpen(trip.id) : undefined}
      className="!p-0"
    >
      {/* Cover */}
      <div className="relative h-[170px] w-full overflow-hidden">
        {trip.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.cover_image}
            alt=""
            aria-hidden
            onError={hideOnError}
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/assets/scenes/scene-lantern-dusk.webp"
            alt=""
            aria-hidden
            onError={hideOnError}
            className="h-full w-full object-cover"
            style={{ filter: "saturate(0.92)" }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(42,32,24,0) 38%, rgba(42,32,24,0.74) 100%)",
          }}
        />

        {/* Status chip */}
        <span
          className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{
            fontFamily: "var(--font-nav)",
            background: STATUS_CHIP[status],
            color: "#FFF7EF",
          }}
        >
          {TRIP_STATUS_LABELS[status]}
        </span>

        {/* Hosted badge */}
        {isHosted && (
          <span
            className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{
              fontFamily: "var(--font-nav)",
              background: "rgba(25,26,44,0.66)",
              color: "#F2C99B",
              backdropFilter: "blur(4px)",
            }}
          >
            <ExternalLink size={11} strokeWidth={2.5} /> Trip site
          </span>
        )}

        {/* Title block over the image */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h2
            className="text-[22px] font-extrabold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}
          >
            {trip.title}
          </h2>
          {trip.destination && (
            <p
              className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold"
              style={{ fontFamily: "var(--font-body)", color: "#F4E3C8" }}
            >
              <MapPin size={13} strokeWidth={2.25} />
              {trip.destination}
            </p>
          )}
        </div>
      </div>

      {/* Footer: dates + companions */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          {dateRange ? (
            <p
              className="truncate text-[13px] font-semibold tabular-nums"
              style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
            >
              {dateRange}
            </p>
          ) : (
            <p className="text-[13px]" style={{ color: "var(--color-ink-soft)" }}>
              No dates yet
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <CompanionStack companions={trip.companions} />
          {onOpen && (
            <ChevronRight size={18} style={{ color: "var(--color-ink-soft)" }} />
          )}
        </div>
      </div>
    </PosterCard>
  )
}

// ── Mock data for /preview + a shape reference ──
export const TRAVELS_MOCK: TripWithCompanions[] = [
  {
    id: "trip-1",
    created_by: "yahya",
    title: "Cambridge & London",
    destination: "England",
    start_date: "2025-08-12",
    end_date: "2025-08-19",
    cover_image: "/assets/scenes/scene-cairo-skyline-night.webp",
    summary: "A week of colleges, river punting and rainy bookshops with Mum.",
    kind: "hosted",
    // Bundle folder key under content/trips/ (not a URL) — see the serve route.
    hosted_path: "cambridge-london",
    status: "past",
    created_at: "2025-08-20T00:00:00Z",
    companions: [
      {
        id: "c1",
        trip_id: "trip-1",
        name: "Mum",
        relation: "Mother",
        avatar_url: null,
        created_at: "2025-08-20T00:00:00Z",
      },
    ],
  },
  {
    id: "trip-2",
    created_by: "yahya",
    title: "Sahel Summer",
    destination: "North Coast, Egypt",
    start_date: "2026-07-03",
    end_date: "2026-07-10",
    cover_image: "/assets/scenes/scene-rooftop-night.webp",
    summary: null,
    kind: "native",
    hosted_path: null,
    status: "upcoming",
    created_at: "2026-06-01T00:00:00Z",
    companions: [
      {
        id: "c2",
        trip_id: "trip-2",
        name: "Yara",
        relation: "Love",
        avatar_url: null,
        created_at: "2026-06-01T00:00:00Z",
      },
      {
        id: "c3",
        trip_id: "trip-2",
        name: "Omar",
        relation: "Friend",
        avatar_url: null,
        created_at: "2026-06-01T00:00:00Z",
      },
      {
        id: "c4",
        trip_id: "trip-2",
        name: "Layla",
        relation: "Friend",
        avatar_url: null,
        created_at: "2026-06-01T00:00:00Z",
      },
    ],
  },
]
