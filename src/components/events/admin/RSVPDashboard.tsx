"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Download,
  ArrowUpDown,
  Hotel,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { PortalRSVP, AttendingStatus } from "@/lib/types/portal.types"

type Props = {
  portalId: string
}

type SortKey = "name" | "attending" | "plus_ones" | "submitted_at"
type SortDir = "asc" | "desc"
type FilterStatus = AttendingStatus | "all"

// ── Summary Card ──

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users
  label: string
  value: number
  color: string
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-4"
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

// ── Hotel Breakdown Bar ──

function HotelBreakdown({ rsvps }: { rsvps: PortalRSVP[] }) {
  const hotelCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    rsvps.forEach((r) => {
      if (r.hotel_choice) {
        counts[r.hotel_choice] = (counts[r.hotel_choice] ?? 0) + 1
      }
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [rsvps])

  if (hotelCounts.length === 0) return null

  const max = Math.max(...hotelCounts.map(([, c]) => c))

  return (
    <div className="rounded-xl border p-4" data-testid="hotel-breakdown">
      <div className="mb-3 flex items-center gap-2">
        <Hotel className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Hotel Choices</h3>
      </div>
      <div className="space-y-2">
        {hotelCounts.map(([hotel, count]) => (
          <div key={hotel} data-testid={`hotel-bar-${hotel}`}>
            <div className="flex items-center justify-between text-xs">
              <span>{hotel}</span>
              <span className="font-medium">{count}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(count / max) * 100}%` }}
                data-testid={`hotel-bar-fill-${hotel}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CSV Export ──

function exportToCSV(rsvps: PortalRSVP[], filename = "rsvps.csv") {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Attending",
    "Plus Ones",
    "Meal Preference",
    "Dietary Notes",
    "Hotel Choice",
    "Message",
    "Submitted At",
  ]

  const rows = rsvps.map((r) => [
    r.name,
    r.email ?? "",
    r.phone ?? "",
    r.attending,
    String(r.plus_ones),
    r.meal_preference ?? "",
    r.dietary_notes ?? "",
    r.hotel_choice ?? "",
    r.message ?? "",
    new Date(r.submitted_at).toLocaleDateString(),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Status Badge ──

const STATUS_CONFIG: Record<
  AttendingStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  yes: { label: "Attending", color: "#22c55e", icon: CheckCircle2 },
  no: { label: "Declined", color: "#ef4444", icon: XCircle },
  maybe: { label: "Maybe", color: "#f59e0b", icon: HelpCircle },
  pending: { label: "Pending", color: "#8b5cf6", icon: Clock },
}

function StatusBadge({ status }: { status: AttendingStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${config.color}15`, color: config.color }}
      data-testid={`status-badge-${status}`}
    >
      <config.icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

// ── Main Component ──

export function RSVPDashboard({ portalId }: Props) {
  const [rsvps, setRsvps] = useState<PortalRSVP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>("submitted_at")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Fetch RSVPs
  useEffect(() => {
    async function fetchRSVPs() {
      const supabase = getSupabaseBrowserClient() as ReturnType<typeof getSupabaseBrowserClient> & { from: (table: string) => unknown }
      const { data } = await (supabase as any)
        .from("portal_rsvps")
        .select("*")
        .eq("portal_id", portalId)
        .order("submitted_at", { ascending: false })

      setRsvps((data as PortalRSVP[]) ?? [])
      setIsLoading(false)
    }

    fetchRSVPs()
  }, [portalId])

  // Realtime subscription
  useEffect(() => {
    const supabase = getSupabaseBrowserClient() as any

    const channel = supabase
      .channel(`rsvps-${portalId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "portal_rsvps",
          filter: `portal_id=eq.${portalId}`,
        },
        (payload: { new: PortalRSVP }) => {
          setRsvps((prev) => [payload.new, ...prev])
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "portal_rsvps",
          filter: `portal_id=eq.${portalId}`,
        },
        (payload: { new: PortalRSVP }) => {
          setRsvps((prev) =>
            prev.map((r) => (r.id === payload.new.id ? payload.new : r))
          )
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "portal_rsvps",
          filter: `portal_id=eq.${portalId}`,
        },
        (payload: { old: { id: string } }) => {
          setRsvps((prev) => prev.filter((r) => r.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [portalId])

  // Sort + filter
  const filteredRsvps = useMemo(() => {
    let list = filter === "all" ? rsvps : rsvps.filter((r) => r.attending === filter)

    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "attending":
          cmp = a.attending.localeCompare(b.attending)
          break
        case "plus_ones":
          cmp = a.plus_ones - b.plus_ones
          break
        case "submitted_at":
          cmp = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [rsvps, filter, sortKey, sortDir])

  // Stats
  const stats = useMemo(() => {
    const attending = rsvps.filter((r) => r.attending === "yes").length
    const declined = rsvps.filter((r) => r.attending === "no").length
    const maybe = rsvps.filter((r) => r.attending === "maybe").length
    const pending = rsvps.filter((r) => r.attending === "pending").length
    const totalGuests = rsvps
      .filter((r) => r.attending === "yes")
      .reduce((sum, r) => sum + 1 + r.plus_ones, 0)
    return { total: rsvps.length, attending, declined, maybe, pending, totalGuests }
  }, [rsvps])

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setSortKey(key)
        setSortDir("asc")
      }
    },
    [sortKey]
  )

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="rsvp-loading">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="rsvp-dashboard">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="rsvp-stats">
        <StatCard icon={Users} label="Total" value={stats.total} color="#6366f1" />
        <StatCard icon={CheckCircle2} label="Attending" value={stats.attending} color="#22c55e" />
        <StatCard icon={XCircle} label="Declined" value={stats.declined} color="#ef4444" />
        <StatCard icon={HelpCircle} label="Maybe" value={stats.maybe} color="#f59e0b" />
        <StatCard icon={Users} label="Total Guests" value={stats.totalGuests} color="#0ea5e9" />
      </div>

      {/* Hotel Breakdown */}
      <HotelBreakdown rsvps={rsvps} />

      {/* Filter + Export */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5" data-testid="rsvp-filters">
          {(["all", "yes", "no", "maybe", "pending"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid={`filter-${status}`}
            >
              {status === "all" ? "All" : STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => exportToCSV(filteredRsvps)}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          data-testid="export-csv"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      {filteredRsvps.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-12"
          data-testid="rsvp-empty"
        >
          <Users className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No RSVPs yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" data-testid="rsvp-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-start font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="inline-flex items-center gap-1"
                    data-testid="sort-name"
                  >
                    Name <SortIcon column="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort("attending")}
                    className="inline-flex items-center gap-1"
                    data-testid="sort-attending"
                  >
                    Status <SortIcon column="attending" />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-start font-medium sm:table-cell">
                  <button
                    type="button"
                    onClick={() => handleSort("plus_ones")}
                    className="inline-flex items-center gap-1"
                    data-testid="sort-plus-ones"
                  >
                    +Ones <SortIcon column="plus_ones" />
                  </button>
                </th>
                <th className="hidden px-4 py-3 text-start font-medium md:table-cell">Email</th>
                <th className="hidden px-4 py-3 text-start font-medium lg:table-cell">Meal</th>
                <th className="px-4 py-3 text-start font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort("submitted_at")}
                    className="inline-flex items-center gap-1"
                    data-testid="sort-date"
                  >
                    Date <SortIcon column="submitted_at" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRsvps.map((rsvp) => (
                <tr
                  key={rsvp.id}
                  className="border-b transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === rsvp.id ? null : rsvp.id)}
                  data-testid={`rsvp-row-${rsvp.id}`}
                >
                  <td className="px-4 py-3 font-medium">{rsvp.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={rsvp.attending} />
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{rsvp.plus_ones}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{rsvp.email ?? "—"}</td>
                  <td className="hidden px-4 py-3 lg:table-cell">{rsvp.meal_preference ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(rsvp.submitted_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expanded Detail */}
      {expandedId && (
        <div
          className="rounded-xl border p-4 text-sm"
          data-testid="rsvp-detail"
        >
          {(() => {
            const rsvp = rsvps.find((r) => r.id === expandedId)
            if (!rsvp) return null
            return (
              <div className="grid gap-2 sm:grid-cols-2">
                <div><strong>Name:</strong> {rsvp.name}</div>
                <div><strong>Email:</strong> {rsvp.email ?? "—"}</div>
                <div><strong>Phone:</strong> {rsvp.phone ?? "—"}</div>
                <div><strong>Status:</strong> <StatusBadge status={rsvp.attending} /></div>
                <div><strong>Plus Ones:</strong> {rsvp.plus_ones}</div>
                <div><strong>Meal:</strong> {rsvp.meal_preference ?? "—"}</div>
                <div><strong>Dietary Notes:</strong> {rsvp.dietary_notes ?? "—"}</div>
                <div><strong>Hotel:</strong> {rsvp.hotel_choice ?? "—"}</div>
                {rsvp.message && (
                  <div className="sm:col-span-2">
                    <strong>Message:</strong> {rsvp.message}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
