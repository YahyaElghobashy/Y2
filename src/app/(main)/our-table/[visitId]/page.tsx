"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useFoodJournal } from "@/lib/hooks/use-food-journal"
import { PageTransition } from "@/components/animations/PageTransition"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { PreferenceDot } from "@/components/food/PreferenceDot"
import { RatingReveal } from "@/components/food/RatingReveal"
import {
  RATING_DIMENSIONS,
  CUISINE_LABELS,
  PHOTO_TYPE_LABELS,
  type CuisineType,
  type PhotoType,
  type FoodVisit,
} from "@/lib/types/food-journal.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

// Leaflet mini-map — dynamic import (no SSR)
const MiniMap = dynamic(
  () => import("./MiniMap").then((mod) => ({ default: mod.MiniMap })),
  { ssr: false }
)

export default function VisitDetailPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const router = useRouter()
  const {
    visits,
    isLoading,
    getVisitById,
    getMyRating,
    getPartnerRating,
    getPhotos,
    getPreferenceDot,
    updateVisit,
  } = useFoodJournal()

  const [photoIndex, setPhotoIndex] = useState(0)
  const [showReveal, setShowReveal] = useState(false)
  const [notes, setNotes] = useState("")
  const notesInitialized = useRef(false)

  const visitData = useMemo(
    () => (visitId ? getVisitById(visitId) : null),
    [visitId, getVisitById]
  )

  const myRating = visitId ? getMyRating(visitId) : null
  const partnerRating = visitId ? getPartnerRating(visitId) : null
  const photos = visitId ? getPhotos(visitId) : []

  // Initialize notes from visit data
  useEffect(() => {
    if (visitData && !notesInitialized.current) {
      setNotes(visitData.notes ?? "")
      notesInitialized.current = true
    }
  }, [visitData])

  // ── Return history — same place ─────────────────────────────
  const returnHistory = useMemo(() => {
    if (!visitData) return []
    const placeKey = visitData.place_id ?? visitData.place_name
    return visits
      .filter((v) => (v.place_id ?? v.place_name) === placeKey)
      .sort(
        (a, b) =>
          new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
      )
  }, [visitData, visits])

  const getScoreTrend = useCallback(
    (currentVisit: FoodVisit, previousVisit: FoodVisit) => {
      const current = getMyRating(currentVisit.id)?.overall_average
      const previous = getMyRating(previousVisit.id)?.overall_average
      if (current == null || previous == null) return null
      if (current > previous) return "up"
      if (current < previous) return "down"
      return "same"
    },
    [getMyRating]
  )

  // ── Notes auto-save ─────────────────────────────────────────
  const handleNotesBlur = useCallback(async () => {
    if (!visitId || !visitData) return
    if (notes === (visitData.notes ?? "")) return
    await updateVisit(visitId, { notes })
  }, [visitId, visitData, notes, updateVisit])

  // ── Share card ──────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!visitData) return

    const canvas = document.createElement("canvas")
    canvas.width = 600
    canvas.height = 400
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Background
    ctx.fillStyle = "#FBF8F4"
    ctx.fillRect(0, 0, 600, 400)

    // Header bar
    ctx.fillStyle = "#C4956A"
    ctx.fillRect(0, 0, 600, 6)

    // Restaurant name
    ctx.fillStyle = "#2C2825"
    ctx.font = "bold 28px serif"
    ctx.textAlign = "center"
    ctx.fillText(visitData.place_name, 300, 120, 560)

    // Cuisine
    ctx.fillStyle = "#8A7F76"
    ctx.font = "16px sans-serif"
    ctx.fillText(
      CUISINE_LABELS[visitData.cuisine_type as CuisineType] ?? visitData.cuisine_type,
      300,
      155
    )

    // Score
    if (myRating?.overall_average != null) {
      ctx.fillStyle = "#C4956A"
      ctx.font = "bold 64px serif"
      ctx.fillText(myRating.overall_average.toFixed(1), 300, 250)
      ctx.fillStyle = "#8A7F76"
      ctx.font = "14px sans-serif"
      ctx.fillText("Overall Score", 300, 275)
    }

    // Date
    const formattedDate = new Date(visitData.visit_date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    ctx.fillStyle = "#B5ADA4"
    ctx.font = "14px sans-serif"
    ctx.fillText(formattedDate, 300, 340)

    // Watermark
    ctx.fillStyle = "#E8D5C0"
    ctx.font = "bold 12px sans-serif"
    ctx.fillText("Y2 — Our Table", 300, 380)

    canvas.toBlob(async (blob) => {
      if (!blob) return

      const file = new File([blob], `${visitData.place_name}-review.png`, {
        type: "image/png",
      })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${visitData.place_name} — Our Table`,
        })
      } else {
        // Download fallback
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
      }
    }, "image/png")
  }, [visitData, myRating])

  // ── Photo navigation ────────────────────────────────────────
  const nextPhoto = () => setPhotoIndex((i) => Math.min(i + 1, photos.length - 1))
  const prevPhoto = () => setPhotoIndex((i) => Math.max(i - 1, 0))

  if (isLoading) {
    return (
      <PageTransition className="px-5 pb-24 pt-4">
        <div className="space-y-4" data-testid="visit-detail-skeleton">
          <div className="h-48 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
          <div className="h-6 w-2/3 animate-pulse rounded bg-[var(--bg-secondary)]" />
          <div className="h-32 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
        </div>
      </PageTransition>
    )
  }

  if (!visitData) {
    return (
      <PageTransition className="px-5 pb-24 pt-4">
        <EmptyState
          icon={<span className="text-[48px]">404</span>}
          title="Visit not found"
          subtitle="This visit may have been deleted"
          actionLabel="Back to Our Table"
          actionHref="/our-table"
        />
      </PageTransition>
    )
  }

  const bothReviewed = myRating?.both_reviewed ?? false
  const showRateCTA = !myRating

  return (
    <>
      <PageHeader title={visitData.place_name} backHref="/our-table" />

      <PageTransition className="px-5 pb-24 pt-4">
        {/* Photo Gallery */}
        {photos.length > 0 && (
          <div data-testid="photo-gallery" className="relative mb-5 overflow-hidden rounded-2xl">
            <div className="relative h-56">
              <AnimatePresence mode="wait">
                <motion.div
                  key={photoIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-[var(--bg-secondary)] flex items-center justify-center"
                >
                  <img
                    src={photos[photoIndex]?.storage_path}
                    alt={PHOTO_TYPE_LABELS[photos[photoIndex]?.photo_type as PhotoType] ?? "Photo"}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Type badge */}
              <span className="absolute top-3 start-3 rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                {PHOTO_TYPE_LABELS[photos[photoIndex]?.photo_type as PhotoType] ?? "Photo"}
              </span>

              {/* Nav arrows */}
              {photos.length > 1 && (
                <>
                  {photoIndex > 0 && (
                    <button
                      data-testid="photo-prev"
                      onClick={prevPhoto}
                      className="absolute start-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  {photoIndex < photos.length - 1 && (
                    <button
                      data-testid="photo-next"
                      onClick={nextPhoto}
                      className="absolute end-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </>
              )}

              {/* Dots */}
              {photos.length > 1 && (
                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === photoIndex
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/50"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <span
              data-testid="cuisine-label"
              className="rounded-full bg-[var(--accent-soft,#E8D5C0)]/30 px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]"
            >
              {CUISINE_LABELS[visitData.cuisine_type as CuisineType] ?? visitData.cuisine_type}
            </span>
            <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
              {new Date(visitData.visit_date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <button
            data-testid="share-btn"
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            aria-label="Share"
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Rate CTA */}
        {showRateCTA && (
          <motion.button
            data-testid="rate-cta"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            onClick={() => router.push(`/our-table/new?step=3&visitId=${visitId}`)}
            className="mb-5 w-full rounded-2xl bg-[var(--accent-primary,#C4956A)] py-3 text-center text-[14px] font-medium text-white"
          >
            Rate this visit!
          </motion.button>
        )}

        {/* Rating Bars */}
        {myRating && (
          <div data-testid="rating-section" className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold font-display text-[var(--text-primary)]">
                Ratings
              </h3>
              {bothReviewed && (
                <button
                  data-testid="replay-reveal-btn"
                  onClick={() => setShowReveal(true)}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent-primary,#C4956A)]"
                >
                  <RefreshCcw size={12} />
                  Replay Reveal
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {RATING_DIMENSIONS.filter((d) => d.key !== "vibe_score").map((dim) => {
                const myScore = (myRating as unknown as Record<string, number>)[dim.key] ?? 0
                const partnerScore = partnerRating
                  ? (partnerRating as unknown as Record<string, number>)[dim.key] ?? 0
                  : null
                const dotColor = visitId ? getPreferenceDot(visitId, dim.key) : null

                return (
                  <div key={dim.key} data-testid={`rating-bar-${dim.key}`} className="flex items-center gap-2">
                    <div className="w-16 flex items-center gap-1">
                      {dotColor && (
                        <PreferenceDot color={dotColor} myScore={myScore} partnerScore={partnerScore ?? undefined} />
                      )}
                      <span className="text-[11px] text-[var(--text-secondary)] truncate">{dim.label}</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--accent-primary,#C4956A)]"
                            style={{ width: `${(myScore / 10) * 100}%` }}
                          />
                        </div>
                        <span className="w-4 text-end text-[10px] font-medium text-[var(--text-primary)]">{myScore}</span>
                      </div>
                      {partnerScore !== null && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#B5ADA4]"
                              style={{ width: `${(partnerScore / 10) * 100}%` }}
                            />
                          </div>
                          <span className="w-4 text-end text-[10px] font-medium text-[var(--text-muted)]">{partnerScore}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Overall Score Badge */}
            <div data-testid="overall-badge" className="mt-4 flex justify-center">
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-[var(--text-muted)]">Overall</span>
                <div className="mt-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-primary,#C4956A)] text-white">
                  <span className="text-[24px] font-bold font-display">
                    {myRating.overall_average?.toFixed(1) ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Return History */}
        {returnHistory.length > 1 && (
          <div data-testid="return-history" className="mb-5">
            <h3 className="mb-3 text-[14px] font-bold font-display text-[var(--text-primary)]">
              Visit History
            </h3>
            <div className="flex flex-col gap-2">
              {returnHistory.map((rv, idx) => {
                const trend = idx > 0 ? getScoreTrend(rv, returnHistory[idx - 1]) : null
                const score = getMyRating(rv.id)?.overall_average
                const isCurrentVisit = rv.id === visitId

                return (
                  <div
                    key={rv.id}
                    data-testid={`history-item-${rv.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-2.5",
                      isCurrentVisit ? "bg-[var(--accent-soft,#E8D5C0)]/20" : "bg-[var(--bg-secondary)]"
                    )}
                  >
                    <span className="text-[11px] font-medium text-[var(--text-muted)] w-6">
                      #{idx + 1}
                    </span>
                    <span className="flex-1 text-[12px] text-[var(--text-secondary)]">
                      {new Date(rv.visit_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {score != null && (
                      <span className="text-[13px] font-bold font-display text-[var(--text-primary)]">
                        {score.toFixed(1)}
                      </span>
                    )}
                    {trend && (
                      <span data-testid={`trend-${rv.id}`}>
                        {trend === "up" && <ArrowUp size={12} className="text-green-500" />}
                        {trend === "down" && <ArrowDown size={12} className="text-red-500" />}
                        {trend === "same" && <Minus size={12} className="text-[var(--text-muted)]" />}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div data-testid="notes-section" className="mb-5">
          <h3 className="mb-2 text-[14px] font-bold font-display text-[var(--text-primary)]">
            Notes
          </h3>
          <textarea
            data-testid="notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add notes about this visit..."
            className="w-full resize-none rounded-xl bg-[var(--bg-secondary)] p-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            rows={3}
          />
        </div>

        {/* Mini Map */}
        {visitData.lat && visitData.lng && (
          <div data-testid="mini-map" className="mb-5 overflow-hidden rounded-2xl" style={{ height: 150 }}>
            <MiniMap lat={Number(visitData.lat)} lng={Number(visitData.lng)} />
          </div>
        )}
      </PageTransition>

      {/* Rating Reveal Overlay */}
      {showReveal && myRating && partnerRating && (
        <RatingReveal
          myRating={myRating}
          partnerRating={partnerRating}
          onClose={() => setShowReveal(false)}
        />
      )}
    </>
  )
}
