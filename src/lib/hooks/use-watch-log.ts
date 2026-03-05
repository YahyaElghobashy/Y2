import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  WatchItem,
  WatchRating,
  WatchStatus,
  WatchStats,
  WatchItemType,
  AddWatchItemInput,
  TMDBResult,
} from "@/lib/types/watch.types"

type UseWatchLogReturn = {
  watchlist: WatchItem[]
  watching: WatchItem[]
  watched: WatchItem[]
  ratings: WatchRating[]
  isLoading: boolean
  error: string | null
  addItem: (data: AddWatchItemInput) => Promise<void>
  updateStatus: (itemId: string, status: WatchStatus) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  submitRating: (itemId: string, score: number, reaction?: string) => Promise<void>
  myRating: (itemId: string) => WatchRating | null
  partnerRating: (itemId: string) => WatchRating | null
  searchTMDB: (query: string) => Promise<TMDBResult[]>
  stats: WatchStats
}

export function useWatchLog(): UseWatchLogReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [items, setItems] = useState<WatchItem[]>([])
  const [ratings, setRatings] = useState<WatchRating[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch items + ratings on mount ────────────────────────
  useEffect(() => {
    if (!user) {
      setItems([])
      setRatings([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      const { data: itemData, error: itemErr } = await supabase
        .from("watch_items")
        .select("*")
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (itemErr) {
        setError(itemErr.message)
        setIsLoading(false)
        return
      }

      setItems((itemData ?? []) as WatchItem[])

      const { data: ratingData, error: ratingErr } = await supabase
        .from("watch_ratings")
        .select("*")
        .order("submitted_at", { ascending: false })

      if (!mounted) return

      if (ratingErr) {
        setError(ratingErr.message)
        setIsLoading(false)
        return
      }

      setRatings((ratingData ?? []) as WatchRating[])
      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Realtime subscriptions ────────────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("watch_realtime")
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "watch_items" },
        (payload: { eventType: string; new: WatchItem; old: { id: string } }) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => {
              if (prev.some((i) => i.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((i) => (i.id === payload.new.id ? payload.new : i))
            )
          } else if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((i) => i.id !== payload.old.id))
          }
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "watch_ratings" },
        (payload: { eventType: string; new: WatchRating; old: { id: string } }) => {
          if (payload.eventType === "INSERT") {
            setRatings((prev) => {
              if (prev.some((r) => r.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            setRatings((prev) =>
              prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            )
          }
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Derived state ─────────────────────────────────────────
  const watchlist = useMemo(
    () => items.filter((i) => i.status === "watchlist"),
    [items]
  )
  const watching = useMemo(
    () => items.filter((i) => i.status === "watching"),
    [items]
  )
  const watched = useMemo(
    () => items.filter((i) => i.status === "watched"),
    [items]
  )

  // Rating lookup maps
  const myRatingMap = useMemo(() => {
    if (!user) return new Map<string, WatchRating>()
    const map = new Map<string, WatchRating>()
    for (const r of ratings) {
      if (r.user_id === user.id) map.set(r.item_id, r)
    }
    return map
  }, [ratings, user])

  const partnerRatingMap = useMemo(() => {
    if (!partner) return new Map<string, WatchRating>()
    const map = new Map<string, WatchRating>()
    for (const r of ratings) {
      if (r.user_id === partner.id) map.set(r.item_id, r)
    }
    return map
  }, [ratings, partner])

  const myRatingFn = useCallback(
    (itemId: string): WatchRating | null => myRatingMap.get(itemId) ?? null,
    [myRatingMap]
  )

  const partnerRatingFn = useCallback(
    (itemId: string): WatchRating | null => {
      const item = items.find((i) => i.id === itemId)
      if (!item?.both_rated) return null
      return partnerRatingMap.get(itemId) ?? null
    },
    [items, partnerRatingMap]
  )

  // Stats
  const stats: WatchStats = useMemo(() => {
    const watchedItems = items.filter((i) => i.status === "watched")
    const totalWatched = watchedItems.length

    // My avg score
    const myScores = watchedItems
      .map((i) => myRatingMap.get(i.id)?.score)
      .filter((s): s is number => s !== undefined)
    const avgScore = myScores.length > 0
      ? Math.round((myScores.reduce((a, b) => a + b, 0) / myScores.length) * 10) / 10
      : 0

    // By type
    const byType: Record<WatchItemType, number> = {
      movie: 0, series: 0, anime: 0, documentary: 0, short: 0, other: 0,
    }
    for (const item of watchedItems) {
      byType[item.item_type as WatchItemType] = (byType[item.item_type as WatchItemType] || 0) + 1
    }

    // Agree rate: % of both-rated items where |myScore - partnerScore| <= 1
    const bothRatedItems = watchedItems.filter((i) => i.both_rated)
    let agreeCount = 0
    for (const item of bothRatedItems) {
      const my = myRatingMap.get(item.id)
      const partner = partnerRatingMap.get(item.id)
      if (my && partner && Math.abs(my.score - partner.score) <= 1) {
        agreeCount++
      }
    }
    const agreeRate = bothRatedItems.length > 0
      ? Math.round((agreeCount / bothRatedItems.length) * 100)
      : 0

    return { totalWatched, avgScore, byType, agreeRate }
  }, [items, myRatingMap, partnerRatingMap])

  // ── Actions ───────────────────────────────────────────────
  const addItem = useCallback(
    async (data: AddWatchItemInput) => {
      setError(null)
      if (!user) return

      const tempId = crypto.randomUUID()
      const optimistic: WatchItem = {
        id: tempId,
        added_by: user.id,
        title: data.title,
        item_type: data.item_type ?? "movie",
        poster_url: data.poster_url ?? null,
        poster_media_id: null,
        year: data.year ?? null,
        tmdb_id: data.tmdb_id ?? null,
        status: "watchlist",
        watched_date: null,
        both_rated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setItems((prev) => [optimistic, ...prev])

      const { data: inserted, error: insertErr } = await supabase
        .from("watch_items")
        .insert({
          added_by: user.id,
          title: data.title,
          item_type: data.item_type ?? "movie",
          poster_url: data.poster_url ?? null,
          year: data.year ?? null,
          tmdb_id: data.tmdb_id ?? null,
        })
        .select("*")
        .single()

      if (insertErr) {
        setItems((prev) => prev.filter((i) => i.id !== tempId))
        setError(insertErr.message)
        return
      }

      setItems((prev) =>
        prev.map((i) => (i.id === tempId ? (inserted as WatchItem) : i))
      )
    },
    [user, supabase]
  )

  const updateStatus = useCallback(
    async (itemId: string, status: WatchStatus) => {
      setError(null)
      if (!user) return

      const prevItems = [...items]
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status,
                watched_date: status === "watched" ? new Date().toISOString().split("T")[0] : i.watched_date,
              }
            : i
        )
      )

      const updateData: Record<string, unknown> = { status }
      if (status === "watched") {
        updateData.watched_date = new Date().toISOString().split("T")[0]
      }

      const { error: updateErr } = await supabase
        .from("watch_items")
        .update(updateData)
        .eq("id", itemId)

      if (updateErr) {
        setItems(prevItems)
        setError(updateErr.message)
      }
    },
    [user, items, supabase]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      setError(null)
      if (!user) return

      const prevItems = [...items]
      setItems((prev) => prev.filter((i) => i.id !== itemId))

      const { error: deleteErr } = await supabase
        .from("watch_items")
        .delete()
        .eq("id", itemId)

      if (deleteErr) {
        setItems(prevItems)
        setError(deleteErr.message)
      }
    },
    [user, items, supabase]
  )

  const submitRating = useCallback(
    async (itemId: string, score: number, reaction?: string) => {
      setError(null)
      if (!user) return

      if (score < 1 || score > 10) {
        setError("Score must be between 1 and 10")
        return
      }

      const tempId = crypto.randomUUID()
      const optimistic: WatchRating = {
        id: tempId,
        item_id: itemId,
        user_id: user.id,
        score,
        reaction: reaction ?? null,
        submitted_at: new Date().toISOString(),
      }

      setRatings((prev) => [optimistic, ...prev])

      const { data: inserted, error: insertErr } = await supabase
        .from("watch_ratings")
        .upsert(
          {
            item_id: itemId,
            user_id: user.id,
            score,
            reaction: reaction ?? null,
          },
          { onConflict: "item_id,user_id" }
        )
        .select("*")
        .single()

      if (insertErr) {
        setRatings((prev) => prev.filter((r) => r.id !== tempId))
        setError(insertErr.message)
        return
      }

      setRatings((prev) =>
        prev.map((r) => (r.id === tempId ? (inserted as WatchRating) : r))
      )
    },
    [user, supabase]
  )

  const searchTMDB = useCallback(
    async (query: string): Promise<TMDBResult[]> => {
      if (!query.trim()) return []

      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tmdb-search?query=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        )

        if (!res.ok) return []

        const data = await res.json()
        return (data.results ?? []) as TMDBResult[]
      } catch {
        return []
      }
    },
    [supabase]
  )

  // ── Inert return when no user ─────────────────────────────
  if (!user) {
    return {
      watchlist: [],
      watching: [],
      watched: [],
      ratings: [],
      isLoading: false,
      error: null,
      addItem: async () => {},
      updateStatus: async () => {},
      removeItem: async () => {},
      submitRating: async () => {},
      myRating: () => null,
      partnerRating: () => null,
      searchTMDB: async () => [],
      stats: { totalWatched: 0, avgScore: 0, byType: { movie: 0, series: 0, anime: 0, documentary: 0, short: 0, other: 0 }, agreeRate: 0 },
    }
  }

  return {
    watchlist,
    watching,
    watched,
    ratings,
    isLoading,
    error,
    addItem,
    updateStatus,
    removeItem,
    submitRating,
    myRating: myRatingFn,
    partnerRating: partnerRatingFn,
    searchTMDB,
    stats,
  }
}
