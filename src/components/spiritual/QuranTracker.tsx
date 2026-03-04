"use client"

import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { useQuran } from "@/lib/hooks/use-quran"
import { cn } from "@/lib/utils"

type QuranTrackerProps = {
  className?: string
}

export function QuranTracker({ className }: QuranTrackerProps) {
  const { today, logPages, monthlyTotal, dailyGoal, isLoading, error } =
    useQuran()

  if (isLoading) {
    return (
      <div
        className={cn("px-6 py-4", className)}
        data-testid="quran-tracker-loading"
      >
        <div className="h-4 w-32 rounded bg-[var(--color-bg-secondary,#F5F0E8)] animate-pulse" />
      </div>
    )
  }

  const pagesRead = today?.pages_read ?? 0
  const progress = dailyGoal > 0 ? Math.min(pagesRead / dailyGoal, 1) : 0

  return (
    <div className={cn("px-6 py-4", className)} data-testid="quran-tracker">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[16px] font-semibold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]">
          Quran Reading
        </h3>
        <span
          className="text-[13px] text-[var(--color-text-secondary,#8C8279)]"
          data-testid="monthly-total"
        >
          {monthlyTotal} pages this month
        </span>
      </div>

      {error && (
        <p
          className="text-[12px] text-red-500 mb-3"
          data-testid="quran-error"
        >
          {error}
        </p>
      )}

      {/* Pages read / goal */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[28px] font-bold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]"
            data-testid="pages-read"
          >
            {pagesRead}
          </span>
          <span className="text-[14px] text-[var(--color-text-secondary,#8C8279)]">
            / {dailyGoal} pages
          </span>
        </div>

        <motion.button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent-primary,#C4956A)] text-white"
          whileTap={{ scale: 0.92 }}
          onClick={() => logPages(1)}
          aria-label="Add one page"
          data-testid="add-page-button"
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 w-full rounded-full bg-[var(--color-bg-secondary,#F5F0E8)] overflow-hidden"
        data-testid="progress-bar-track"
      >
        <motion.div
          className="h-full rounded-full bg-[var(--accent-primary,#C4956A)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          data-testid="progress-bar-fill"
        />
      </div>
    </div>
  )
}
