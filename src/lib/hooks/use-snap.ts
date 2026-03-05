import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Snap, SnapSchedule, ReactionEmoji } from "@/lib/types/snap.types"
import { SNAP_WINDOW_SECONDS } from "@/lib/types/snap.types"

type UseSnapReturn = {
  todaySnap: Snap | null
  partnerTodaySnap: Snap | null
  snapFeed: Snap[]
  isLoading: boolean
  error: string | null
  isWindowOpen: boolean
  windowTimeRemaining: number | null
  submitSnap: (photoUrl: string, caption?: string) => Promise<void>
  reactToSnap: (snapId: string, emoji: ReactionEmoji | null) => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

const FEED_PAGE_SIZE = 14 // days

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

/**
 * Get current time in Cairo as total seconds since midnight.
 */
function getCairoNowSeconds(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .split(":")
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
}

/**
 * Parse a time string (HH:MM:SS) to total seconds since midnight.
 */
function parseTimeToSeconds(time: string): number {
  const parts = time.split(":")
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2] ?? "0")
}

export function useSnap(): UseSnapReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [todaySnap, setTodaySnap] = useState<Snap | null>(null)
  const [partnerTodaySnap, setPartnerTodaySnap] = useState<Snap | null>(null)
  const [snapFeed, setSnapFeed] = useState<Snap[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<SnapSchedule | null>(null)
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const [windowTimeRemaining, setWindowTimeRemaining] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const oldestDateRef = useRef<string | null>(null)

  // ── Fetch today's data on mount ─────────────────────────────
  useEffect(() => {
    if (!user) {
      setTodaySnap(null)
      setPartnerTodaySnap(null)
      setSnapFeed([])
      setIsLoading(false)
      setSchedule(null)
      return
    }

    let mounted = true

    async function load() {
      const today = getCairoToday()

      // Fetch today's snap for user
      const { data: userSnaps, error: userErr } = await supabase
        .from("snaps")
        .select("*")
        .eq("user_id", user!.id)
        .eq("snap_date", today)

      if (!mounted) return

      if (userErr) {
        setError(userErr.message)
        setIsLoading(false)
        return
      }

      const userSnap = userSnaps && userSnaps.length > 0 ? (userSnaps[0] as Snap) : null
      setTodaySnap(userSnap)

      // Fetch partner's today snap
      if (partner) {
        const { data: partnerSnaps, error: partnerErr } = await supabase
          .from("snaps")
          .select("*")
          .eq("user_id", partner.id)
          .eq("snap_date", today)

        if (!mounted) return

        if (!partnerErr && partnerSnaps && partnerSnaps.length > 0) {
          setPartnerTodaySnap(partnerSnaps[0] as Snap)
        }
      }

      // Fetch today's schedule
      const { data: scheduleData } = await supabase
        .from("snap_schedule")
        .select("*")
        .eq("schedule_date", today)
        .maybeSingle()

      if (!mounted) return

      if (scheduleData) {
        setSchedule(scheduleData as SnapSchedule)
      }

      // Fetch snap feed (last 14 days)
      const { data: feedData, error: feedErr } = await supabase
        .from("snaps")
        .select("*")
        .order("snap_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(FEED_PAGE_SIZE * 2) // 2 users per day

      if (!mounted) return

      if (feedErr) {
        setError(feedErr.message)
      } else {
        const feed = (feedData ?? []) as Snap[]
        setSnapFeed(feed)
        if (feed.length > 0) {
          oldestDateRef.current = feed[feed.length - 1].snap_date
        }
        setHasMore(feed.length >= FEED_PAGE_SIZE * 2)
      }

      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, partner, supabase])

  // ── Window timer ────────────────────────────────────────────
  useEffect(() => {
    if (!schedule) {
      setIsWindowOpen(false)
      setWindowTimeRemaining(null)
      return
    }

    function tick() {
      const triggerSeconds = parseTimeToSeconds(schedule!.trigger_time)
      const nowSeconds = getCairoNowSeconds()
      const elapsed = nowSeconds - triggerSeconds

      if (elapsed >= 0 && elapsed <= SNAP_WINDOW_SECONDS && (!todaySnap || !todaySnap.photo_url)) {
        setIsWindowOpen(true)
        setWindowTimeRemaining(Math.max(0, SNAP_WINDOW_SECONDS - elapsed))
      } else {
        setIsWindowOpen(false)
        setWindowTimeRemaining(elapsed >= 0 && elapsed <= SNAP_WINDOW_SECONDS ? Math.max(0, SNAP_WINDOW_SECONDS - elapsed) : null)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)

    return () => clearInterval(interval)
  }, [schedule, todaySnap])

  // ── Realtime subscription ───────────────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("snaps_realtime")
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "snaps",
        },
        (payload: { new: Snap }) => {
          const newSnap = payload.new
          const today = getCairoToday()

          // Update snap feed
          setSnapFeed((prev) => {
            if (prev.some((s) => s.id === newSnap.id)) return prev
            return [newSnap, ...prev]
          })

          // Check if it's today's snap
          if (newSnap.snap_date === today) {
            if (newSnap.user_id === user.id) {
              setTodaySnap(newSnap)
            } else if (partner && newSnap.user_id === partner.id) {
              setPartnerTodaySnap(newSnap)
            }
          }
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "snaps",
        },
        (payload: { new: Snap }) => {
          const updated = payload.new
          const today = getCairoToday()

          setSnapFeed((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          )

          if (updated.snap_date === today) {
            if (updated.user_id === user.id) {
              setTodaySnap(updated)
            } else if (partner && updated.user_id === partner.id) {
              setPartnerTodaySnap(updated)
            }
          }
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, partner, supabase])

  // ── Actions ─────────────────────────────────────────────────
  const submitSnap = useCallback(
    async (photoUrl: string, caption?: string) => {
      setError(null)
      if (!user) return

      if (todaySnap) {
        // Update existing placeholder
        const optimistic = { ...todaySnap, photo_url: photoUrl, caption: caption ?? todaySnap.caption }
        setTodaySnap(optimistic)

        const { error: updateErr } = await supabase
          .from("snaps")
          .update({ photo_url: photoUrl, caption: caption ?? null })
          .eq("id", todaySnap.id)

        if (updateErr) {
          setTodaySnap(todaySnap) // rollback
          setError(updateErr.message)
        }
      } else {
        // Insert new snap
        const today = getCairoToday()
        const tempId = crypto.randomUUID()
        const optimistic: Snap = {
          id: tempId,
          user_id: user.id,
          snap_date: today,
          photo_url: photoUrl,
          caption: caption ?? null,
          reaction_emoji: null,
          window_opened_at: null,
          created_at: new Date().toISOString(),
        }
        setTodaySnap(optimistic)

        const { data, error: insertErr } = await supabase
          .from("snaps")
          .insert({
            user_id: user.id,
            snap_date: today,
            photo_url: photoUrl,
            caption: caption ?? null,
          })
          .select("*")
          .single()

        if (insertErr) {
          setTodaySnap(null) // rollback
          setError(insertErr.message)
        } else if (data) {
          setTodaySnap(data as Snap)
        }
      }
    },
    [user, todaySnap, supabase]
  )

  const reactToSnap = useCallback(
    async (snapId: string, emoji: ReactionEmoji | null) => {
      setError(null)

      // Optimistic update in feed
      setSnapFeed((prev) =>
        prev.map((s) => (s.id === snapId ? { ...s, reaction_emoji: emoji } : s))
      )

      // Also update partner snap if it matches
      if (partnerTodaySnap && partnerTodaySnap.id === snapId) {
        setPartnerTodaySnap({ ...partnerTodaySnap, reaction_emoji: emoji })
      }

      const { error: updateErr } = await supabase
        .from("snaps")
        .update({ reaction_emoji: emoji })
        .eq("id", snapId)

      if (updateErr) {
        setError(updateErr.message)
      }
    },
    [partnerTodaySnap, supabase]
  )

  const loadMore = useCallback(async () => {
    if (!user || !hasMore || !oldestDateRef.current) return

    const { data, error: fetchErr } = await supabase
      .from("snaps")
      .select("*")
      .lt("snap_date", oldestDateRef.current)
      .order("snap_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(FEED_PAGE_SIZE * 2)

    if (fetchErr) {
      setError(fetchErr.message)
      return
    }

    const newSnaps = (data ?? []) as Snap[]
    if (newSnaps.length > 0) {
      oldestDateRef.current = newSnaps[newSnaps.length - 1].snap_date
      setSnapFeed((prev) => [...prev, ...newSnaps])
    }
    setHasMore(newSnaps.length >= FEED_PAGE_SIZE * 2)
  }, [user, hasMore, supabase])

  // ── Inert return when no user ───────────────────────────────
  if (!user) {
    return {
      todaySnap: null,
      partnerTodaySnap: null,
      snapFeed: [],
      isLoading: false,
      error: null,
      isWindowOpen: false,
      windowTimeRemaining: null,
      submitSnap: async () => {},
      reactToSnap: async () => {},
      loadMore: async () => {},
      hasMore: false,
    }
  }

  return {
    todaySnap,
    partnerTodaySnap,
    snapFeed,
    isLoading,
    error,
    isWindowOpen,
    windowTimeRemaining,
    submitSnap,
    reactToSnap,
    loadMore,
    hasMore,
  }
}
