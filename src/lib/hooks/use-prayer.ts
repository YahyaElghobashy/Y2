import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { PrayerLog } from "@/lib/types/spiritual.types"
import { PRAYER_NAMES, type PrayerName } from "@/lib/types/spiritual.types"

type UsePrayerReturn = {
  today: PrayerLog | null
  togglePrayer: (name: PrayerName) => void
  completedCount: number
  isLoading: boolean
  error: string | null
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]
}

export function usePrayer(): UsePrayerReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [today, setToday] = useState<PrayerLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch today's row on mount
  useEffect(() => {
    if (!user) {
      setToday(null)
      setIsLoading(false)
      return
    }

    let mounted = true
    const date = getTodayDate()

    async function loadToday() {
      const { data, error: fetchError } = await supabase
        .from("prayer_log")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", date)
        .maybeSingle()

      if (!mounted) return

      if (fetchError) {
        setError(fetchError.message)
        setIsLoading(false)
        return
      }

      if (!data) {
        // No row yet — upsert a new one
        const { data: newRow, error: upsertError } = await supabase
          .from("prayer_log")
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
          setToday(newRow as PrayerLog)
        }
      } else {
        setToday(data as PrayerLog)
      }

      setIsLoading(false)
    }

    loadToday()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  const togglePrayer = useCallback(
    (name: PrayerName) => {
      if (!user || !today) return

      const currentValue = today[name]
      const newValue = !currentValue

      // Optimistic update
      setToday((prev) => (prev ? { ...prev, [name]: newValue } : prev))

      const date = getTodayDate()

      // Upsert to database
      supabase
        .from("prayer_log")
        .upsert(
          { user_id: user.id, date, [name]: newValue },
          { onConflict: "user_id,date" }
        )
        .then(({ error: upsertError }) => {
          if (upsertError) {
            // Rollback
            setToday((prev) =>
              prev ? { ...prev, [name]: currentValue } : prev
            )
            setError(upsertError.message)
          }
        })
    },
    [user, today, supabase]
  )

  const completedCount = useMemo(() => {
    if (!today) return 0
    return PRAYER_NAMES.filter((name) => today[name]).length
  }, [today])

  if (!user) {
    return {
      today: null,
      togglePrayer: () => {},
      completedCount: 0,
      isLoading: false,
      error: null,
    }
  }

  return {
    today,
    togglePrayer,
    completedCount,
    isLoading,
    error,
  }
}
