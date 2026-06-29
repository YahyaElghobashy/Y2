import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import {
  aggregateCountries,
  mutualPins,
  mutualPinDetails,
  ourNextTrip,
} from "@/lib/travels/country-status"
import { COUNTRY_NAME } from "@/lib/data/iso-country-codes"
import type {
  CountryVisit,
  CountryPin,
  CountryAggregate,
  MutualPin,
  OurNextTrip,
  LogVisitData,
} from "@/lib/types/world-map.types"

type UpcomingTripLite = { id: string; destination: string | null; status: string }

type UseWorldMapReturn = {
  isLoading: boolean
  error: string | null
  /** Per-country folded view, keyed by ISO alpha-2. */
  countries: Map<string, CountryAggregate>
  myPins: CountryPin[]
  partnerPins: CountryPin[]
  mutualPins: string[]
  mutualDetails: MutualPin[]
  ourNextTrip: OurNextTrip | null
  /** Every visit (both parties) for one country, for the detail sheet. */
  visitsFor: (iso2: string) => CountryVisit[]
  addVisit: (data: LogVisitData) => Promise<void>
  updateVisit: (id: string, patch: Partial<LogVisitData>) => Promise<void>
  deleteVisit: (id: string) => Promise<void>
  /** Partner-only: add my perspective to a together memory. */
  addPartnerNote: (visitId: string, note: string) => Promise<void>
  addPin: (iso2: string, note?: string | null) => Promise<void>
  removePin: (iso2: string) => Promise<void>
}

const INERT: UseWorldMapReturn = {
  isLoading: false,
  error: null,
  countries: new Map(),
  myPins: [],
  partnerPins: [],
  mutualPins: [],
  mutualDetails: [],
  ourNextTrip: null,
  visitsFor: () => [],
  addVisit: async () => {},
  updateVisit: async () => {},
  deleteVisit: async () => {},
  addPartnerNote: async () => {},
  addPin: async () => {},
  removePin: async () => {},
}

const MAX_PINS = 3

