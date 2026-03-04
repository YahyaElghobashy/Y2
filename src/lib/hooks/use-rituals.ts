import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Ritual, RitualLog, Cadence } from "@/lib/types/rituals.types"

type UseRitualsReturn = {
  rituals: Ritual[]
  todayRituals: Ritual[]
  logs: RitualLog[]
  isLoading: boolean
  error: string | null
  logRitual: (ritualId: string, note?: string, photoUrl?: string) => Promise<void>
  isLoggedThisPeriod: (ritualId: string) => boolean
  partnerLoggedThisPeriod: (ritualId: string) => boolean
  createRitual: (data: {
    title: string
    description?: string
    icon?: string
    cadence: Cadence
    is_shared?: boolean
    coyyns_reward?: number
  }) => Promise<string | null>
  deleteRitual: (ritualId: string) => Promise<void>
  uploadRitualPhoto: (file: File) => Promise<string | null>
}

/**
 * Compute period key based on cadence.
 * daily:2026-03-04, weekly:2026-W10, monthly:2026-03
 */
export function getPeriodKey(cadence: Cadence, date: Date = new Date()): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")

  switch (cadence) {
    case "daily":
      return `daily:${yyyy}-${mm}-${dd}`
    case "weekly": {
      // ISO week number
      const jan4 = new Date(yyyy, 0, 4)
      const dayOfYear = Math.floor(
        (date.getTime() - new Date(yyyy, 0, 1).getTime()) / 86400000
      ) + 1
      const weekDay = date.getDay() || 7 // Mon=1, Sun=7
      const jan4Day = jan4.getDay() || 7
      const weekNum = Math.floor((dayOfYear - weekDay + jan4Day + 6) / 7)
      return `weekly:${yyyy}-W${String(weekNum).padStart(2, "0")}`
    }
    case "monthly":
      return `monthly:${yyyy}-${mm}`
    default:
      return `daily:${yyyy}-${mm}-${dd}`
  }
}

