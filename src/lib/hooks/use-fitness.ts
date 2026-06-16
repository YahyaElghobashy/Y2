import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { computeWeightTrend } from "@/lib/utils/weight-trend"
import type { WeightLog, WeightTrend, UseFitnessReturn } from "@/lib/types/health.types"

const EMPTY_TREND: WeightTrend = {
  latest: null,
  previous: null,
  deltaSinceLast: null,
  deltaOverRange: null,
  direction: null,
}

const NULL_RETURN: UseFitnessReturn = {
  history: [],
  latest: null,
  trend: EMPTY_TREND,
  isLoading: false,
  error: null,
  logWeight: async () => {},
  deleteWeight: async () => {},
  refresh: async () => {},
}

/** Today's date as a YYYY-MM-DD string (Africa/Cairo local calendar day). */
function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })
}

/**
 * useFitness — owner-only CRUD over public.weight_logs for the current user.
 *
 * Exposes the latest weight, full history (newest first), and a derived trend
 * (delta vs previous entry + delta over the loaded range). One entry per day:
 * logWeight upserts on (user_id, logged_at) so re-logging the same day replaces
 * the value. RLS guarantees a user only ever sees / writes their own rows.
 */
export function useFitness(): UseFitnessReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [history, setHistory] = useState<WeightLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) {
      setHistory([])
      setIsLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })

      if (fetchError) {
        setError("Failed to load weight history")
        return
      }

      setHistory((data ?? []) as WeightLog[])
    } catch {
      setError("Failed to load weight history")
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    await fetchData()
  }, [fetchData])

  const logWeight = useCallback(
    async ({
      weightKg,
      loggedAt,
      note,
    }: {
      weightKg: number
      loggedAt?: string
      note?: string
    }) => {
      if (!user) return
      setError(null)

      // Upsert on the (user_id, logged_at) unique constraint → one entry per day.
      const { error: upsertError } = await supabase
        .from("weight_logs")
        .upsert(
          {
            user_id: user.id,
            weight_kg: weightKg,
            logged_at: loggedAt ?? todayISO(),
            note: note ?? null,
          },
          { onConflict: "user_id,logged_at" },
        )

      if (upsertError) {
        setError("Failed to save weight")
        return
      }

      await refresh()
    },
    [user, supabase, refresh],
  )

  const deleteWeight = useCallback(
    async (id: string) => {
      if (!user) return
      setError(null)

      const { error: deleteError } = await supabase
        .from("weight_logs")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (deleteError) {
        setError("Failed to delete entry")
        return
      }

      await refresh()
    },
    [user, supabase, refresh],
  )

  const trend = useMemo(() => computeWeightTrend(history), [history])

  if (!user) return NULL_RETURN

  return {
    history,
    latest: trend.latest,
    trend,
    isLoading,
    error,
    logWeight,
    deleteWeight,
    refresh,
  }
}
