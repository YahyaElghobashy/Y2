"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Map as MapIcon, List, Plus, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFoodJournal } from "@/lib/hooks/use-food-journal"
import { VisitListItem } from "@/components/food/VisitListItem"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageTransition } from "@/components/animations/PageTransition"
import {
  CUISINE_TYPES,
  CUISINE_LABELS,
  type CuisineType,
  type FoodVisit,
} from "@/lib/types/food-journal.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

// Dynamic import — Leaflet requires window
const FoodMap = dynamic(
  () => import("@/components/food/FoodMap").then((mod) => ({ default: mod.FoodMap })),
  { ssr: false, loading: () => <MapSkeleton /> }
)

function MapSkeleton() {
  return (
    <div
      data-testid="map-skeleton"
      className="h-full w-full animate-pulse rounded-2xl bg-[var(--bg-secondary)]"
    />
  )
}

type ViewMode = "map" | "list"

export default function OurTablePage() {
  const { visits, isLoading, getMyRating, getPartnerRating } = useFoodJournal()

  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [cuisineFilter, setCuisineFilter] = useState<CuisineType[]>([])
  const [showHighScores, setShowHighScores] = useState(false)
  const [showReturnOnly, setShowReturnOnly] = useState(false)

  // ── Visit number computation ────────────────────────────────
  const visitNumberMap = useMemo(() => {
    const map = new Map<string, number>()
    const countByPlace = new Map<string, number>()

    // Process in chronological order
    const sorted = [...visits].sort(
      (a, b) =>
        new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
    )

    for (const v of sorted) {
      const key = v.place_id ?? v.place_name
      const count = (countByPlace.get(key) ?? 0) + 1
      countByPlace.set(key, count)
      map.set(v.id, count)
    }

    return map
  }, [visits])

  const getVisitNumber = useCallback(
    (visit: FoodVisit) => visitNumberMap.get(visit.id) ?? 1,
    [visitNumberMap]
  )

  const getOverallScore = useCallback(
    (visitId: string): number | null => {
      const mine = getMyRating(visitId)
      return mine?.overall_average ?? null
    },
    [getMyRating]
  )

  // ── Filtering ──────────────────────────────────────────────
  const filteredVisits = useMemo(() => {
    let result = visits

    if (cuisineFilter.length > 0) {
      result = result.filter((v) =>
        cuisineFilter.includes(v.cuisine_type as CuisineType)
      )
    }

    if (showHighScores) {
      result = result.filter((v) => {
        const score = getOverallScore(v.id)
        return score !== null && score >= 8
      })
    }

    if (showReturnOnly) {
      result = result.filter((v) => {
        const num = getVisitNumber(v)
        return num > 1
      })
    }

    return result
  }, [visits, cuisineFilter, showHighScores, showReturnOnly, getOverallScore, getVisitNumber])

  const toggleCuisineFilter = (cuisine: CuisineType) => {
    setCuisineFilter((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    )
  }

  if (isLoading) {
    return (
      <PageTransition className="px-5 pb-24 pt-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-[var(--bg-secondary)]"
            />
          ))}
        </div>
      </PageTransition>
    )
  }

  if (visits.length === 0) {
    return (
      <PageTransition className="px-5 pb-24 pt-4">
        <EmptyState
          icon={<UtensilsCrossed size={48} />}
          title="No visits yet"
          subtitle="Start documenting your food adventures together"
          actionLabel="Add First Visit"
          actionHref="/our-table/new"
        />
      </PageTransition>
    )
  }

  return (
    <PageTransition className="flex flex-col pb-24">
      {/* View toggle */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="relative flex rounded-xl bg-[var(--bg-secondary)] p-1">
          <button
            data-testid="toggle-map"
            onClick={() => setViewMode("map")}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              viewMode === "map"
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)]"
            )}
          >
            <MapIcon size={14} />
            Map
          </button>
          <button
            data-testid="toggle-list"
            onClick={() => setViewMode("list")}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              viewMode === "list"
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)]"
            )}
          >
            <List size={14} />
            List
          </button>
          {/* Animated underline */}
          <motion.div
            layoutId="view-toggle-indicator"
            className="absolute top-1 bottom-1 rounded-lg bg-[var(--bg-primary)] shadow-sm"
            style={{
              width: "calc(50% - 4px)",
              left: viewMode === "map" ? 4 : "calc(50%)",
            }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          />
        </div>

        {/* Stats pill */}
        <span
          data-testid="visit-count"
          className="text-[12px] text-[var(--text-muted)]"
        >
          {filteredVisits.length} visit{filteredVisits.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide">
        {/* Score filter */}
        <button
          data-testid="filter-high-score"
          onClick={() => setShowHighScores((v) => !v)}
          className={cn(
            "flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
            showHighScores
              ? "border-[var(--accent-primary,#C4956A)] bg-[var(--accent-primary,#C4956A)]/10 text-[var(--accent-primary,#C4956A)]"
              : "border-[var(--border-subtle)] text-[var(--text-muted)]"
          )}
        >
          8+
        </button>

        {/* Return spots filter */}
        <button
          data-testid="filter-return"
          onClick={() => setShowReturnOnly((v) => !v)}
          className={cn(
            "flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
            showReturnOnly
              ? "border-[var(--accent-primary,#C4956A)] bg-[var(--accent-primary,#C4956A)]/10 text-[var(--accent-primary,#C4956A)]"
              : "border-[var(--border-subtle)] text-[var(--text-muted)]"
          )}
        >
          Returned
        </button>

        {/* Divider */}
        <div className="h-4 w-px flex-shrink-0 bg-[var(--border-subtle)]" />

        {/* Cuisine pills */}
        {CUISINE_TYPES.map((cuisine) => (
          <button
            key={cuisine}
            data-testid={`filter-cuisine-${cuisine}`}
            onClick={() => toggleCuisineFilter(cuisine)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-medium border transition-colors",
              cuisineFilter.includes(cuisine)
                ? "border-[var(--accent-primary,#C4956A)] bg-[var(--accent-primary,#C4956A)]/10 text-[var(--accent-primary,#C4956A)]"
                : "border-[var(--border-subtle)] text-[var(--text-muted)]"
            )}
          >
            {CUISINE_LABELS[cuisine]}
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === "map" ? (
        <div className="flex-1 px-5" style={{ minHeight: "60vh" }}>
          <FoodMap
            visits={filteredVisits}
            getOverallScore={getOverallScore}
            getVisitNumber={getVisitNumber}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-5">
          {filteredVisits.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--text-muted)]">
              No visits match your filters
            </p>
          ) : (
            filteredVisits.map((visit) => (
              <VisitListItem
                key={visit.id}
                id={visit.id}
                placeName={visit.place_name}
                cuisineType={visit.cuisine_type as CuisineType}
                visitDate={visit.visit_date}
                overallScore={getOverallScore(visit.id)}
                visitNumber={getVisitNumber(visit)}
              />
            ))
          )}
        </div>
      )}

      {/* FAB */}
      <Link href="/our-table/new" data-testid="add-visit-fab">
        <motion.div
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          className="fixed bottom-24 end-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary,#C4956A)] text-white shadow-lg"
          aria-label="Add visit"
        >
          <Plus size={22} />
        </motion.div>
      </Link>
    </PageTransition>
  )
}
