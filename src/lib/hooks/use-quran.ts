import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { QuranLog } from "@/lib/types/spiritual.types"

type UseQuranReturn = {
  today: QuranLog | null
  logPages: (pages: number) => void
  monthlyTotal: number
  dailyGoal: number
  setDailyGoal: (goal: number) => void
  isLoading: boolean
  error: string | null
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]
}

function getMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

export function useQuran(): UseQuranReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [today, setToday] = useState<QuranLog | null>(null)
  const [monthlyLogs, setMonthlyLogs] = useState<QuranLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch today's row + monthly data on mount
  useEffect(() => {
    if (!user) {
      setToday(null)
      setMonthlyLogs([])
      setIsLoading(false)
      return
    }

    let mounted = true
    const date = getTodayDate()
    const monthStart = getMonthStart()

    async function loadData() {
      // Fetch today
      const { data: todayData, error: todayError } = await supabase
        .from("quran_log")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", date)
        .maybeSingle()

      if (!mounted) return

      if (todayError) {
        setError(todayError.message)
        setIsLoading(false)
        return
      }

      if (!todayData) {
        // Upsert new row
        const { data: newRow, error: upsertError } = await supabase
          .from("quran_log")
          .upsert(
            { user_id: user!.id, date },
            { onConflict: "user_id,date" }
          )
          .select("*")
          .single()

        if (!mounted) return

        if (upsertError) {
          setError(upsertError.message)
        } else {
          setToday(newRow as QuranLog)
        }
      } else {
        setToday(todayData as QuranLog)
      }

      // Fetch monthly logs
      const { data: monthData } = await supabase
        .from("quran_log")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", monthStart)
        .order("date", { ascending: true })

      if (mounted && monthData) {
        setMonthlyLogs(monthData as QuranLog[])
      }

      if (mounted) setIsLoading(false)
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  const logPages = useCallback(
    (pages: number) => {
      if (!user || !today) return
      if (pages < 0) return

      const newPagesRead = today.pages_read + pages

      // Optimistic update
      setToday((prev) => (prev ? { ...prev, pages_read: newPagesRead } : prev))

      const date = getTodayDate()

      supabase
        .from("quran_log")
        .upsert(
          { user_id: user.id, date, pages_read: newPagesRead },
          { onConflict: "user_id,date" }
        )
        .then(({ error: upsertError }) => {
          if (upsertError) {
            // Rollback
            setToday((prev) =>
              prev ? { ...prev, pages_read: today.pages_read } : prev
            )
            setError(upsertError.message)
          }
        })
    },
    [user, today, supabase]
  )

  const setDailyGoal = useCallback(
    (goal: number) => {
      if (!user || !today) return
      if (goal < 1) return

      const prevGoal = today.daily_goal

      // Optimistic update
      setToday((prev) => (prev ? { ...prev, daily_goal: goal } : prev))

      const date = getTodayDate()

      supabase
        .from("quran_log")
        .upsert(
          { user_id: user.id, date, daily_goal: goal },
          { onConflict: "user_id,date" }
        )
        .then(({ error: upsertError }) => {
          if (upsertError) {
            setToday((prev) =>
              prev ? { ...prev, daily_goal: prevGoal } : prev
            )
            setError(upsertError.message)
          }
        })
    },
    [user, today, supabase]
  )

  const monthlyTotal = useMemo(() => {
    return monthlyLogs.reduce((sum, log) => sum + log.pages_read, 0)
  }, [monthlyLogs])

  const dailyGoal = today?.daily_goal ?? 2

  if (!user) {
    return {
      today: null,
      logPages: () => {},
      monthlyTotal: 0,
      dailyGoal: 2,
      setDailyGoal: () => {},
      isLoading: false,
      error: null,
    }
  }

  return {
    today,
    logPages,
    monthlyTotal,
    dailyGoal,
    setDailyGoal,
    isLoading,
    error,
  }
}
