import { useState, useEffect, useCallback, useMemo } from "react"
import { differenceInDays, addDays, parseISO, startOfDay } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { CycleConfig, CycleLog, UseCycleReturn } from "@/lib/types/health.types"

const NULL_RETURN: UseCycleReturn = {
  config: null,
  currentDay: null,
  phase: null,
  daysUntilBreak: null,
  daysUntilActive: null,
  isPMSWindow: false,
  isPeriodLikely: false,
  nextPeriodDate: null,
  cycleLogs: [],
  isLoading: false,
  error: null,
  updateConfig: async () => {},
  addLog: async () => {},
  refreshCycle: async () => {},
}

export function useCycle(): UseCycleReturn {
  const { profile } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [config, setConfig] = useState<CycleConfig | null>(null)
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!profile) {
      setIsLoading(false)
      return
    }

    try {
      const { data: configData, error: configError } = await supabase
        .from("cycle_config")
        .select("*")
        .eq("owner_id", profile.id)
        .single()

      if (configError && configError.code === "PGRST116") {
        // No config row yet — valid state
        setConfig(null)
        setCycleLogs([])
        setIsLoading(false)
        return
      }

      if (configError) {
        setError("Failed to load cycle config")
        setIsLoading(false)
        return
      }

      const typedConfig = configData as CycleConfig

      // Ownership guard
      if (typedConfig.owner_id !== profile.id) {
        setConfig(null)
        setCycleLogs([])
        setIsLoading(false)
        return
      }

      setConfig(typedConfig)

      // Fetch logs for current cycle window
      const today = startOfDay(new Date())
      const pillStart = parseISO(typedConfig.pill_start_date)
      const daysSinceStart = differenceInDays(today, pillStart)
      const totalCycleDays = typedConfig.active_days + typedConfig.break_days

      if (daysSinceStart >= 0 && totalCycleDays > 0) {
        const currentCycleStartDate = addDays(
          pillStart,
          Math.floor(daysSinceStart / totalCycleDays) * totalCycleDays
        )

        const { data: logsData, error: logsError } = await supabase
          .from("cycle_logs")
          .select("*")
          .eq("owner_id", profile.id)
          .gte("date", currentCycleStartDate.toISOString().split("T")[0])
          .order("date", { ascending: false })

        if (logsError) {
          setError("Failed to load cycle logs")
        } else {
          setCycleLogs((logsData ?? []) as CycleLog[])
        }
      } else {
        setCycleLogs([])
      }
    } catch {
      setError("Failed to load cycle data")
    } finally {
      setIsLoading(false)
    }
  }, [profile, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refreshCycle = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    await fetchData()
  }, [fetchData])

  const updateConfig = useCallback(
    async (updates: Partial<CycleConfig>) => {
      if (!profile || !config) return

      setError(null)
      const { error: upsertError } = await supabase
        .from("cycle_config")
        .upsert({ ...config, ...updates, owner_id: profile.id })

      if (upsertError) {
        setError("Failed to update cycle config")
        return
      }

      await refreshCycle()
    },
    [profile, config, supabase, refreshCycle]
  )

  const addLog = useCallback(
    async (log: Omit<CycleLog, "id" | "owner_id" | "created_at">) => {
      if (!profile) return

      setError(null)
      const { error: insertError } = await supabase
        .from("cycle_logs")
        .insert({ ...log, owner_id: profile.id })

      if (insertError) {
        setError("Failed to save cycle log")
        return
      }

      await refreshCycle()
    },
    [profile, supabase, refreshCycle]
  )

  // Derived calculations
  const calculations = useMemo(() => {
    if (!config) {
      return {
        currentDay: null,
        phase: null,
        daysUntilBreak: null,
        daysUntilActive: null,
        isPMSWindow: false,
        isPeriodLikely: false,
        nextPeriodDate: null,
      } as const
    }

    const today = startOfDay(new Date())
    const pillStart = parseISO(config.pill_start_date)
    const daysSinceStart = differenceInDays(today, pillStart)
    const totalCycleDays = config.active_days + config.break_days

    // Guard: future start date
    if (daysSinceStart < 0) {
      return {
        currentDay: null,
        phase: null,
        daysUntilBreak: null,
        daysUntilActive: null,
        isPMSWindow: false,
        isPeriodLikely: false,
        nextPeriodDate: null,
      } as const
    }

    // Guard: zero cycle days
    if (totalCycleDays <= 0) {
      return {
        currentDay: null,
        phase: null,
        daysUntilBreak: null,
        daysUntilActive: null,
        isPMSWindow: false,
        isPeriodLikely: false,
        nextPeriodDate: null,
      } as const
    }

    const currentDay = (daysSinceStart % totalCycleDays) + 1
    const phase = currentDay <= config.active_days ? "active" : "break"
    const daysUntilBreak =
      phase === "active" ? config.active_days - currentDay + 1 : null
    const daysUntilActive =
      phase === "break" ? totalCycleDays - currentDay + 1 : null
    const isPMSWindow =
      phase === "active" && daysUntilBreak !== null && daysUntilBreak <= config.pms_warning_days
    const isPeriodLikely = phase === "break"
    const nextPeriodDate = addDays(pillStart, daysSinceStart + (daysUntilBreak ?? 0))

    return {
      currentDay,
      phase,
      daysUntilBreak,
      daysUntilActive,
      isPMSWindow,
      isPeriodLikely,
      nextPeriodDate,
    } as const
  }, [config])

  // No profile — return null state
  if (!profile) {
    return NULL_RETURN
  }

  return {
    config,
    ...calculations,
    cycleLogs,
    isLoading,
    error,
    updateConfig,
    addLog,
    refreshCycle,
  }
}
