import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  EventPortal,
  EventPortalInsert,
  EventPortalUpdate,
  PortalSubEvent,
  PortalSubEventInsert,
  PortalSubEventUpdate,
  PortalThemeConfig,
  PortalStats,
  UseEventPortalReturn,
} from "@/lib/types/portal.types"

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 40)
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}

export function useEventPortal(portalId?: string): UseEventPortalReturn {
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = getSupabaseBrowserClient() as any

  const [portals, setPortals] = useState<EventPortal[]>([])
  const [subEvents, setSubEvents] = useState<PortalSubEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch all portals for the current user ──
  const fetchPortals = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("event_portals")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setPortals((data as EventPortal[]) ?? [])
    setError(null)
  }, [user, supabase])

  // ── Fetch sub-events for a specific portal ──
  const fetchSubEvents = useCallback(
    async (pid: string) => {
      const { data, error: fetchError } = await supabase
        .from("portal_sub_events")
        .select("*")
        .eq("portal_id", pid)
        .order("position", { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setSubEvents((data as PortalSubEvent[]) ?? [])
    },
    [supabase]
  )

  // ── Initial data load ──
  useEffect(() => {
    if (!user) {
      setPortals([])
      setSubEvents([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      await fetchPortals()
      if (portalId && mounted) {
        await fetchSubEvents(portalId)
      }
      if (mounted) setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, portalId, fetchPortals, fetchSubEvents])

  // ── Derived: current portal ──
  const portal = portalId ? portals.find((p) => p.id === portalId) ?? null : null

  // ── CRUD: Create portal ──
  const createPortal = useCallback(
    async (
      data: Omit<EventPortalInsert, "creator_id" | "slug">
    ): Promise<EventPortal | null> => {
      setError(null)
      if (!user) return null

      const slug = generateSlug(data.title)

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from("event_portals")
        .select("id")
        .eq("slug", slug)
        .maybeSingle()

      const finalSlug = existing
        ? generateSlug(data.title) // regenerate if collision
        : slug

      const { data: created, error: insertError } = await supabase
        .from("event_portals")
        .insert({ ...data, creator_id: user.id, slug: finalSlug })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      await fetchPortals()
      return created as EventPortal
    },
    [user, supabase, fetchPortals]
  )

  // ── CRUD: Update portal ──
  const updatePortal = useCallback(
    async (id: string, data: EventPortalUpdate) => {
      setError(null)
      if (!user) return

      const { error: updateError } = await supabase
        .from("event_portals")
        .update(data)
        .eq("id", id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      await fetchPortals()
    },
    [user, supabase, fetchPortals]
  )

  // ── CRUD: Delete portal ──
  const deletePortal = useCallback(
    async (id: string) => {
      setError(null)
      if (!user) return

      const { error: deleteError } = await supabase
        .from("event_portals")
        .delete()
        .eq("id", id)

      if (deleteError) {
        setError(deleteError.message)
        return
      }

      await fetchPortals()
    },
    [user, supabase, fetchPortals]
  )

  // ── Sub-events: Add ──
  const addSubEvent = useCallback(
    async (
      data: Omit<PortalSubEventInsert, "portal_id">
    ): Promise<PortalSubEvent | null> => {
      setError(null)
      if (!portalId) return null

      const { data: created, error: insertError } = await supabase
        .from("portal_sub_events")
        .insert({ ...data, portal_id: portalId })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      await fetchSubEvents(portalId)
      return created as PortalSubEvent
    },
    [portalId, supabase, fetchSubEvents]
  )

  // ── Sub-events: Update ──
  const updateSubEvent = useCallback(
    async (id: string, data: PortalSubEventUpdate) => {
      setError(null)

      const { error: updateError } = await supabase
        .from("portal_sub_events")
        .update(data)
        .eq("id", id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      if (portalId) await fetchSubEvents(portalId)
    },
    [supabase, portalId, fetchSubEvents]
  )

  // ── Sub-events: Delete ──
  const deleteSubEvent = useCallback(
    async (id: string) => {
      setError(null)

      const { error: deleteError } = await supabase
        .from("portal_sub_events")
        .delete()
        .eq("id", id)

      if (deleteError) {
        setError(deleteError.message)
        return
      }

      if (portalId) await fetchSubEvents(portalId)
    },
    [supabase, portalId, fetchSubEvents]
  )

  // ── Actions: Toggle publish ──
  const togglePublish = useCallback(
    async (id: string) => {
      const target = portals.find((p) => p.id === id)
      if (!target) return

      await updatePortal(id, { is_published: !target.is_published })
    },
    [portals, updatePortal]
  )

  // ── Actions: Update theme ──
  const updateTheme = useCallback(
    async (id: string, config: PortalThemeConfig) => {
      await updatePortal(id, { theme_config: config as unknown as Record<string, unknown> })
    },
    [updatePortal]
  )

  // ── Computed: Share URL ──
  const getShareUrl = useCallback((slug: string) => {
    if (typeof window === "undefined") return `/e/${slug}`
    return `${window.location.origin}/e/${slug}`
  }, [])

  // ── Computed: Stats ──
  const getStats = useCallback(
    async (pid: string): Promise<PortalStats> => {
      const [rsvpResult, analyticsResult] = await Promise.all([
        supabase.from("portal_rsvps").select("attending").eq("portal_id", pid),
        supabase
          .from("portal_analytics")
          .select("id", { count: "exact", head: true })
          .eq("portal_id", pid),
      ])

      const rsvps = (rsvpResult.data as { attending: string }[]) ?? []
      const viewCount = analyticsResult.count ?? 0

      const attending = rsvps.filter((r) => r.attending === "yes")
      return {
        rsvpCount: rsvps.length,
        attendingCount: attending.length,
        declinedCount: rsvps.filter((r) => r.attending === "no").length,
        pendingCount: rsvps.filter((r) => r.attending === "pending" || r.attending === "maybe").length,
        totalGuests: rsvps.length, // simplified — full guest count requires plus_ones data
        viewCount,
      }
    },
    [supabase]
  )

  // ── Inert return when user is null ──
  if (!user) {
    return {
      portals: [],
      portal: null,
      subEvents: [],
      isLoading: false,
      error: null,
      createPortal: async () => null,
      updatePortal: async () => {},
      deletePortal: async () => {},
      addSubEvent: async () => null,
      updateSubEvent: async () => {},
      deleteSubEvent: async () => {},
      togglePublish: async () => {},
      updateTheme: async () => {},
      getShareUrl: () => "",
      getStats: async () => ({
        rsvpCount: 0,
        attendingCount: 0,
        declinedCount: 0,
        pendingCount: 0,
        totalGuests: 0,
        viewCount: 0,
      }),
      refreshPortals: async () => {},
    }
  }

  return {
    portals,
    portal,
    subEvents,
    isLoading,
    error,
    createPortal,
    updatePortal,
    deletePortal,
    addSubEvent,
    updateSubEvent,
    deleteSubEvent,
    togglePublish,
    updateTheme,
    getShareUrl,
    getStats,
    refreshPortals: fetchPortals,
  }
}
