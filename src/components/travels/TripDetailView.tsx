"use client"

import { motion } from "framer-motion"
import {
  MapPin,
  Calendar,
  ExternalLink,
  Images,
  Trash2,
  Users,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { PosterCard } from "@/components/shared/PosterCard"
import { Button } from "@/components/ui/button"
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

const STATUS_CHIP: Record<TripStatus, string> = {
  upcoming: "var(--color-teal)",
  ongoing: "var(--color-amber)",
  past: "var(--color-terracotta)",
}

export type TripDetailViewProps = {
  trip: TripWithCompanions
  /** Owner-only affordance; omitted in /preview and for the partner's trips. */
  onDelete?: () => void
  /** Owner-only photo affordance (native trips). Omitted in /preview. */
  onAddPhoto?: () => void
  backHref?: string
}

export function TripDetailView({
  trip,
  onDelete,
  onAddPhoto,
  backHref = "/travels",
}: TripDetailViewProps) {
  const status = (trip.status as TripStatus) ?? "past"
  const dateRange = formatDateRange(trip.start_date, trip.end_date)
  const isHosted = trip.kind === "hosted"

  return (
    <div
      className="skin-aware min-h-[100dvh] pb-28"
      style={{ background: "var(--background)" }}
    >
      <PageHeader
        title="Travel"
        backHref={backHref}
        rightAction={
          onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete this travel"
              className="grid h-9 w-9 place-items-center rounded-full"
              style={{ color: "var(--color-terracotta)" }}
            >
              <Trash2 size={18} strokeWidth={2} />
            </button>
          ) : undefined
        }
      />

      {/* ── Cover hero ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative mx-5 mt-1 overflow-hidden rounded-[26px]"
        style={{ boxShadow: "var(--shadow-warm-lg)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trip.cover_image || "/assets/scenes/scene-lantern-dusk.webp"}
          alt=""
          aria-hidden
          onError={hideOnError}
          className="h-[230px] w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(42,32,24,0) 34%, rgba(42,32,24,0.78) 100%)",
          }}
        />
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
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1
            className="text-[28px] font-extrabold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "#FFF7EF" }}
          >
            {trip.title}
          </h1>
          {trip.destination && (
            <p
              className="mt-1 flex items-center gap-1.5 text-[14px] font-semibold"
              style={{ fontFamily: "var(--font-body)", color: "#F4E3C8" }}
            >
              <MapPin size={14} strokeWidth={2.25} />
              {trip.destination}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Dates ── */}
      {dateRange && (
        <div className="mx-5 mt-4">
          <PosterCard accent="amber" grain={false} className="flex items-center gap-3 !py-3">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{ background: "var(--color-sand)", color: "var(--color-terracotta)" }}
            >
              <Calendar size={18} strokeWidth={2} />
            </span>
            <span
              className="text-[15px] font-semibold tabular-nums"
              style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
            >
              {dateRange}
            </span>
          </PosterCard>
        </div>
      )}

      {/* ── Companions ── */}
      {trip.companions.length > 0 && (
        <section className="mx-5 mt-4">
          <SectionTitle icon={<Users size={15} strokeWidth={2.25} />}>
            Who came along
          </SectionTitle>
          <PosterCard grain={false} className="mt-2 !p-4">
            <div className="flex flex-wrap gap-x-4 gap-y-3">
              {trip.companions.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <CompanionStack companions={[c]} size={32} />
                  <div className="min-w-0">
                    <p
                      className="truncate text-[14px] font-bold leading-tight"
                      style={{
                        fontFamily: "var(--font-body)",
                        color: "var(--foreground)",
                      }}
                    >
                      {c.name}
                    </p>
                    {c.relation && (
                      <p
                        className="truncate text-[12px]"
                        style={{ color: "var(--color-ink-soft)" }}
                      >
                        {c.relation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </PosterCard>
        </section>
      )}

      {/* ── Summary ── */}
      {trip.summary && (
        <section className="mx-5 mt-4">
          <PosterCard accent="teal" className="!p-5">
            <p
              className="text-[16px] leading-relaxed"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--foreground)",
              }}
            >
              {trip.summary}
            </p>
          </PosterCard>
        </section>
      )}

      {/* ── HOSTED: open the external trip site ── */}
      {isHosted ? (
        <section className="mx-5 mt-5">
          <PosterCard accent="indigo" className="!p-5 text-center">
            <span
              className="mx-auto grid h-12 w-12 place-items-center rounded-2xl"
              style={{ background: "var(--color-sand)", color: "var(--color-indigo)" }}
            >
              <ExternalLink size={22} strokeWidth={2} />
            </span>
            <h3
              className="mt-3 text-[17px] font-bold"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              This trip has its own little world
            </h3>
            <p
              className="mx-auto mt-1 max-w-[260px] text-[13px]"
              style={{ color: "var(--color-ink-soft)" }}
            >
              A dedicated page of photos, maps and memories from this journey.
            </p>
            {trip.hosted_path ? (
              <div className="mt-4 flex justify-center">
                <Button variant="copper" asChild>
                  {/* Plain anchor: hosted_path may be an external/static route
                      outside Next's router. Opens the gated trip site. */}
                  <a href={trip.hosted_path}>Open the trip</a>
                </Button>
              </div>
            ) : (
              <p
                className="mt-4 text-[13px] font-semibold"
                style={{ color: "var(--color-terracotta)" }}
              >
                The trip site isn&apos;t linked yet.
              </p>
            )}
          </PosterCard>
        </section>
      ) : (
        // ── NATIVE: photos area ──
        <section className="mx-5 mt-5">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Images size={15} strokeWidth={2.25} />}>
              Photos
            </SectionTitle>
            {onAddPhoto && (
              <button
                type="button"
                onClick={onAddPhoto}
                className="text-[13px] font-bold"
                style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}
              >
                + Add
              </button>
            )}
          </div>

          <PosterCard grain={false} className="mt-2 !p-6">
            <div className="flex flex-col items-center text-center">
              <span
                className="grid h-12 w-12 place-items-center rounded-2xl"
                style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)" }}
              >
                <Images size={22} strokeWidth={1.75} />
              </span>
              <p
                className="mt-3 text-[14px] font-semibold"
                style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
              >
                Photos coming soon
              </p>
              <p
                className="mt-1 max-w-[260px] text-[13px]"
                style={{ color: "var(--color-ink-soft)" }}
              >
                {/* TODO(travels-photos): wire trip photo uploads + an itinerary
                    timeline (reuse media-upload + the snap gallery patterns).
                    Tracked for the native-trip v2. */}
                A gallery for this trip — and a day-by-day itinerary — lands in a
                later update.
              </p>
              {onAddPhoto && (
                <div className="mt-4">
                  <Button variant="warm" size="sm" onClick={onAddPhoto}>
                    Add the first photo
                  </Button>
                </div>
              )}
            </div>
          </PosterCard>
        </section>
      )}
    </div>
  )
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <h2
      className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.12em]"
      style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
    >
      <span style={{ color: "var(--color-terracotta)" }}>{icon}</span>
      {children}
    </h2>
  )
}

// ── Mocks for /preview ──
export const TRIP_DETAIL_NATIVE_MOCK: TripWithCompanions = {
  id: "trip-2",
  created_by: "yahya",
  title: "Sahel Summer",
  destination: "North Coast, Egypt",
  start_date: "2026-07-03",
  end_date: "2026-07-10",
  cover_image: "/assets/scenes/scene-rooftop-night.webp",
  summary:
    "Long lazy mornings, salt in our hair, and that one sunset we didn't photograph because we were too busy watching it.",
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
  ],
}

export const TRIP_DETAIL_HOSTED_MOCK: TripWithCompanions = {
  id: "trip-1",
  created_by: "yahya",
  title: "Cambridge & London",
  destination: "England",
  start_date: "2025-08-12",
  end_date: "2025-08-19",
  cover_image: "/assets/scenes/scene-cairo-skyline-night.webp",
  summary: "A week of colleges, river punting and rainy bookshops with Mum.",
  kind: "hosted",
  hosted_path: "/e/cambridge-london",
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
}
