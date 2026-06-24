import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  Trip,
  TripCompanion,
  TripWithCompanions,
  CreateTripData,
  CompanionDraft,
} from "@/lib/types/trips.types"

type UseTripsReturn = {
  /** All trips visible to the user (own + partner's), newest first. */
  trips: TripWithCompanions[]
  isLoading: boolean
  error: string | null
  /** Create a trip + its inline companions. Returns the new trip id (or null). */
  createTrip: (data: CreateTripData) => Promise<string | null>
  /** Patch a trip the user owns. */
  updateTrip: (
    tripId: string,
    data: Partial<Omit<CreateTripData, "companions">>
  ) => Promise<void>
  /** Delete a trip the user owns (companions cascade). */
  deleteTrip: (tripId: string) => Promise<void>
  /** Add one companion to an existing trip. */
  addCompanion: (tripId: string, companion: CompanionDraft) => Promise<void>
  /** Remove a companion from a trip. */
  removeCompanion: (companionId: string) => Promise<void>
  /** Convenience: a single trip with its companions, by id. */
  getTrip: (tripId: string) => TripWithCompanions | null
}

const INERT_RETURN: UseTripsReturn = {
  trips: [],
  isLoading: false,
  error: null,
  createTrip: async () => null,
  updateTrip: async () => {},
  deleteTrip: async () => {},
  addCompanion: async () => {},
  removeCompanion: async () => {},
  getTrip: () => null,
}

