"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCycle } from "@/lib/hooks/use-cycle"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

function getPhaseColor(phase: "active" | "break", isPMSWindow: boolean): string {
  if (isPMSWindow) return "var(--warning)"
  if (phase === "break") return "var(--error)"
  return "var(--accent-primary)"
}

function getPhaseLabel(phase: "active" | "break", isPMSWindow: boolean): string {
  if (isPMSWindow) return "PMS Window"
  if (phase === "break") return "Break"
  return "Active"
}

export function CycleDayWidget({ className }: { className?: string }) {
  const {
    config,
    currentDay,
    phase,
    daysUntilBreak,
    daysUntilActive,
    isPMSWindow,
    isLoading,
  } = useCycle()

  // Yahya-only guard: if no config and done loading, don't render
  if (!config && !isLoading) return null
  if (isLoading) return null
  if (!currentDay || !phase || !config) return null

  const totalDays = config.active_days + config.break_days
  const phaseColor = getPhaseColor(phase, isPMSWindow)
  const phaseLabel = getPhaseLabel(phase, isPMSWindow)
  const remaining = phase === "active" ? daysUntilBreak : daysUntilActive

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className={cn(
        "rounded-[var(--radius-card)] border border-border-subtle bg-bg-elevated p-5",
        className
      )}
      data-testid="cycle-day-widget"
    >
      {/* Day + phase */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[32px] font-bold font-[var(--font-display)] leading-none"
            style={{ color: phaseColor }}
            data-testid="cycle-day-number"
          >
            Day {currentDay}
          </span>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[12px] font-medium font-[var(--font-body)]"
          style={{
            backgroundColor: `color-mix(in srgb, ${phaseColor} 12%, transparent)`,
            color: phaseColor,
          }}
          data-testid="cycle-phase-label"
        >
          {phaseLabel}
        </span>
      </div>

      {/* Progress dots */}
      <div className="mt-4 flex flex-wrap gap-1" data-testid="cycle-progress-dots">
        {Array.from({ length: totalDays }, (_, i) => {
          const dayNum = i + 1
          const isCurrent = dayNum === currentDay
          const isPast = dayNum < currentDay

          return (
            <span
              key={dayNum}
              className={cn(
                "inline-block h-2 w-2 rounded-full transition-colors",
                isCurrent && "ring-2 ring-offset-1",
                isPast ? "opacity-100" : !isCurrent ? "opacity-25" : ""
              )}
              style={{
                backgroundColor: isPast || isCurrent ? phaseColor : "var(--text-muted)",
                ...(isCurrent ? { ringColor: phaseColor } : {}),
              }}
            />
          )
        })}
      </div>

      {/* Remaining count */}
      {remaining !== null && (
        <p className="mt-3 text-[13px] font-[var(--font-body)] text-text-secondary" data-testid="cycle-remaining">
          {remaining} day{remaining !== 1 ? "s" : ""} until{" "}
          {phase === "active" ? "break" : "active phase"}
        </p>
      )}
    </motion.div>
  )
}
