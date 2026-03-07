"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Ritual } from "@/lib/types/rituals.types"

type RitualCardProps = {
  ritual: Ritual
  isLogged: boolean
  partnerLogged: boolean
  onLog: (ritualId: string) => void
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const CADENCE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
}

export function RitualCard({
  ritual,
  isLogged,
  partnerLogged,
  onLog,
  className,
}: RitualCardProps) {
  return (
    <motion.div
      data-testid={`ritual-card-${ritual.id}`}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      onClick={() => !isLogged && onLog(ritual.id)}
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-[var(--bg-elevated)] p-4 transition-colors",
        isLogged
          ? "border-[var(--accent-primary)] bg-[var(--accent-soft)]"
          : "border-[var(--border-subtle)] cursor-pointer active:bg-[var(--bg-secondary)]",
        className
      )}
      role="button"
      aria-label={`${ritual.title} ${isLogged ? "completed" : "tap to complete"}`}
    >
      {/* Icon circle */}
      <div
        data-testid={`ritual-icon-${ritual.id}`}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[20px]",
          isLogged ? "bg-[var(--accent-primary)]" : "bg-[var(--accent-soft)]"
        )}
      >
        {ritual.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          data-testid={`ritual-title-${ritual.id}`}
          className="font-body text-[14px] font-semibold text-[var(--text-primary)] truncate"
        >
          {ritual.title}
        </p>
        <div className="flex items-center gap-2">
          <span
            data-testid={`ritual-cadence-${ritual.id}`}
            className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide"
          >
            {CADENCE_LABELS[ritual.cadence] ?? ritual.cadence}
          </span>
          {ritual.coyyns_reward > 0 && (
            <span
              data-testid={`ritual-reward-${ritual.id}`}
              className="text-[11px] font-medium text-[var(--accent-primary)]"
            >
              +{ritual.coyyns_reward} CoYYns
            </span>
          )}
        </div>
      </div>

      {/* Completion indicator */}
      <div className="flex items-center gap-1">
        {ritual.is_shared ? (
          // Dual circles for shared rituals
          <div data-testid={`ritual-shared-status-${ritual.id}`} className="flex items-center -space-x-1">
            <div
              className={cn(
                "h-5 w-5 rounded-full border-2 border-[var(--bg-elevated)]",
                isLogged ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-secondary)]"
              )}
            />
            <div
              className={cn(
                "h-5 w-5 rounded-full border-2 border-[var(--bg-elevated)]",
                partnerLogged ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-secondary)]"
              )}
            />
          </div>
        ) : (
          // Single circle for personal
          <div
            data-testid={`ritual-status-${ritual.id}`}
            className={cn(
              "h-5 w-5 rounded-full",
              isLogged ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-secondary)]"
            )}
          />
        )}
      </div>
    </motion.div>
  )
}
