import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  FoodVisit,
  FoodVisitInsert,
  FoodRating,
  FoodRatingInsert,
  FoodPhoto,
  FoodPhotoInsert,
  FoodStats,
  CuisineType,
  PreferenceDotColor,
  RatingDimensionKey,
  VisitWithRatings,
} from "@/lib/types/food-journal.types"

type UseFoodJournalReturn = {
  visits: FoodVisit[]
  isLoading: boolean
  error: string | null
  // CRUD
  addVisit: (data: Omit<FoodVisitInsert, "user_id">) => Promise<string | null>
  updateVisit: (visitId: string, updates: Partial<FoodVisit>) => Promise<void>
  toggleBookmark: (visitId: string) => Promise<void>
  // Ratings
  addRating: (data: Omit<FoodRatingInsert, "user_id">) => Promise<void>
  getMyRating: (visitId: string) => FoodRating | null
  getPartnerRating: (visitId: string) => FoodRating | null
  // Photos
  addPhotos: (photos: Omit<FoodPhotoInsert, "user_id">[]) => Promise<void>
  removePhoto: (photoId: string) => Promise<void>
  getPhotos: (visitId: string) => FoodPhoto[]
  // Derived
  getPreferenceDot: (visitId: string, dimension: RatingDimensionKey) => PreferenceDotColor | null
  getVisitById: (visitId: string) => VisitWithRatings | null
  filterByCuisine: (types: CuisineType[]) => FoodVisit[]
  stats: FoodStats
}

const SIMILARITY_THRESHOLD = 0.5