export function useRituals(): UseRitualsReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [rituals, setRituals] = useState<Ritual[]>([])
  const [logs, setLogs] = useState<RitualLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch rituals + logs on mount ───────────────────────────
  useEffect(() => {
    if (!user) {
      setRituals([])
      setLogs([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      // Fetch rituals (own + partner's shared via RLS)
      const { data: ritualData, error: ritualErr } = await supabase
        .from("rituals")
        .select("*")
        .order("created_at", { ascending: true })

      if (!mounted) return

      if (ritualErr) {
        setError(ritualErr.message)
        setIsLoading(false)
        return
      }

      const fetchedRituals = (ritualData ?? []) as Ritual[]
      setRituals(fetchedRituals)

      // Fetch today's logs for all rituals (own + partner shared via RLS)
      const { data: logData, error: logErr } = await supabase
        .from("ritual_logs")
        .select("*")
        .order("logged_at", { ascending: false })

      if (!mounted) return

      if (logErr) {
        setError(logErr.message)
        setIsLoading(false)
        return
      }

      setLogs((logData ?? []) as RitualLog[])
      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Realtime subscription on ritual_logs ────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("ritual_logs_realtime")
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "ritual_logs",
        },
        (payload: { new: RitualLog }) => {
          setLogs((prev) => {
            if (prev.some((l) => l.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Derived state ───────────────────────────────────────────
  const todayRituals = useMemo(() => {
    // All rituals show today regardless of cadence
    return rituals
  }, [rituals])

  // Build period key lookup maps for current user and partner
  const ownLogMap = useMemo(() => {
    if (!user) return new Map<string, RitualLog>()
    const map = new Map<string, RitualLog>()
    for (const log of logs) {
      if (log.user_id === user.id) {
        const key = `${log.ritual_id}:${log.period_key}`
        map.set(key, log)
      }
    }
    return map
  }, [logs, user])

  const partnerLogMap = useMemo(() => {
    if (!partner) return new Map<string, RitualLog>()
    const map = new Map<string, RitualLog>()
    for (const log of logs) {
      if (log.user_id === partner.id) {
        const key = `${log.ritual_id}:${log.period_key}`
        map.set(key, log)
      }
    }
    return map
  }, [logs, partner])

  const isLoggedThisPeriod = useCallback(
    (ritualId: string): boolean => {
      const ritual = rituals.find((r) => r.id === ritualId)
      if (!ritual) return false
      const periodKey = getPeriodKey(ritual.cadence as Cadence)
      return ownLogMap.has(`${ritualId}:${periodKey}`)
    },
    [rituals, ownLogMap]
  )

  const partnerLoggedThisPeriod = useCallback(
    (ritualId: string): boolean => {
      const ritual = rituals.find((r) => r.id === ritualId)
      if (!ritual) return false
      const periodKey = getPeriodKey(ritual.cadence as Cadence)
      return partnerLogMap.has(`${ritualId}:${periodKey}`)
    },
    [rituals, partnerLogMap]
  )

  // ── Actions ─────────────────────────────────────────────────
  const logRitual = useCallback(
    async (ritualId: string, note?: string, photoUrl?: string) => {
      setError(null)
      if (!user) return

      const ritual = rituals.find((r) => r.id === ritualId)
      if (!ritual) return

      const periodKey = getPeriodKey(ritual.cadence as Cadence)

      // Optimistic insert
      const tempId = crypto.randomUUID()
      const optimistic: RitualLog = {
        id: tempId,
        ritual_id: ritualId,
        user_id: user.id,
        period_key: periodKey,
        note: note ?? null,
        photo_url: photoUrl ?? null,
        logged_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      setLogs((prev) => [optimistic, ...prev])

      const { data, error: insertErr } = await supabase
        .from("ritual_logs")
        .insert({
          ritual_id: ritualId,
          user_id: user.id,
          period_key: periodKey,
          note: note ?? null,
          photo_url: photoUrl ?? null,
        })
        .select("*")
        .single()

      if (insertErr) {
        setLogs((prev) => prev.filter((l) => l.id !== tempId))
        setError(insertErr.message)
        return
      }

      // Replace temp with real
      setLogs((prev) =>
        prev.map((l) => (l.id === tempId ? (data as RitualLog) : l))
      )

      // Award CoYYns if ritual has reward
      if (ritual.coyyns_reward > 0) {
        await supabase.from("coyyns_transactions").insert({
          user_id: user.id,
          amount: ritual.coyyns_reward,
          type: "earn",
          category: "ritual_completion",
          description: `Completed: ${ritual.title}`,
        })
      }
    },
    [user, rituals, supabase]
  )

  const createRitual = useCallback(
    async (data: {
      title: string
      description?: string
      icon?: string
      cadence: Cadence
      is_shared?: boolean
      coyyns_reward?: number
    }): Promise<string | null> => {
      setError(null)
      if (!user) return null

      const { data: inserted, error: insertErr } = await supabase
        .from("rituals")
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description ?? null,
          icon: data.icon ?? "✨",
          cadence: data.cadence,
          is_shared: data.is_shared ?? false,
          coyyns_reward: data.coyyns_reward ?? 0,
        })
        .select("*")
        .single()

      if (insertErr || !inserted) {
        setError(insertErr?.message ?? "Failed to create ritual")
        return null
      }

      const newRitual = inserted as Ritual
      setRituals((prev) => [...prev, newRitual])
      return newRitual.id
    },
    [user, supabase]
  )

  const deleteRitual = useCallback(
    async (ritualId: string) => {
      setError(null)
      if (!user) return

      const prevRituals = [...rituals]
      setRituals((prev) => prev.filter((r) => r.id !== ritualId))

      const { error: deleteErr } = await supabase
        .from("rituals")
        .delete()
        .eq("id", ritualId)

      if (deleteErr) {
        setRituals(prevRituals)
        setError(deleteErr.message)
      }
    },
    [user, rituals, supabase]
  )

  const uploadRitualPhoto = useCallback(
    async (file: File): Promise<string | null> => {
      if (!user) return null

      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from("ritual-images")
        .upload(path, file)

      if (uploadErr) {
        setError(uploadErr.message)
        return null
      }

      const { data: urlData } = supabase.storage
        .from("ritual-images")
        .getPublicUrl(path)

      return urlData.publicUrl
    },
    [user, supabase]
  )

  // ── Inert return when no user ───────────────────────────────
  if (!user) {
    return {
      rituals: [],
      todayRituals: [],
      logs: [],
      isLoading: false,
      error: null,
      logRitual: async () => {},
      isLoggedThisPeriod: () => false,
      partnerLoggedThisPeriod: () => false,
      createRitual: async () => null,
      deleteRitual: async () => {},
      uploadRitualPhoto: async () => null,
    }
  }

  return {
    rituals,
    todayRituals,
    logs,
    isLoading,
    error,
    logRitual,
    isLoggedThisPeriod,
    partnerLoggedThisPeriod,
    createRitual,
    deleteRitual,
    uploadRitualPhoto,
  }
}
