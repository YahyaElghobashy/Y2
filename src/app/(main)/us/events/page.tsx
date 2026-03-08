"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, PartyPopper } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { EventPortal } from "@/lib/types/portal.types"
import { EventPortalCard } from "@/components/events/EventPortalCard"

type PortalWithStats = {
  portal: EventPortal
  rsvpCount: number
  viewCount: number
}

export default function EventsListPage() {
  const [portals, setPortals] = useState<PortalWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const fetchPortals = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const { data } = await (supabase
        .from("event_portals" as never)
        .select("*")
        .eq("creator_id", user.id)
        .order("updated_at", { ascending: false }) as unknown as Promise<{ data: EventPortal[] | null }>)

      if (!data || data.length === 0) {
        setPortals([])
        return
      }

      // Fetch stats for each portal
      const portalIds = data.map((p) => p.id)
      const [rsvpResult, viewResult] = await Promise.all([
        supabase
          .from("portal_rsvps" as never)
          .select("portal_id")
          .in("portal_id", portalIds) as unknown as Promise<{ data: Array<{ portal_id: string }> | null }>,
        supabase
          .from("portal_analytics" as never)
          .select("portal_id")
          .in("portal_id", portalIds) as unknown as Promise<{ data: Array<{ portal_id: string }> | null }>,
      ])

      const rsvpCounts = new Map<string, number>()
      const viewCounts = new Map<string, number>()
      rsvpResult.data?.forEach((r) => {
        rsvpCounts.set(r.portal_id, (rsvpCounts.get(r.portal_id) ?? 0) + 1)
      })
      viewResult.data?.forEach((v) => {
        viewCounts.set(v.portal_id, (viewCounts.get(v.portal_id) ?? 0) + 1)
      })

      setPortals(
        data.map((portal) => ({
          portal,
          rsvpCount: rsvpCounts.get(portal.id) ?? 0,
          viewCount: viewCounts.get(portal.id) ?? 0,
        }))
      )
    } catch {
      // Silent
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchPortals()
  }, [fetchPortals])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6" data-testid="events-list-page">
      {/* Header */}
      <div className="flex items-center justify-between" data-testid="events-header">
        <h1 className="text-xl font-bold">Event Portals</h1>
        <button
          type="button"
          onClick={() => router.push("/us/events/new")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          data-testid="create-portal-button"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="mt-6 space-y-3" data-testid="events-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && portals.length === 0 && (
        <div
          className="mt-12 flex flex-col items-center gap-4 text-center"
          data-testid="events-empty"
        >
          <div className="rounded-full bg-muted p-4">
            <PartyPopper className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No event portals yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first event portal to share with guests
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/us/events/new")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
            data-testid="create-portal-empty"
          >
            <Plus className="h-4 w-4" />
            Create Portal
          </button>
        </div>
      )}

      {/* Portal Grid */}
      {!isLoading && portals.length > 0 && (
        <div className="mt-4 space-y-3" data-testid="events-grid">
          {portals.map(({ portal, rsvpCount, viewCount }) => (
            <EventPortalCard
              key={portal.id}
              portal={portal}
              rsvpCount={rsvpCount}
              viewCount={viewCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}