export function useFoodJournal(): UseFoodJournalReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [visits, setVisits] = useState<FoodVisit[]>([])
  const [ratings, setRatings] = useState<FoodRating[]>([])
  const [photos, setPhotos] = useState<FoodPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch all data on mount ────────────────────────────────
  useEffect(() => {
    if (!user) {
      setVisits([])
      setRatings([])
      setPhotos([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      const [visitsRes, ratingsRes, photosRes] = await Promise.all([
        supabase
          .from("food_visits")
          .select("*")
          .order("visit_date", { ascending: false }),
        supabase
          .from("food_ratings")
          .select("*"),
        supabase
          .from("food_photos")
          .select("*")
          .order("display_order", { ascending: true }),
      ])

      if (!mounted) return

      if (visitsRes.error) {
        setError(visitsRes.error.message)
        setIsLoading(false)
        return
      }

      setVisits((visitsRes.data ?? []) as FoodVisit[])
      setRatings((ratingsRes.data ?? []) as FoodRating[])
      setPhotos((photosRes.data ?? []) as FoodPhoto[])
      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Realtime subscriptions ─────────────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("food_journal_realtime")
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "food_visits" },
        (payload: { eventType: string; new: FoodVisit; old: { id: string } }) => {
          if (payload.eventType === "INSERT") {
            setVisits((prev) => {
              if (prev.some((v) => v.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            setVisits((prev) =>
              prev.map((v) => (v.id === payload.new.id ? payload.new : v))
            )
          } else if (payload.eventType === "DELETE") {
            setVisits((prev) => prev.filter((v) => v.id !== payload.old.id))
          }
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "food_ratings" },
        (payload: { eventType: string; new: FoodRating; old: { id: string } }) => {
          if (payload.eventType === "INSERT") {
            setRatings((prev) => {
              if (prev.some((r) => r.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          } else if (payload.eventType === "UPDATE") {
            setRatings((prev) =>
              prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            )
          }
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "food_photos" },
        (payload: { eventType: string; new: FoodPhoto; old: { id: string } }) => {
          if (payload.eventType === "INSERT") {
            setPhotos((prev) => {
              if (prev.some((p) => p.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          } else if (payload.eventType === "DELETE") {
            setPhotos((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Rating lookups ─────────────────────────────────────────
  const getMyRating = useCallback(
    (visitId: string): FoodRating | null => {
      if (!user) return null
      return ratings.find((r) => r.visit_id === visitId && r.user_id === user.id) ?? null
    },
    [ratings, user]
  )

  const getPartnerRating = useCallback(
    (visitId: string): FoodRating | null => {
      if (!partner) return null
      const rating = ratings.find(
        (r) => r.visit_id === visitId && r.user_id === partner.id
      )
      if (!rating) return null

      // Vibe masking: hide vibe_score until both_reviewed
      if (!rating.both_reviewed) {
        return { ...rating, vibe_score: 0 }
      }
      return rating
    },
    [ratings, partner]
  )

  const getPhotos = useCallback(
    (visitId: string): FoodPhoto[] => {
      return photos.filter((p) => p.visit_id === visitId)
    },
    [photos]
  )

  // ── Preference dot ─────────────────────────────────────────
  const getPreferenceDot = useCallback(
    (visitId: string, dimension: RatingDimensionKey): PreferenceDotColor | null => {
      const mine = getMyRating(visitId)
      const theirs = getPartnerRating(visitId)
      if (!mine || !theirs || !theirs.both_reviewed) return null

      const myScore = mine[dimension] as number
      const theirScore = theirs[dimension] as number
      const diff = myScore - theirScore

      if (Math.abs(diff) <= SIMILARITY_THRESHOLD) return "similar"
      return diff > 0 ? "me" : "partner"
    },
    [getMyRating, getPartnerRating]
  )

  // ── Get visit with relations ───────────────────────────────
  const getVisitById = useCallback(
    (visitId: string): VisitWithRatings | null => {
      const visit = visits.find((v) => v.id === visitId)
      if (!visit) return null

      return {
        ...visit,
        myRating: getMyRating(visitId),
        partnerRating: getPartnerRating(visitId),
        photos: getPhotos(visitId),
      }
    },
    [visits, getMyRating, getPartnerRating, getPhotos]
  )

  // ── Cuisine filter ─────────────────────────────────────────
  const filterByCuisine = useCallback(
    (types: CuisineType[]): FoodVisit[] => {
      if (types.length === 0) return visits
      return visits.filter((v) => types.includes(v.cuisine_type as CuisineType))
    },
    [visits]
  )

  // ── Stats ──────────────────────────────────────────────────
  const stats: FoodStats = useMemo(() => {
    if (visits.length === 0) {
      return {
        totalVisits: 0,
        uniquePlaces: 0,
        avgOverall: 0,
        topCuisine: null,
        returnSpots: 0,
        bookmarkedCount: 0,
      }
    }

    const placeSet = new Set(visits.map((v) => v.place_id ?? v.place_name))
    const uniquePlaces = placeSet.size

    // Count visits per place to find return spots
    const placeCount = new Map<string, number>()
    for (const v of visits) {
      const key = v.place_id ?? v.place_name
      placeCount.set(key, (placeCount.get(key) ?? 0) + 1)
    }
    const returnSpots = Array.from(placeCount.values()).filter((c) => c >= 2).length

    // Average overall from my ratings
    const myRatings = ratings.filter((r) => r.user_id === user?.id)
    const avgOverall =
      myRatings.length > 0
        ? myRatings.reduce((sum, r) => sum + r.overall_average, 0) / myRatings.length
        : 0

    // Top cuisine by frequency
    const cuisineCount = new Map<string, number>()
    for (const v of visits) {
      cuisineCount.set(v.cuisine_type, (cuisineCount.get(v.cuisine_type) ?? 0) + 1)
    }
    let topCuisine: CuisineType | null = null
    let maxCount = 0
    for (const [cuisine, count] of cuisineCount) {
      if (count > maxCount) {
        maxCount = count
        topCuisine = cuisine as CuisineType
      }
    }

    const bookmarkedCount = visits.filter((v) => v.is_bookmarked).length

    return {
      totalVisits: visits.length,
      uniquePlaces,
      avgOverall: Math.round(avgOverall * 10) / 10,
      topCuisine,
      returnSpots,
      bookmarkedCount,
    }
  }, [visits, ratings, user])

  // ── CRUD actions ───────────────────────────────────────────
  const addVisit = useCallback(
    async (data: Omit<FoodVisitInsert, "user_id">): Promise<string | null> => {
      setError(null)
      if (!user) return null

      const { data: inserted, error: insertErr } = await supabase
        .from("food_visits")
        .insert({ ...data, user_id: user.id })
        .select("*")
        .single()

      if (insertErr || !inserted) {
        setError(insertErr?.message ?? "Failed to create visit")
        return null
      }

      const newVisit = inserted as FoodVisit
      setVisits((prev) => [newVisit, ...prev])
      return newVisit.id
    },
    [user, supabase]
  )

  const updateVisit = useCallback(
    async (visitId: string, updates: Partial<FoodVisit>) => {
      setError(null)
      if (!user) return

      const prev = visits.find((v) => v.id === visitId)
      if (!prev) return

      // Optimistic update
      setVisits((all) =>
        all.map((v) => (v.id === visitId ? { ...v, ...updates } : v))
      )

      const { error: updateErr } = await supabase
        .from("food_visits")
        .update(updates)
        .eq("id", visitId)

      if (updateErr) {
        setVisits((all) => all.map((v) => (v.id === visitId ? prev : v)))
        setError(updateErr.message)
      }
    },
    [user, visits, supabase]
  )

  const toggleBookmark = useCallback(
    async (visitId: string) => {
      const visit = visits.find((v) => v.id === visitId)
      if (!visit) return
      await updateVisit(visitId, { is_bookmarked: !visit.is_bookmarked })
    },
    [visits, updateVisit]
  )

  const addRating = useCallback(
    async (data: Omit<FoodRatingInsert, "user_id">) => {
      setError(null)
      if (!user) return

      const { data: inserted, error: insertErr } = await supabase
        .from("food_ratings")
        .insert({ ...data, user_id: user.id })
        .select("*")
        .single()

      if (insertErr) {
        setError(insertErr.message)
        return
      }

      if (inserted) {
        setRatings((prev) => [...prev, inserted as FoodRating])
      }
    },
    [user, supabase]
  )

  const addPhotos = useCallback(
    async (photoData: Omit<FoodPhotoInsert, "user_id">[]) => {
      setError(null)
      if (!user || photoData.length === 0) return

      const rows = photoData.map((p) => ({ ...p, user_id: user.id }))
      const { data: inserted, error: insertErr } = await supabase
        .from("food_photos")
        .insert(rows)
        .select("*")

      if (insertErr) {
        setError(insertErr.message)
        return
      }

      if (inserted) {
        setPhotos((prev) => [...prev, ...(inserted as FoodPhoto[])])
      }
    },
    [user, supabase]
  )

  const removePhoto = useCallback(
    async (photoId: string) => {
      setError(null)
      if (!user) return

      const prevPhotos = [...photos]
      setPhotos((all) => all.filter((p) => p.id !== photoId))

      const { error: deleteErr } = await supabase
        .from("food_photos")
        .delete()
        .eq("id", photoId)

      if (deleteErr) {
        setPhotos(prevPhotos)
        setError(deleteErr.message)
      }
    },
    [user, photos, supabase]
  )

  // ── Inert return when no user ──────────────────────────────
  if (!user) {
    return {
      visits: [],
      isLoading: false,
      error: null,
      addVisit: async () => null,
      updateVisit: async () => {},
      toggleBookmark: async () => {},
      addRating: async () => {},
      getMyRating: () => null,
      getPartnerRating: () => null,
      addPhotos: async () => {},
      removePhoto: async () => {},
      getPhotos: () => [],
      getPreferenceDot: () => null,
      getVisitById: () => null,
      filterByCuisine: () => [],
      stats: {
        totalVisits: 0,
        uniquePlaces: 0,
        avgOverall: 0,
        topCuisine: null,
        returnSpots: 0,
        bookmarkedCount: 0,
      },
    }
  }

  return {
    visits,
    isLoading,
    error,
    addVisit,
    updateVisit,
    toggleBookmark,
    addRating,
    getMyRating,
    getPartnerRating,
    addPhotos,
    removePhoto,
    getPhotos,
    getPreferenceDot,
    getVisitById,
    filterByCuisine,
    stats,
  }
}
