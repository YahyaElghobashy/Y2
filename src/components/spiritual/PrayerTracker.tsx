"use client"

import { motion } from "framer-motion"
import { usePrayer } from "@/lib/hooks/use-prayer"
import { PRAYER_NAMES, type PrayerName } from "@/lib/types/spiritual.types"
import { cn } from "@/lib/utils"

const PRAYER_LABELS: Record<PrayerName, { ar: string; en: string }> = {
  fajr: { ar: "فجر", en: "Fajr" },
  dhuhr: { ar: "ظهر", en: "Dhuhr" },
  asr: { ar: "عصر", en: "Asr" },
  maghrib: { ar: "مغرب", en: "Maghrib" },
  isha: { ar: "عشاء", en: "Isha" },
}

type PrayerTrackerProps = {
  className?: string
}

export function PrayerTracker({ className }: PrayerTrackerProps) {
  const { today, togglePrayer, completedCount, isLoading, error } = usePrayer()

  if (isLoading) {
    return (
      <div className={cn("px-6 py-4", className)} data-testid="prayer-tracker-loading">
        <div className="h-4 w-32 rounded bg-[var(--color-bg-secondary,#F5F0E8)] animate-pulse" />
      </div>
    )
  }

  if (error && !today) {
    return (
      <div className={cn("px-6 py-4", className)} data-testid="prayer-tracker-error">
        <h3 className="text-[16px] font-semibold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)] mb-2">
          Daily Prayers
        </h3>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-[var(--color-bg-secondary,#F5F0E8)] p-4">
          <p className="text-[13px] text-[var(--color-text-muted,#B5ADA4)]">
            Could not load prayer data
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-[13px] font-medium text-[var(--color-accent-primary,#C4956A)]"
          >
            Tap to reload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("px-6 py-4", className)} data-testid="prayer-tracker">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]">
          Daily Prayers
        </h3>
        <span
          className="text-[13px] text-[var(--color-text-secondary,#8C8279)]"
          data-testid="prayer-count"
        >
          {completedCount}/5
        </span>
      </div>

      {error && (
        <p className="text-[12px] text-red-500 mb-3" data-testid="prayer-error">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        {PRAYER_NAMES.map((name) => {
          const completed = today?.[name] ?? false
          const labels = PRAYER_LABELS[name]

          return (
            <button
              key={name}
              type="button"
              className="flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              data-testid={`prayer-${name}`}
              data-completed={completed}
              onClick={() => togglePrayer(name)}
              aria-label={`${labels.en} ${completed ? "completed" : "not completed"}`}
              aria-pressed={completed}
            >
              <div className="relative">
                <motion.div
                  className={cn(
                    "w-11 h-11 rounded-full border-2 transition-colors duration-200",
                    completed
                      ? "border-[var(--accent-primary,#C4956A)] bg-[var(--accent-primary,#C4956A)]"
                      : "border-[var(--color-border-subtle,rgba(44,40,37,0.08))] bg-[var(--color-bg-secondary,#F5F0E8)]"
                  )}
                  whileTap={{ scale: 0.92 }}
                  data-testid={`prayer-circle-${name}`}
                />
                {/* Ripple on mark */}
                {completed && (
                  <motion.div
                    className="absolute inset-0 rounded-full border border-[var(--accent-primary,#C4956A)]"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </div>
              <span
                className="text-[12px] font-medium text-[var(--color-text-primary,#2C2825)]"
                data-testid={`prayer-label-ar-${name}`}
              >
                {labels.ar}
              </span>
              <span
                className="text-[10px] text-[var(--color-text-secondary,#8C8279)]"
                data-testid={`prayer-label-en-${name}`}
              >
                {labels.en}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