export function useWorldMap(): UseWorldMapReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [visits, setVisits] = useState<CountryVisit[]>([])
  const [pins, setPins] = useState<CountryPin[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingTripLite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Load (RLS returns own + partner rows) ──────────────────
  useEffect(() => {
    if (!user) {
      setVisits([])
      setPins([])
      setUpcoming([])
      setIsLoading(false)
      return
    }

    let mounted = true
    async function load() {
      const [{ data: visitData, error: vErr }, { data: pinData, error: pErr }, { data: tripData }] =
        await Promise.all([
          supabase.from("country_visits").select("*"),
          supabase.from("country_pins").select("*"),
          supabase.from("trips").select("id, destination, status").eq("status", "upcoming"),
        ])

      if (!mounted) return

      if (vErr || pErr) {
        setError(vErr?.message ?? pErr?.message ?? "Failed to load the map")
        setIsLoading(false)
        return
      }

      setVisits((visitData ?? []) as CountryVisit[])
      setPins((pinData ?? []) as CountryPin[])
      setUpcoming((tripData ?? []) as UpcomingTripLite[])
      setIsLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Realtime: partner's visits/pins arrive without refresh ──
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("world_map_realtime")
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "country_visits" },
        (payload: { new: CountryVisit }) => {
          setVisits((prev) =>
            prev.some((v) => v.id === payload.new.id) ? prev : [...prev, payload.new]
          )
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "UPDATE", schema: "public", table: "country_visits" },
        (payload: { new: CountryVisit }) => {
          setVisits((prev) => prev.map((v) => (v.id === payload.new.id ? payload.new : v)))
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "DELETE", schema: "public", table: "country_visits" },
        (payload: { old: { id: string } }) => {
          setVisits((prev) => prev.filter((v) => v.id !== payload.old.id))
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "country_pins" },
        (payload: { new: CountryPin }) => {
          setPins((prev) =>
            prev.some((p) => p.id === payload.new.id) ? prev : [...prev, payload.new]
          )
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "DELETE", schema: "public", table: "country_pins" },
        (payload: { old: { id: string } }) => {
          setPins((prev) => prev.filter((p) => p.id !== payload.old.id))
        }
      )

    channel.subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Derived ────────────────────────────────────────────────
  const myPins = useMemo(
    () => (user ? pins.filter((p) => p.owner_id === user.id) : []),
    [pins, user]
  )
  const partnerPins = useMemo(
    () => (partner ? pins.filter((p) => p.owner_id === partner.id) : []),
    [pins, partner]
  )
  const countries = useMemo(
    () => (user ? aggregateCountries(visits, user.id, partner?.id ?? null) : new Map()),
    [visits, user, partner]
  )
  const mutual = useMemo(() => mutualPins(myPins, partnerPins), [myPins, partnerPins])
  const mutualDetails = useMemo(
    () => mutualPinDetails(myPins, partnerPins),
    [myPins, partnerPins]
  )
  const next = useMemo(() => ourNextTrip(mutual, upcoming), [mutual, upcoming])

  const visitsFor = useCallback(
    (iso2: string) =>
      visits.filter((v) => (v.country_code || "").toUpperCase() === iso2.toUpperCase()),
    [visits]
  )

  // ── Mutations (THROW contract) ─────────────────────────────
  const addVisit = useCallback(
    async (data: LogVisitData) => {
      setError(null)
      if (!user) throw new Error("Not signed in")
      const code = data.countryCode.toUpperCase()
      if (code.length !== 2) throw new Error("Pick a country")

      const travelerId = data.isTogether
        ? user.id
        : data.traveler === "partner" && partner
          ? partner.id
          : user.id

      const { data: inserted, error: insertErr } = await supabase
        .from("country_visits")
        .insert({
          created_by: user.id,
          traveler_id: travelerId,
          country_code: code,
          is_together: data.isTogether,
          place: data.place ?? null,
          visited_year: data.visitedYear ?? null,
          visited_on: data.visitedOn ?? null,
          companions: data.companions ?? null,
          memorable: data.memorable ?? null,
          recommendation: data.recommendation ?? null,
          trip_id: data.tripId ?? null,
        })
        .select("*")
        .single()

      if (insertErr || !inserted) {
        const msg = insertErr?.message ?? "Couldn't log this visit"
        setError(msg)
        throw new Error(msg)
      }
      setVisits((prev) => [...prev, inserted as CountryVisit])
    },
    [user, partner, supabase]
  )

  const updateVisit = useCallback(
    async (id: string, patch: Partial<LogVisitData>) => {
      setError(null)
      if (!user) throw new Error("Not signed in")

      const fields: Record<string, unknown> = {}
      if (patch.countryCode !== undefined) fields.country_code = patch.countryCode.toUpperCase()
      if (patch.isTogether !== undefined) fields.is_together = patch.isTogether
      if (patch.place !== undefined) fields.place = patch.place
      if (patch.visitedYear !== undefined) fields.visited_year = patch.visitedYear
      if (patch.visitedOn !== undefined) fields.visited_on = patch.visitedOn
      if (patch.companions !== undefined) fields.companions = patch.companions
      if (patch.memorable !== undefined) fields.memorable = patch.memorable
      if (patch.recommendation !== undefined) fields.recommendation = patch.recommendation
      if (patch.tripId !== undefined) fields.trip_id = patch.tripId
      if (Object.keys(fields).length === 0) return

      const { error: updErr } = await supabase
        .from("country_visits")
        .update(fields)
        .eq("id", id)
      if (updErr) {
        setError(updErr.message)
        throw new Error(updErr.message)
      }
      setVisits((prev) =>
        prev.map((v) => (v.id === id ? ({ ...v, ...fields } as CountryVisit) : v))
      )
    },
    [user, supabase]
  )

  const deleteVisit = useCallback(
    async (id: string) => {
      setError(null)
      if (!user) throw new Error("Not signed in")
      const removed = visits.find((v) => v.id === id)
      setVisits((prev) => prev.filter((v) => v.id !== id))
      const { error: delErr } = await supabase.from("country_visits").delete().eq("id", id)
      if (delErr) {
        if (removed) setVisits((prev) => [...prev, removed])
        setError(delErr.message)
        throw new Error(delErr.message)
      }
    },
    [user, visits, supabase]
  )

  const addPartnerNote = useCallback(
    async (visitId: string, note: string) => {
      setError(null)
      if (!user) throw new Error("Not signed in")
      const { error: updErr } = await supabase
        .from("country_visits")
        .update({ partner_note: note })
        .eq("id", visitId)
      if (updErr) {
        setError(updErr.message)
        throw new Error(updErr.message)
      }
      setVisits((prev) =>
        prev.map((v) => (v.id === visitId ? { ...v, partner_note: note } : v))
      )
    },
    [user, supabase]
  )

  const addPin = useCallback(
    async (iso2: string, note?: string | null) => {
      setError(null)
      if (!user) throw new Error("Not signed in")
      const code = iso2.toUpperCase()
      if (code.length !== 2) throw new Error("Pick a country")
      if (myPins.some((p) => p.country_code.toUpperCase() === code)) {
        throw new Error("Already pinned")
      }
      if (myPins.length >= MAX_PINS) {
        const msg = "You can pin at most 3 aspirational countries"
        setError(msg)
        throw new Error(msg)
      }

      const { data: inserted, error: insErr } = await supabase
        .from("country_pins")
        .insert({ owner_id: user.id, country_code: code, note: note ?? null })
        .select("*")
        .single()
      if (insErr || !inserted) {
        const msg = insErr?.message ?? "Couldn't pin this country"
        setError(msg)
        throw new Error(msg)
      }
      setPins((prev) => [...prev, inserted as CountryPin])

      // New mutual match → notify the partner (system event; no send-quota).
      const isMatch = partnerPins.some((p) => p.country_code.toUpperCase() === code)
      if (isMatch && partner) {
        const name = COUNTRY_NAME[code] ?? code
        try {
          const { data: notif } = await supabase
            .from("notifications")
            .insert({
              sender_id: user.id,
              recipient_id: partner.id,
              type: "travel_pin_match",
              title: "A shared dream ✈️",
              body: `You both pinned ${name} — your next adventure?`,
              emoji: "🗺️",
            })
            .select("id")
            .single()
          if (notif?.id) {
            await supabase.functions.invoke("send-notification", {
              body: { notification_id: notif.id, recipient_id: partner.id },
            })
          }
        } catch {
          // Best-effort: the pin is saved even if the nudge fails.
        }
      }
    },
    [user, partner, myPins, partnerPins, supabase]
  )

  const removePin = useCallback(
    async (iso2: string) => {
      setError(null)
      if (!user) throw new Error("Not signed in")
      const code = iso2.toUpperCase()
      const mine = myPins.find((p) => p.country_code.toUpperCase() === code)
      if (!mine) return
      setPins((prev) => prev.filter((p) => p.id !== mine.id))
      const { error: delErr } = await supabase.from("country_pins").delete().eq("id", mine.id)
      if (delErr) {
        setPins((prev) => [...prev, mine])
        setError(delErr.message)
        throw new Error(delErr.message)
      }
    },
    [user, myPins, supabase]
  )

  if (!user) return INERT

  return {
    isLoading,
    error,
    countries,
    myPins,
    partnerPins,
    mutualPins: mutual,
    mutualDetails,
    ourNextTrip: next,
    visitsFor,
    addVisit,
    updateVisit,
    deleteVisit,
    addPartnerNote,
    addPin,
    removePin,
  }
}
