"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Globe,
  EyeOff,
  Eye,
  Settings,
  Share2,
  Edit,
  Users,
  ClipboardList,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { EventPortal, PortalStats } from "@/lib/types/portal.types"
import { RSVPDashboard } from "./RSVPDashboard"
import { GuestListManager } from "./GuestListManager"
import { ShareModal } from "./ShareModal"

type Props = {
  portalId: string
  onEdit?: () => void
}

type TabId = "overview" | "rsvps" | "guests" | "settings"

// ── PortalDashboard ──

export function PortalDashboard({ portalId, onEdit }: Props) {
  const [portal, setPortal] = useState<EventPortal | null>(null)
  const [stats, setStats] = useState<PortalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [showShareModal, setShowShareModal] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(false)

  const supabase = getSupabaseBrowserClient()

  // Fetch portal + stats
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: portalData } = await (supabase
        .from("event_portals" as never)
        .select("*")
        .eq("id", portalId)
        .single() as unknown as Promise<{ data: EventPortal | null; error: unknown }>)

      if (portalData) setPortal(portalData)

      // Fetch stats
      const [rsvpResult, viewResult] = await Promise.all([
        supabase
          .from("portal_rsvps" as never)
          .select("attending,plus_ones")
          .eq("portal_id", portalId) as unknown as Promise<{ data: Array<{ attending: string; plus_ones: number }> | null }>,
        supabase
          .from("portal_analytics" as never)
          .select("id")
          .eq("portal_id", portalId) as unknown as Promise<{ data: Array<{ id: string }> | null }>,
      ])

      const rsvps = rsvpResult.data ?? []
      const attending = rsvps.filter((r) => r.attending === "yes")
      setStats({
        rsvpCount: rsvps.length,
        attendingCount: attending.length,
        declinedCount: rsvps.filter((r) => r.attending === "no").length,
        pendingCount: rsvps.filter((r) => r.attending === "pending" || r.attending === "maybe").length,
        totalGuests: attending.reduce((sum, r) => sum + 1 + (r.plus_ones || 0), 0),
        viewCount: viewResult.data?.length ?? 0,
      })
    } catch {
      // Silent
    } finally {
      setIsLoading(false)
    }
  }, [portalId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Toggle publish
  const handleTogglePublish = useCallback(async () => {
    if (!portal) return
    const newStatus = !portal.is_published
    await (supabase
      .from("event_portals" as never)
      .update({ is_published: newStatus } as never)
      .eq("id", portalId) as unknown as Promise<unknown>)
    setPortal((prev) => prev ? { ...prev, is_published: newStatus } : null)
  }, [portal, portalId, supabase])

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-4 p-4" data-testid="dashboard-loading">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  // ── No portal ──
  if (!portal) {
    return (
      <div className="p-4 text-center text-muted-foreground" data-testid="dashboard-not-found">
        Portal not found
      </div>
    )
  }

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/e/${portal.slug}`
    : `/e/${portal.slug}`

  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <Globe className="h-4 w-4" /> },
    { id: "rsvps", label: "RSVPs", icon: <ClipboardList className="h-4 w-4" /> },
    { id: "guests", label: "Guests", icon: <Users className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-4" data-testid="portal-dashboard">
      {/* Header */}
      <div className="flex items-start justify-between" data-testid="dashboard-header">
        <div>
          <h1 className="text-xl font-bold" data-testid="dashboard-title">{portal.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                portal.is_published
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
              data-testid="dashboard-status"
            >
              {portal.is_published ? (
                <>
                  <Eye className="h-3 w-3" />
                  Published
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3" />
                  Draft
                </>
              )}
            </span>
            <span className="text-xs text-muted-foreground capitalize" data-testid="dashboard-type">
              {portal.event_type}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2" data-testid="dashboard-actions">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          data-testid="action-edit"
        >
          <Edit className="h-4 w-4" />
          Edit Portal
        </button>
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          data-testid="action-share"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button
          type="button"
          onClick={handleTogglePublish}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
            portal.is_published
              ? "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
          data-testid="action-publish"
        >
          {portal.is_published ? (
            <>
              <EyeOff className="h-4 w-4" />
              Unpublish
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              Publish
            </>
          )}
        </button>
        {portal.is_published && (
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
            data-testid="action-view"
          >
            <ExternalLink className="h-4 w-4" />
            View Live
          </a>
        )}
      </div>

      {/* Stats Cards (Overview) */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="dashboard-stats">
          <div className="rounded-xl border p-3" data-testid="stat-views">
            <p className="text-xs text-muted-foreground">Views</p>
            <p className="text-2xl font-bold">{stats.viewCount}</p>
          </div>
          <div className="rounded-xl border p-3" data-testid="stat-rsvps">
            <p className="text-xs text-muted-foreground">RSVPs</p>
            <p className="text-2xl font-bold">{stats.rsvpCount}</p>
          </div>
          <div className="rounded-xl border p-3" data-testid="stat-attending">
            <p className="text-xs text-muted-foreground">Attending</p>
            <p className="text-2xl font-bold">{stats.attendingCount}</p>
          </div>
          <div className="rounded-xl border p-3" data-testid="stat-guests">
            <p className="text-xs text-muted-foreground">Total Guests</p>
            <p className="text-2xl font-bold">{stats.totalGuests}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1" data-testid="dashboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div data-testid="dashboard-content">
        {activeTab === "overview" && (
          <div className="space-y-4" data-testid="tab-overview-content">
            {/* Portal Info */}
            <div className="rounded-xl border p-4 space-y-3">
              <h3 className="text-sm font-semibold">Portal Details</h3>
              {portal.event_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="overview-date">
                    {new Date(portal.event_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {portal.location_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span data-testid="overview-location">{portal.location_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                <span className="truncate text-xs" data-testid="overview-url">{shareUrl}</span>
              </div>
            </div>

            {/* Quick RSVP summary */}
            {stats && stats.rsvpCount > 0 && (
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Recent RSVPs</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("rsvps")}
                    className="text-xs text-primary hover:underline"
                    data-testid="overview-view-rsvps"
                  >
                    View all
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "rsvps" && (
          <div data-testid="tab-rsvps-content">
            <RSVPDashboard portalId={portalId} />
          </div>
        )}

        {activeTab === "guests" && (
          <div data-testid="tab-guests-content">
            <GuestListManager portalId={portalId} portalSlug={portal.slug} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4" data-testid="tab-settings-content">
            <div className="rounded-xl border">
              <button
                type="button"
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="flex w-full items-center justify-between p-4"
                data-testid="settings-toggle"
              >
                <h3 className="text-sm font-semibold">Portal Settings</h3>
                {settingsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {settingsExpanded && (
                <div className="space-y-4 border-t px-4 py-4" data-testid="settings-panel">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Portal Title</label>
                    <p className="text-sm text-muted-foreground" data-testid="settings-title">
                      {portal.title}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Event Type</label>
                    <p className="text-sm capitalize text-muted-foreground" data-testid="settings-type">
                      {portal.event_type}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slug</label>
                    <p className="text-sm text-muted-foreground" data-testid="settings-slug">
                      {portal.slug}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Visibility</label>
                    <p className="text-sm text-muted-foreground" data-testid="settings-visibility">
                      {portal.is_published ? "Published" : "Draft"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        portalTitle={portal.title}
        portalSlug={portal.slug}
      />
    </div>
  )
}
