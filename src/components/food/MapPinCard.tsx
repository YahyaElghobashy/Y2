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
            className="fixed bottom-20 inset-x-4 z-50 rounded-xl bg-white p-4"
            style={{
              border: "1px solid rgba(184,115,51,0.1)",
              boxShadow: "0 8px 32px rgba(44,40,37,0.12), 0 2px 8px rgba(44,40,37,0.06)",
            }}
          >
            <div className="flex items-start gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)] truncate">
                    {placeName}
                  </h3>
                  {visitNumber > 1 && (
                    <span
                      className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                      style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
                    >
                      ×{visitNumber}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight"
                    style={{
                      backgroundColor: "rgba(184,115,51,0.08)",
                      color: "var(--accent-copper, #B87333)",
                    }}
                  >
                    {CUISINE_LABELS[cuisineType] ?? cuisineType}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {formattedDate}
                  </span>
                </div>
              </div>

              {/* Score */}
              {overallScore !== null && (
                <div className="flex-shrink-0 text-end">
                  <p
                    className="font-[family-name:var(--font-display)] font-bold text-[20px]"
                    style={{ color: "var(--accent-copper, #B87333)" }}
                  >
                    {overallScore.toFixed(1)}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
                    Score
                  </p>
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

            {/* View details link */}
            <Link
              href={`/our-table/${visitId}`}
              data-testid="pin-card-link"
              className="mt-3 flex items-center justify-center rounded-xl py-2.5 text-[12px] font-bold text-white"
              style={{
                backgroundColor: "var(--accent-copper, #B87333)",
                boxShadow: "0 2px 8px rgba(184,115,51,0.2)",
              }}
            >
              View Details →
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
