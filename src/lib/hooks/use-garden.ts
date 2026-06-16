import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Database } from "@/lib/types/database.types"

type GardenDay = Database["public"]["Tables"]["garden_days"]["Row"]

export type UseGardenReturn = {
  gardenDays: GardenDay[]
  recentFlowers: GardenDay[]
  isLoading: boolean
  error: string | null
  recordOpened: () => Promise<void>
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
  // Atomic: a single ON CONFLICT upsert in record_garden_open() sets this
  // user's column and blooms a flower when both have opened — no read-
  // modify-write, so two concurrent first-opens can never drop an open or
  // race on the flower (see migration 045).
  const recordOpened = useCallback(async () => {
    if (!user) return
    setError(null)

    const { data, error: rpcErr } = await supabase.rpc("record_garden_open", {
      p_user_column: userColumn,
    })

    if (rpcErr) {
      setError(rpcErr.message)
      return
    }

    if (!data) return

    const row = data as unknown as GardenDay
    setGardenDays((prev) => {
      if (prev.some((d) => d.id === row.id)) {
        return prev.map((d) => (d.id === row.id ? row : d))
      }
      return [row, ...prev]
    })
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
