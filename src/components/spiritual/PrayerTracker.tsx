"use client"

import { Check } from "lucide-react"
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
        <div className="h-4 w-32 rounded bg-[var(--bg-soft-cream,#F5EDE3)] animate-skeleton-warm" />
      </div>
    )
  }

  if (error && !today) {
    return (
      <div className={cn("px-6 py-4", className)} data-testid="prayer-tracker-error">
        <h3
          className="text-sm uppercase tracking-[0.2em] font-bold mb-2"
          style={{ color: "var(--sage, #A8B5A0)" }}
        >
          Prayer Tracker
        </h3>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/40 p-4">
          <p className="text-[13px] text-[var(--text-muted)]">
            Could not load prayer data
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

  return (
    <div className={cn("px-6 py-4", className)} data-testid="prayer-tracker">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm uppercase tracking-[0.2em] font-bold"
          style={{ color: "var(--sage, #A8B5A0)" }}
        >
          Prayer Tracker
        </h3>
        <span
          className="text-[10px] text-[var(--text-muted)]"
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

      {/* Tasbih bead row */}
      <div
        className="flex items-center justify-between rounded-2xl p-5 backdrop-blur-sm"
        style={{
          backgroundColor: "rgba(255,255,255,0.4)",
          border: "1px solid rgba(168,181,160,0.08)",
        }}
      >
        {PRAYER_NAMES.map((name) => {
          const completed = today?.[name] ?? false
          const labels = PRAYER_LABELS[name]

          return (
            <button
              key={name}
              type="button"
              className="flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]"
              data-testid={`prayer-${name}`}
              data-completed={completed}
              onClick={() => togglePrayer(name)}
              aria-label={`${labels.en} ${completed ? "completed" : "not completed"}`}
              aria-pressed={completed}
            >
              <div className="relative">
                <motion.div
                  className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors duration-200",
                    completed
                      ? "border-[var(--accent-copper,#B87333)]"
                      : "border-[rgba(168,181,160,0.2)]"
                  )}
                  style={
                    completed
                      ? {
                          backgroundColor: "rgba(184,115,51,0.15)",
                          boxShadow: "0 0 15px rgba(184,115,51,0.2)",
                        }
                      : {
                          backgroundColor: "var(--bg-warm-white, #FFFDF9)",
                          boxShadow:
                            "inset 0 2px 4px rgba(0,0,0,0.05), 0 4px 6px rgba(168,181,160,0.1)",
                        }
                  }
                  whileTap={{ scale: 0.92 }}
                  data-testid={`prayer-circle-${name}`}
                >
                  {completed && (
                    <Check
                      size={16}
                      className="text-[var(--accent-copper,#B87333)]"
                    />
                  )}
                </motion.div>
                {/* Ripple on mark */}
                {completed && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: "1px solid var(--accent-copper, #B87333)" }}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </div>
              <span
                className={cn(
                  "font-[family-name:var(--font-amiri)] text-sm",
                  completed
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)]"
                )}
                data-testid={`prayer-label-ar-${name}`}
              >
                {labels.ar}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
