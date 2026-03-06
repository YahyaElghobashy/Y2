"use client"

import { BookOpen, Plus } from "lucide-react"
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
        <div className="h-4 w-32 rounded bg-[var(--bg-soft-cream,#F5EDE3)] animate-skeleton-warm" />
      </div>
    )
  }

  if (error && !today) {
    return (
      <div className={cn("px-6 py-4", className)} data-testid="quran-tracker-error">
        <h3
          className="text-sm uppercase tracking-[0.2em] font-bold mb-2"
          style={{ color: "var(--sage, #A8B5A0)" }}
        >
          Quran Journey
        </h3>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4">
          <p className="text-[13px] text-[var(--text-muted)]">
            Could not load reading data
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-[13px] font-medium"
            style={{ color: "var(--sage, #A8B5A0)" }}
          >
            Tap to reload
          </button>
        </div>
      </div>
    )
  }

  const pagesRead = today?.pages_read ?? 0
  const progress = dailyGoal > 0 ? Math.min(pagesRead / dailyGoal, 1) : 0

  return (
    <div className={cn("px-6 py-4", className)} data-testid="quran-tracker">
      <h3
        className="text-sm uppercase tracking-[0.2em] font-bold mb-4"
        style={{ color: "var(--sage, #A8B5A0)" }}
      >
        Quran Journey
      </h3>

      <div
        className="rounded-2xl bg-white p-5 relative overflow-hidden"
        style={{
          border: "1px solid rgba(168,181,160,0.1)",
          boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
        }}
      >
        {error && (
          <p className="text-[12px] text-red-500 mb-3" data-testid="quran-error">
            {error}
          </p>
        )}

        {/* Top row: icon + page count + daily goal */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(168,181,160,0.1)" }}
            >
              <BookOpen size={20} style={{ color: "var(--sage, #A8B5A0)" }} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Current Page
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl font-bold text-[var(--text-primary)]"
                  data-testid="pages-read"
                >
                  {pagesRead}
                </span>
                <span className="text-sm text-[var(--text-muted)]">/ 604</span>
              </div>
            </div>
          </div>

          <div className="text-end">
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Daily Goal
            </p>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              {pagesRead} / {dailyGoal} pages
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div
            className="h-2 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(168,181,160,0.1)" }}
            data-testid="progress-bar-track"
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "var(--sage, #A8B5A0)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              data-testid="progress-bar-fill"
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
            <span data-testid="monthly-total">
              {monthlyTotal} Pages this month
            </span>
            <motion.button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-full text-white"
              style={{ backgroundColor: "var(--sage, #A8B5A0)" }}
              whileTap={{ scale: 0.92 }}
              onClick={() => logPages(1)}
              aria-label="Add one page"
              data-testid="add-page-button"
            >
              <Plus size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
