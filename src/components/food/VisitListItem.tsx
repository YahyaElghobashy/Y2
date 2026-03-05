"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { CUISINE_LABELS, type CuisineType } from "@/lib/types/food-journal.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type VisitListItemProps = {
  id: string
  placeName: string
  cuisineType: CuisineType
  visitDate: string
  overallScore: number | null
  visitNumber: number
}

export function VisitListItem({
  id,
  placeName,
  cuisineType,
  visitDate,
  overallScore,
  visitNumber,
}: VisitListItemProps) {
  const formattedDate = new Date(visitDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  return (
    <Link href={`/our-table/${id}`}>
      <motion.div
        data-testid={`visit-item-${id}`}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
        className="flex items-center gap-3 rounded-2xl bg-[var(--bg-secondary)] p-3"
      >
        {/* Map pin + visit count */}
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft,#E8D5C0)]/30">
          <MapPin size={20} className="text-[var(--accent-primary,#C4956A)]" />
          {visitNumber > 1 && (
            <span
              data-testid={`visit-count-badge-${id}`}
              className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-primary,#C4956A)] text-[9px] font-bold text-white"
            >
              {visitNumber}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
            {placeName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              data-testid={`cuisine-pill-${id}`}
              className="rounded-full bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
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
          <div
            data-testid={`score-badge-${id}`}
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
      </motion.div>
    </Link>
  )
}
