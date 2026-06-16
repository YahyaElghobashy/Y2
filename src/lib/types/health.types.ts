import type { Database } from "@/lib/types/database.types"

export type CycleConfig = Database["public"]["Tables"]["cycle_config"]["Row"]

export type CycleLog = Database["public"]["Tables"]["cycle_logs"]["Row"]

// ── Fitness / weight tracking ───────────────────────────────

export type WeightLog = Database["public"]["Tables"]["weight_logs"]["Row"]

/**
 * Trend summary derived from sorted weight history.
 * - latest / previous: two most recent entries (or null when missing)
 * - deltaSinceLast: latest.weight_kg − previous.weight_kg (null with < 2 entries)
 * - deltaOverRange: latest.weight_kg − oldest-in-window.weight_kg (null with < 2)
 * - direction: 'down' | 'up' | 'flat' based on deltaOverRange
 */
export type WeightTrend = {
  latest: WeightLog | null
  previous: WeightLog | null
  deltaSinceLast: number | null
  deltaOverRange: number | null
  direction: "down" | "up" | "flat" | null
}

export type UseFitnessReturn = {
  /** Full history, newest first. */
  history: WeightLog[]
  /** Most recent weight entry, or null if none. */
  latest: WeightLog | null
  /** Derived trend over the loaded history. */
  trend: WeightTrend
  isLoading: boolean
  error: string | null
  /** Upsert a weight entry for a date (one per day). */
  logWeight: (input: { weightKg: number; loggedAt?: string; note?: string }) => Promise<void>
  /** Delete a weight entry by id. */
  deleteWeight: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export type CyclePhase = "active" | "break"

export type CycleMood = "good" | "neutral" | "sensitive" | "difficult"

export type UseCycleReturn = {
  config: CycleConfig | null
  currentDay: number | null
  phase: CyclePhase | null
  daysUntilBreak: number | null
  daysUntilActive: number | null
  isPMSWindow: boolean
  isPeriodLikely: boolean
  nextPeriodDate: Date | null
  cycleLogs: CycleLog[]
  isLoading: boolean
  error: string | null
  updateConfig: (config: Partial<CycleConfig>) => Promise<void>
  addLog: (log: Omit<CycleLog, "id" | "owner_id" | "created_at">) => Promise<void>
  refreshCycle: () => Promise<void>
}
