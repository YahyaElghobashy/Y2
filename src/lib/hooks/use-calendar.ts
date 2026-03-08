import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  CalendarEvent,
  CalendarEventInsert,
  CalendarEventUpdate,
  UseCalendarReturn,
} from "@/lib/types/calendar.types"

export function useCalendar(): UseCalendarReturn {
  const { user, profile } = useAuth()
  const supabase = getSupabaseBrowserClient()

  // Fire-and-forget Google Calendar sync (no-op if not connected)
  const syncToGoogleCalendar = useCallback(
    (eventId: string, action: "create" | "update" | "delete") => {
      if (!profile?.google_calendar_refresh_token) return
      supabase.functions
        .invoke("google-calendar-sync", { body: { event_id: eventId, action } })
        .catch(() => {}) // swallow — sync failure should never break UI
    },
    [profile?.google_calendar_refresh_token, supabase]
  )

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setEvents((data as CalendarEvent[]) ?? [])
    setError(null)
  }, [user, supabase])

  // Derived: upcoming events (today or later, sorted by date then time)
  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return events
      .filter((e) => e.event_date >= today)
      .sort(
        (a, b) =>
          a.event_date.localeCompare(b.event_date) ||
          (a.event_time ?? "").localeCompare(b.event_time ?? "")
      )
  }, [events])

  // Derived: milestone events (upcoming only)
  const milestones = useMemo(
    () => upcomingEvents.filter((e) => e.category === "milestone"),
    [upcomingEvents]
  )

  // Synchronous filter for month view
  const getEventsForMonth = useCallback(
    (year: number, month: number) => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`
      return events.filter((e) => e.event_date.startsWith(prefix))
    },
    [events]
  )

  // CRUD: create event
  const createEvent = useCallback(
    async (data: Omit<CalendarEventInsert, "creator_id">) => {
      setError(null)
      if (!user) return null

      const { data: created, error: insertError } = await supabase
        .from("events")
        .insert({ ...data, creator_id: user.id })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      await fetchEvents()
      syncToGoogleCalendar((created as CalendarEvent).id, "create")
      return created as CalendarEvent
    },
    [user, supabase, fetchEvents, syncToGoogleCalendar]
  )

  // CRUD: update event
  const updateEvent = useCallback(
    async (id: string, data: CalendarEventUpdate) => {
      setError(null)
      if (!user) return

      const { error: updateError } = await supabase
        .from("events")
        .update(data)
        .eq("id", id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      await fetchEvents()
      syncToGoogleCalendar(id, "update")
    },
    [user, supabase, fetchEvents, syncToGoogleCalendar]
  )

  // CRUD: delete event
  const deleteEvent = useCallback(
    async (id: string) => {
      setError(null)
      if (!user) return

      // Sync delete to Google Calendar BEFORE removing from DB
      // (edge function needs the event row to look up google_calendar_event_id)
      syncToGoogleCalendar(id, "delete")

      const { error: deleteError } = await supabase
        .from("events")
        .delete()
        .eq("id", id)

      if (deleteError) {
        setError(deleteError.message)
        return
      }

      await fetchEvents()
    },
    [user, supabase, fetchEvents, syncToGoogleCalendar]
  )

  // Initial data load
  useEffect(() => {
    if (!user) {
      setEvents([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadEvents() {
      const { data, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true })

      if (!mounted) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setEvents((data as CalendarEvent[]) ?? [])
      }
      setIsLoading(false)
    }

    loadEvents()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`events_${user.id}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => {
          fetchEvents()
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchEvents])

  // Inert return when user is null
  if (!user) {
    return {
      events: [],
      upcomingEvents: [],
      milestones: [],
      isLoading: false,
      error: null,
      createEvent: async () => null,
      updateEvent: async () => {},
      deleteEvent: async () => {},
      refreshEvents: async () => {},
      getEventsForMonth: () => [],
    }
  }

  return {
    events,
    upcomingEvents,
    milestones,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: fetchEvents,
    getEventsForMonth,
  }
}
