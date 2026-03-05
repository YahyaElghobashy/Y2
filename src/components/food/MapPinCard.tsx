"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CUISINE_LABELS, type CuisineType } from "@/lib/types/food-journal.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type MapPinCardProps = {
  visitId: string
  placeName: string
  cuisineType: CuisineType
  overallScore: number | null
  visitDate: string
  visitNumber: number
  onDismiss: () => void
  isOpen: boolean
}

export function MapPinCard({
  visitId,
  placeName,
  cuisineType,
  overallScore,
  visitDate,
  visitNumber,
  onDismiss,
  isOpen,
}: MapPinCardProps) {
  const formattedDate = new Date(visitDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            data-testid="pin-card-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            onClick={onDismiss}
            className="fixed inset-0 z-40"
          />

          {/* Card */}
          <motion.div
            data-testid={`pin-card-${visitId}`}
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="fixed bottom-20 inset-x-4 z-50 rounded-2xl bg-[var(--bg-secondary,#F5F0E8)] p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              {/* Pin icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft,#E8D5C0)]/30">
                <MapPin size={18} className="text-[var(--accent-primary,#C4956A)]" />
                {visitNumber > 1 && (
                  <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-primary,#C4956A)] text-[9px] font-bold text-white">
                    {visitNumber}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">
                  {placeName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="rounded-full bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                    {CUISINE_LABELS[cuisineType] ?? cuisineType}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {formattedDate}
                  </span>
                </div>
              </div>

              {/* Score */}
              {overallScore !== null && (
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-[14px] font-bold font-[family-name:var(--font-display)]",
                    overallScore >= 8
                      ? "bg-[var(--accent-primary,#C4956A)] text-white"
                      : "bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  )}
                >
                  {overallScore.toFixed(1)}
                </div>
              )}

              {/* Close button */}
              <button
                data-testid="pin-card-close"
                onClick={onDismiss}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)]"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tap to view detail */}
            <Link
              href={`/our-table/${visitId}`}
              data-testid="pin-card-link"
              className="mt-3 flex items-center justify-center rounded-xl bg-[var(--accent-primary,#C4956A)]/10 py-2 text-[12px] font-medium text-[var(--accent-primary,#C4956A)]"
            >
              View Details
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
