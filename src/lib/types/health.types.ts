import type { Database } from "@/lib/types/database.types"

export type CycleConfig = Database["public"]["Tables"]["cycle_config"]["Row"]

export type CycleLog = Database["public"]["Tables"]["cycle_logs"]["Row"]

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
