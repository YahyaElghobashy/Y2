import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Database } from "@/lib/types/database.types"

type GardenDay = Database["public"]["Tables"]["garden_days"]["Row"]
type GardenDayInsert = Database["public"]["Tables"]["garden_days"]["Insert"]
type GardenDayUpdate = Database["public"]["Tables"]["garden_days"]["Update"]

const FLOWER_EMOJIS = [
  "🌸", "🌻", "🌹", "🌺", "🌷", "🌼", "💐", "🌿", "🍀", "🌵", "🪻", "🪷",
] as const

export type UseGardenReturn = {
  gardenDays: GardenDay[]
  recentFlowers: GardenDay[]
  isLoading: boolean
  error: string | null
  recordOpened: () => Promise<void>
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

export function useGarden(): UseGardenReturn {
  const { user, profile } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [gardenDays, setGardenDays] = useState<GardenDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Determine which column to set based on user's display_name
  const userColumn: "yahya_opened" | "yara_opened" =
    profile?.display_name?.toLowerCase().includes("yara")
      ? "yara_opened"
      : "yahya_opened"

  // ── Fetch garden days on mount ──────────────────────────────
  useEffect(() => {
    if (!user) {
      setGardenDays([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      const { data, error: fetchErr } = await supabase
        .from("garden_days")
        .select("*")
        .order("garden_date", { ascending: false })
        .limit(90) // last ~3 months

      if (!mounted) return

      if (fetchErr) {
        setError(fetchErr.message)
        setIsLoading(false)
        return
      }

      setGardenDays((data ?? []) as GardenDay[])
      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Realtime subscription ──────────────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("garden_days_realtime")
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "garden_days",
        },
        (payload: { new: GardenDay }) => {
          setGardenDays((prev) => {
            if (prev.some((d) => d.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "garden_days",
        },
        (payload: { new: GardenDay }) => {
          setGardenDays((prev) =>
            prev.map((d) => (d.id === payload.new.id ? payload.new : d))
          )
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Record that the current user opened the app today ──────
  const recordOpened = useCallback(async () => {
    if (!user) return
    setError(null)

    const today = getCairoToday()

    // Check if today's row exists
    const { data: existing, error: fetchErr } = await supabase
      .from("garden_days")
      .select("*")
      .eq("garden_date", today)
      .maybeSingle()

    if (fetchErr) {
      setError(fetchErr.message)
      return
    }

    if (existing) {
      const row = existing as GardenDay
      // Already recorded for this user?
      if (row[userColumn]) return

      // Set this user's column to true
      const updateData: GardenDayUpdate = { [userColumn]: true } as GardenDayUpdate

      // If both users opened and no flower yet, pick a random flower
      const otherColumn =
        userColumn === "yahya_opened" ? "yara_opened" : "yahya_opened"
      if (row[otherColumn] && !row.flower_type) {
        updateData.flower_type =
          FLOWER_EMOJIS[Math.floor(Math.random() * FLOWER_EMOJIS.length)]
      }

      let query = supabase
        .from("garden_days")
        .update(updateData)
        .eq("id", row.id)

      // Race-safe: only update if flower_type hasn't been set by someone else
      if (row.flower_type === null) {
        query = query.is("flower_type", null)
      } else {
        query = query.eq("flower_type", row.flower_type)
      }

      const { data: updated, error: updateErr } = await query
        .select("*")
        .single()

      if (updateErr) {
        // Race condition: try without flower_type guard
        const { data: retryData, error: retryErr } = await supabase
          .from("garden_days")
          .update({ [userColumn]: true })
          .eq("id", row.id)
          .select("*")
          .single()

        if (retryErr) {
          setError(retryErr.message)
          return
        }
        if (retryData) {
          setGardenDays((prev) =>
            prev.map((d) =>
              d.id === row.id ? (retryData as GardenDay) : d
            )
          )
        }
        return
      }

      if (updated) {
        setGardenDays((prev) =>
          prev.map((d) =>
            d.id === row.id ? (updated as GardenDay) : d
          )
        )
      }
    } else {
      // Insert new row for today
      const insertData: GardenDayInsert = {
        garden_date: today,
        [userColumn]: true,
      } as GardenDayInsert

      const { data: inserted, error: insertErr } = await supabase
        .from("garden_days")
        .insert(insertData)
        .select("*")
        .single()

      if (insertErr) {
        setError(insertErr.message)
        return
      }

      if (inserted) {
        setGardenDays((prev) => [inserted as GardenDay, ...prev])
      }
    }
  }, [user, userColumn, supabase])

  // ── Derived: recent flowers ─────────────────────────────────
  const recentFlowers = gardenDays
    .filter((d) => d.flower_type !== null)
    .slice(0, 8)

  // ── Inert return when no user ───────────────────────────────
  if (!user) {
    return {
      gardenDays: [],
      recentFlowers: [],
      isLoading: false,
      error: null,
      recordOpened: async () => {},
    }
  }

  return {
    gardenDays,
    recentFlowers,
    isLoading,
    error,
    recordOpened,
  }
}
