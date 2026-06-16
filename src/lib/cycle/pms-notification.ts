import { differenceInDays, addDays, parseISO, startOfDay, format } from "date-fns"
import type { CycleConfig } from "@/lib/types/health.types"

/**
 * A thoughtful, private nudge for the cycle owner (Yahya only) during the
 * PMS or period window. Computed purely from config + a reference date so it
 * is fully unit-testable. Idempotency is enforced by the caller via the
 * window-start key (`windowStart`) against cycle_config.last_pms_notified_date.
 */
export type PmsNotificationPlan = {
  /** YYYY-MM-DD date the current window began — the once-per-window key. */
  windowStart: string
  kind: "pms" | "period"
  title: string
  body: string
  emoji: string
}

type PlanConfig = Pick<
  CycleConfig,
  "pill_start_date" | "active_days" | "break_days" | "pms_warning_days"
>

const PMS_PLAN = {
  kind: "pms" as const,
  emoji: "🌙",
  title: "A gentle heads-up",
  body: "The sensitive few days before Yara's period are likely starting. A little extra patience and warmth goes a long way. 💛",
}

const PERIOD_PLAN = {
  kind: "period" as const,
  emoji: "💛",
  title: "Be extra gentle today",
  body: "Yara's period is likely around now. Check in, be soft, and maybe bring her favourite treat.",
}

/**
 * Decide whether a PMS/period awareness notification is due for `today`.
 * Returns the plan (including the window-start key) when inside a window,
 * or null otherwise. Mirrors the phase math in use-cycle so the two never
 * disagree.
 */
export function planPmsNotification(
  config: PlanConfig,
  today: Date,
): PmsNotificationPlan | null {
  const day = startOfDay(today)
  const pillStart = parseISO(config.pill_start_date)
  const daysSinceStart = differenceInDays(day, pillStart)
  const totalCycleDays = config.active_days + config.break_days

  if (daysSinceStart < 0) return null
  if (totalCycleDays <= 0) return null

  const currentDay = (daysSinceStart % totalCycleDays) + 1
  const isActive = currentDay <= config.active_days

  if (isActive) {
    const daysUntilBreak = config.active_days - currentDay + 1
    // PMS window: the final `pms_warning_days` of the active phase.
    if (config.pms_warning_days > 0 && daysUntilBreak <= config.pms_warning_days) {
      const pmsFirstDay = config.active_days - config.pms_warning_days + 1
      const daysIntoWindow = currentDay - pmsFirstDay
      return {
        windowStart: format(addDays(day, -daysIntoWindow), "yyyy-MM-dd"),
        ...PMS_PLAN,
      }
    }
    return null
  }

  // Break phase → period likely. Window begins on the first break day.
  const daysIntoBreak = currentDay - (config.active_days + 1)
  return {
    windowStart: format(addDays(day, -daysIntoBreak), "yyyy-MM-dd"),
    ...PERIOD_PLAN,
  }
}
