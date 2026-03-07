"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
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
        className="flex items-center gap-4 rounded-xl bg-white p-3"
        style={{
          border: "1px solid rgba(184,115,51,0.06)",
          boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
        }}
      >
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[14px] font-bold text-[var(--text-primary)] truncate">
              {placeName}
            </p>
            {visitNumber > 1 && (
              <span
                data-testid={`visit-count-badge-${id}`}
                className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
              >
                ×{visitNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              data-testid={`cuisine-pill-${id}`}
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
          <div
            data-testid={`score-badge-${id}`}
            className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold",
              overallScore >= 8
                ? "bg-[var(--accent-copper,#B87333)] text-white"
                : overallScore >= 6
                  ? "bg-[#DAA520] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
            )}
          >
            {overallScore.toFixed(1)}
          </div>
        )}

        {/* Arrow */}
        <ChevronRight
          size={16}
          className="flex-shrink-0"
          style={{ color: "var(--text-muted, #B5ADA4)" }}
        />
      </motion.div>
    </Link>
  )
}
