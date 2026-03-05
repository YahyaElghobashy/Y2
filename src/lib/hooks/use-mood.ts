import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { MoodLog } from "@/lib/types/mood.types"
import type { Mood } from "@/lib/types/mood.types"

export type UseMoodReturn = {
  todayMood: MoodLog | null
  partnerMood: MoodLog | null
  isLoading: boolean
  error: string | null
  setMood: (mood: Mood, note?: string) => Promise<void>
}

/**
 * Get today's date in Cairo timezone as YYYY-MM-DD.
 */
function getCairoToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export function useMood(): UseMoodReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [todayMood, setTodayMood] = useState<MoodLog | null>(null)
  const [partnerMood, setPartnerMood] = useState<MoodLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch moods on mount ────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setTodayMood(null)
      setPartnerMood(null)
      setIsLoading(false)
      return
    }

    let mounted = true
    const today = getCairoToday()

    async function load() {
      // Fetch user's mood for today
      const { data: userMoodData, error: userMoodErr } = await supabase
        .from("mood_log")
        .select("*")
        .eq("user_id", user!.id)
        .eq("mood_date", today)
        .maybeSingle()

      if (!mounted) return

      if (userMoodErr) {
        setError(userMoodErr.message)
        setIsLoading(false)
        return
      }

      setTodayMood((userMoodData as MoodLog) ?? null)

      // Fetch partner's mood for today
      if (partner) {
        const { data: partnerMoodData, error: partnerMoodErr } = await supabase
          .from("mood_log")
          .select("*")
          .eq("user_id", partner.id)
          .eq("mood_date", today)
          .maybeSingle()

        if (!mounted) return

        if (partnerMoodErr) {
          setError(partnerMoodErr.message)
          setIsLoading(false)
          return
        }

        setPartnerMood((partnerMoodData as MoodLog) ?? null)
      }

      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, partner, supabase])

  // ── Realtime subscription on mood_log ───────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("mood_log_realtime")
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "mood_log",
        },
        (payload: { new: MoodLog }) => {
          const newMood = payload.new
          const today = getCairoToday()

          if (newMood.mood_date === today) {
            if (partner && newMood.user_id === partner.id) {
              setPartnerMood(newMood)
            }
            if (newMood.user_id === user.id) {
              setTodayMood(newMood)
            }
          }
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "mood_log",
        },
        (payload: { new: MoodLog }) => {
          const updated = payload.new
          const today = getCairoToday()

          if (updated.mood_date === today) {
            if (partner && updated.user_id === partner.id) {
              setPartnerMood(updated)
            }
            if (updated.user_id === user.id) {
              setTodayMood(updated)
            }
          }
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, partner, supabase])

  // ── setMood action ──────────────────────────────────────────
  const setMood = useCallback(
    async (mood: Mood, note?: string) => {
      if (!user) return
      setError(null)

      const today = getCairoToday()

      // Optimistic update
      const previous = todayMood
      const optimistic: MoodLog = {
        id: todayMood?.id ?? crypto.randomUUID(),
        user_id: user.id,
        mood,
        note: note ?? null,
        mood_date: today,
        logged_at: todayMood?.logged_at ?? new Date().toISOString(),
      }
      setTodayMood(optimistic)

      const { data, error: upsertErr } = await supabase
        .from("mood_log")
        .upsert(
          {
            user_id: user.id,
            mood,
            note: note ?? null,
            mood_date: today,
          },
          { onConflict: "user_id,mood_date" }
        )
        .select("*")
        .single()

      if (upsertErr) {
        // Rollback
        setTodayMood(previous)
        setError(upsertErr.message)
        return
      }

      setTodayMood(data as MoodLog)
    },
    [user, todayMood, supabase]
  )

  // ── Inert return when no user ───────────────────────────────
  if (!user) {
    return {
      todayMood: null,
      partnerMood: null,
      isLoading: false,
      error: null,
      setMood: async () => {},
    }
  }

  return {
    todayMood,
    partnerMood,
    isLoading,
    error,
    setMood,
  }
}
