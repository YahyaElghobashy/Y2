import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { differenceInDays, addDays, parseISO, startOfDay } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { planPmsNotification } from "@/lib/cycle/pms-notification"
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
    if (!profile || profile.role !== "admin") {
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

  // ── PMS / period awareness notification — OWNER (Yahya) ONLY ──
  // When today falls in a PMS or period window and we have not yet notified
  // for THIS window, atomically claim the window with a single conditional
  // UPDATE (safe across tabs/devices), then self-notify and deliver via the
  // existing send-notification push pipeline. Yara never reaches this: the
  // effect gates on the admin role and she owns no cycle_config row, so the
  // claim matches zero rows even if the gate were bypassed.
  const notifyAttemptRef = useRef<string | null>(null)
  useEffect(() => {
    if (!profile || profile.role !== "admin" || !config) return

    const plan = planPmsNotification(config, new Date())
    if (!plan) return
    if (config.last_pms_notified_date === plan.windowStart) return
    if (notifyAttemptRef.current === plan.windowStart) return
    notifyAttemptRef.current = plan.windowStart

    const ownerId = profile.id
    let cancelled = false

    async function notify() {
      // Atomic claim — only one caller wins this window across all sessions.
      const { data: claimed } = await supabase
        .from("cycle_config")
        .update({ last_pms_notified_date: plan!.windowStart })
        .eq("owner_id", ownerId)
        .or(
          `last_pms_notified_date.is.null,last_pms_notified_date.neq.${plan!.windowStart}`
        )
        .select("id")
        .maybeSingle()

      if (cancelled || !claimed) return

      const { data: notif } = await supabase
        .from("notifications")
        .insert({
          sender_id: ownerId,
          recipient_id: ownerId,
          title: plan!.title,
          body: plan!.body,
          emoji: plan!.emoji,
          type: "cycle_reminder",
          metadata: { kind: plan!.kind, window_start: plan!.windowStart },
        })
        .select("id")
        .single()

      if (cancelled || !notif) return

      await supabase.functions.invoke("send-notification", {
        body: {
          notification_id: (notif as { id: string }).id,
          recipient_id: ownerId,
        },
      })

      if (!cancelled) {
        setConfig((prev) =>
          prev ? { ...prev, last_pms_notified_date: plan!.windowStart } : prev
        )
      }
    }

    notify()

    return () => {
      cancelled = true
    }
  }, [profile, config, supabase])

  const refreshCycle = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    await fetchData()
  }, [fetchData])

  const updateConfig = useCallback(
    async (updates: Partial<CycleConfig>) => {
      // First-run setup has no config row yet — only `profile` is required.
      // Gating on `!config` here made initial setup silently no-op.
      if (!profile) return

      setError(null)
      // Spread (config ?? {}) so a null config still produces a valid insert.
      // Explicit onConflict keeps the upsert keyed on the owner_id UNIQUE.
      const { error: upsertError } = await supabase
        .from("cycle_config")
        .upsert(
          { ...(config ?? {}), ...updates, owner_id: profile.id },
          { onConflict: "owner_id" }
        )

      if (upsertError) {
        setError("Failed to update cycle config")
        // Throw so callers can distinguish failure from success and never show
        // a false-success toast on a swallowed save error.
        throw new Error(upsertError.message)
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
        throw new Error(insertError.message)
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

  // No profile or non-admin — return null state (cycle tracking is admin-only)
  if (!profile || profile.role !== "admin") {
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