export function useTrips(): UseTripsReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [trips, setTrips] = useState<Trip[]>([])
  const [companions, setCompanions] = useState<TripCompanion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Load trips + companions on mount ───────────────────────
  useEffect(() => {
    if (!user) {
      setTrips([])
      setCompanions([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      // RLS returns own + partner trips. Newest first.
      const { data: tripData, error: tripErr } = await supabase
        .from("trips")
        .select("*")
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (tripErr) {
        setError(tripErr.message)
        setIsLoading(false)
        return
      }

      const fetchedTrips = (tripData ?? []) as Trip[]
      setTrips(fetchedTrips)

      const tripIds = fetchedTrips.map((t) => t.id)
      if (tripIds.length === 0) {
        setCompanions([])
        setIsLoading(false)
        return
      }

      const { data: compData, error: compErr } = await supabase
        .from("trip_companions")
        .select("*")
        .in("trip_id", tripIds)
        .order("created_at", { ascending: true })

      if (!mounted) return

      if (compErr) {
        // Companions are non-fatal — show trips, surface a quiet error.
        setError(compErr.message)
        setCompanions([])
        setIsLoading(false)
        return
      }

      setCompanions((compData ?? []) as TripCompanion[])
      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Realtime: a partner's new trip appears without refresh ──
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("trips_realtime")
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "trips" },
        (payload: { new: Trip }) => {
          setTrips((prev) => {
            if (prev.some((t) => t.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "UPDATE", schema: "public", table: "trips" },
        (payload: { new: Trip }) => {
          setTrips((prev) =>
            prev.map((t) => (t.id === payload.new.id ? payload.new : t))
          )
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "DELETE", schema: "public", table: "trips" },
        (payload: { old: { id: string } }) => {
          setTrips((prev) => prev.filter((t) => t.id !== payload.old.id))
          setCompanions((prev) =>
            prev.filter((c) => c.trip_id !== payload.old.id)
          )
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "trip_companions" },
        (payload: { new: TripCompanion }) => {
          setCompanions((prev) => {
            if (prev.some((c) => c.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "DELETE", schema: "public", table: "trip_companions" },
        (payload: { old: { id: string } }) => {
          setCompanions((prev) => prev.filter((c) => c.id !== payload.old.id))
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Derived: trips with their companions joined ────────────
  const tripsWithCompanions = useMemo<TripWithCompanions[]>(
    () =>
      trips.map((t) => ({
        ...t,
        companions: companions.filter((c) => c.trip_id === t.id),
      })),
    [trips, companions]
  )

  // ── Actions ────────────────────────────────────────────────

  const createTrip = useCallback(
    async (data: CreateTripData): Promise<string | null> => {
      setError(null)
      if (!user) return null

      // 1. Insert the trip.
      const { data: inserted, error: insertErr } = await supabase
        .from("trips")
        .insert({
          created_by: user.id,
          title: data.title,
          destination: data.destination ?? null,
          start_date: data.start_date ?? null,
          end_date: data.end_date ?? null,
          cover_image: data.cover_image ?? null,
          summary: data.summary ?? null,
          kind: data.kind ?? "native",
          hosted_path: data.hosted_path ?? null,
          status: data.status ?? "past",
        })
        .select("*")
        .single()

      if (insertErr || !inserted) {
        const msg = insertErr?.message ?? "Failed to log this travel"
        setError(msg)
        toast.error(msg)
        return null
      }

      const newTrip = inserted as Trip
      setTrips((prev) => [newTrip, ...prev])

      // 2. Insert companions (if any). Non-fatal if this part fails — the
      //    trip is already saved; we surface a toast and keep what stuck.
      const drafts = (data.companions ?? []).filter(
        (c) => c.name.trim().length > 0
      )
      if (drafts.length > 0) {
        const rows = drafts.map((c) => ({
          trip_id: newTrip.id,
          name: c.name.trim(),
          relation: c.relation?.trim() || null,
          avatar_url: c.avatar_url ?? null,
        }))

        const { data: compInserted, error: compErr } = await supabase
          .from("trip_companions")
          .insert(rows)
          .select("*")

        if (compErr) {
          toast.error("Trip saved, but some companions didn't stick")
        } else if (compInserted) {
          setCompanions((prev) => [
            ...prev,
            ...(compInserted as TripCompanion[]),
          ])
        }
      }

      toast.success("Travel logged")
      return newTrip.id
    },
    [user, supabase]
  )

  const updateTrip = useCallback(
    async (
      tripId: string,
      data: Partial<Omit<CreateTripData, "companions">>
    ) => {
      setError(null)
      if (!user) return

      const prev = trips.find((t) => t.id === tripId)
      if (!prev) return

      const fields: Record<string, unknown> = {}
      if (data.title !== undefined) fields.title = data.title
      if (data.destination !== undefined) fields.destination = data.destination
      if (data.start_date !== undefined) fields.start_date = data.start_date
      if (data.end_date !== undefined) fields.end_date = data.end_date
      if (data.cover_image !== undefined) fields.cover_image = data.cover_image
      if (data.summary !== undefined) fields.summary = data.summary
      if (data.kind !== undefined) fields.kind = data.kind
      if (data.hosted_path !== undefined) fields.hosted_path = data.hosted_path
      if (data.status !== undefined) fields.status = data.status

      if (Object.keys(fields).length === 0) return

      // Optimistic.
      setTrips((items) =>
        items.map((t) => (t.id === tripId ? ({ ...t, ...fields } as Trip) : t))
      )

      const { error: updateErr } = await supabase
        .from("trips")
        .update(fields)
        .eq("id", tripId)

      if (updateErr) {
        setTrips((items) => items.map((t) => (t.id === tripId ? prev : t)))
        setError(updateErr.message)
        toast.error("Couldn't save your changes")
      }
    },
    [user, trips, supabase]
  )

  const deleteTrip = useCallback(
    async (tripId: string) => {
      setError(null)
      if (!user) return

      const removedTrip = trips.find((t) => t.id === tripId)
      const removedComps = companions.filter((c) => c.trip_id === tripId)

      // Optimistic remove (trip + its companions).
      setTrips((prev) => prev.filter((t) => t.id !== tripId))
      setCompanions((prev) => prev.filter((c) => c.trip_id !== tripId))

      const { error: deleteErr } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripId)

      if (deleteErr) {
        // Rollback.
        if (removedTrip) setTrips((prev) => [removedTrip, ...prev])
        if (removedComps.length > 0)
          setCompanions((prev) => [...prev, ...removedComps])
        setError(deleteErr.message)
        toast.error("Couldn't delete this travel")
      }
    },
    [user, trips, companions, supabase]
  )

  const addCompanion = useCallback(
    async (tripId: string, companion: CompanionDraft) => {
      setError(null)
      if (!user) return
      const name = companion.name.trim()
      if (!name) return

      const { data: inserted, error: insertErr } = await supabase
        .from("trip_companions")
        .insert({
          trip_id: tripId,
          name,
          relation: companion.relation?.trim() || null,
          avatar_url: companion.avatar_url ?? null,
        })
        .select("*")
        .single()

      if (insertErr || !inserted) {
        setError(insertErr?.message ?? "Couldn't add companion")
        toast.error("Couldn't add companion")
        return
      }

      setCompanions((prev) => [...prev, inserted as TripCompanion])
    },
    [user, supabase]
  )

  const removeCompanion = useCallback(
    async (companionId: string) => {
      setError(null)
      if (!user) return

      const removed = companions.find((c) => c.id === companionId)
      setCompanions((prev) => prev.filter((c) => c.id !== companionId))

      const { error: deleteErr } = await supabase
        .from("trip_companions")
        .delete()
        .eq("id", companionId)

      if (deleteErr) {
        if (removed) setCompanions((prev) => [...prev, removed])
        setError(deleteErr.message)
        toast.error("Couldn't remove companion")
      }
    },
    [user, companions, supabase]
  )

  const getTrip = useCallback(
    (tripId: string): TripWithCompanions | null =>
      tripsWithCompanions.find((t) => t.id === tripId) ?? null,
    [tripsWithCompanions]
  )

  // ── Inert when signed out ──────────────────────────────────
  if (!user) return INERT_RETURN

  return {
    trips: tripsWithCompanions,
    isLoading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    addCompanion,
    removeCompanion,
    getTrip,
  }
}
