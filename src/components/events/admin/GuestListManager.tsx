"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Users,
  Plus,
  Search,
  Upload,
  Share2,
  Trash2,
  Edit2,
  Check,
  X,
  Mail,
  Phone,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type {
  PortalGuest,
  PortalGuestInsert,
  GuestGroup,
  GUEST_GROUPS,
} from "@/lib/types/portal.types"

type Props = {
  portalId: string
  portalSlug?: string
}

const GROUP_LABELS: Record<GuestGroup, string> = {
  family: "Family",
  friends: "Friends",
  work: "Work",
  vip: "VIP",
  other: "Other",
}

const GROUP_COLORS: Record<GuestGroup, string> = {
  family: "#ef4444",
  friends: "#3b82f6",
  work: "#8b5cf6",
  vip: "#f59e0b",
  other: "#6b7280",
}

// ── Add/Edit Guest Form ──

type GuestFormData = {
  name: string
  email: string
  phone: string
  guest_group: GuestGroup
  notes: string
  plus_ones_allowed: number
}

function GuestForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<GuestFormData>
  onSubmit: (data: GuestFormData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<GuestFormData>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    guest_group: initial?.guest_group ?? "friends",
    notes: initial?.notes ?? "",
    plus_ones_allowed: initial?.plus_ones_allowed ?? 0,
  })

  return (
    <div className="space-y-3 rounded-xl border p-4" data-testid="guest-form">
      <input
        type="text"
        placeholder="Guest name *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        data-testid="guest-name-input"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm"
          data-testid="guest-email-input"
        />
        <input
          type="tel"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm"
          data-testid="guest-phone-input"
        />
      </div>
      <div className="flex items-center gap-3">
        <select
          value={form.guest_group}
          onChange={(e) => setForm({ ...form, guest_group: e.target.value as GuestGroup })}
          className="rounded-lg border px-3 py-2 text-sm"
          data-testid="guest-group-select"
        >
          {(Object.keys(GROUP_LABELS) as GuestGroup[]).map((g) => (
            <option key={g} value={g}>
              {GROUP_LABELS[g]}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">+Ones:</span>
          <input
            type="number"
            min={0}
            max={10}
            value={form.plus_ones_allowed}
            onChange={(e) => setForm({ ...form, plus_ones_allowed: Number(e.target.value) })}
            className="w-16 rounded-lg border px-2 py-2 text-sm"
            data-testid="guest-plus-ones-input"
          />
        </div>
      </div>
      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        rows={2}
        data-testid="guest-notes-input"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={!form.name.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          data-testid="guest-form-submit"
        >
          <Check className="h-3.5 w-3.5" />
          {initial ? "Update" : "Add Guest"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm"
          data-testid="guest-form-cancel"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── CSV Import Parser ──

function parseCSV(text: string): Array<{ name: string; email?: string; phone?: string; group?: string }> {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""))
  const nameIdx = headers.findIndex((h) => h === "name")
  const emailIdx = headers.findIndex((h) => h === "email")
  const phoneIdx = headers.findIndex((h) => h === "phone")
  const groupIdx = headers.findIndex((h) => h === "group" || h === "guest_group")

  if (nameIdx === -1) return []

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""))
    return {
      name: cols[nameIdx] ?? "",
      email: emailIdx >= 0 ? cols[emailIdx] : undefined,
      phone: phoneIdx >= 0 ? cols[phoneIdx] : undefined,
      group: groupIdx >= 0 ? cols[groupIdx] : undefined,
    }
  }).filter((r) => r.name)
}

// ── Main Component ──

export function GuestListManager({ portalId, portalSlug }: Props) {
  const [guests, setGuests] = useState<PortalGuest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState<GuestGroup | "all">("all")
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState("")

  const supabase = useMemo(() => getSupabaseBrowserClient() as any, [])

  // Fetch guests
  useEffect(() => {
    async function fetchGuests() {
      const { data } = await supabase
        .from("portal_guests")
        .select("*")
        .eq("portal_id", portalId)
        .order("name", { ascending: true })

      setGuests((data as PortalGuest[]) ?? [])
      setIsLoading(false)
    }

    fetchGuests()
  }, [portalId, supabase])

  // Add guest
  const addGuest = useCallback(
    async (formData: GuestFormData) => {
      const insert: PortalGuestInsert = {
        portal_id: portalId,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        guest_group: formData.guest_group,
        notes: formData.notes || null,
        plus_ones_allowed: formData.plus_ones_allowed,
      }

      const { data, error } = await supabase.from("portal_guests").insert(insert).select().single()

      if (!error && data) {
        setGuests((prev) => [...prev, data as PortalGuest].sort((a, b) => a.name.localeCompare(b.name)))
        setShowForm(false)
      }
    },
    [portalId, supabase]
  )

  // Update guest
  const updateGuest = useCallback(
    async (id: string, formData: GuestFormData) => {
      const { error } = await supabase
        .from("portal_guests")
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          guest_group: formData.guest_group,
          notes: formData.notes || null,
          plus_ones_allowed: formData.plus_ones_allowed,
        })
        .eq("id", id)

      if (!error) {
        setGuests((prev) =>
          prev
            .map((g) =>
              g.id === id
                ? { ...g, ...formData, email: formData.email || null, phone: formData.phone || null, notes: formData.notes || null }
                : g
            )
            .sort((a, b) => a.name.localeCompare(b.name))
        )
        setEditingId(null)
      }
    },
    [supabase]
  )

  // Delete guest
  const deleteGuest = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("portal_guests").delete().eq("id", id)

      if (!error) {
        setGuests((prev) => prev.filter((g) => g.id !== id))
      }
    },
    [supabase]
  )

  // CSV import
  const handleImport = useCallback(async () => {
    const parsed = parseCSV(importText)
    if (parsed.length === 0) return

    const inserts: PortalGuestInsert[] = parsed.map((r) => ({
      portal_id: portalId,
      name: r.name,
      email: r.email || null,
      phone: r.phone || null,
      guest_group: (r.group as GuestGroup) || "other",
    }))

    const { data, error } = await supabase.from("portal_guests").insert(inserts).select()

    if (!error && data) {
      setGuests((prev) =>
        [...prev, ...(data as PortalGuest[])].sort((a, b) => a.name.localeCompare(b.name))
      )
      setShowImport(false)
      setImportText("")
    }
  }, [importText, portalId, supabase])

  // Share invite via navigator.share
  const shareInvite = useCallback(
    async (guest: PortalGuest) => {
      const url = portalSlug ? `${window.location.origin}/e/${portalSlug}` : ""
      const text = `Hi ${guest.name}, you're invited! View details: ${url}`

      if (navigator.share) {
        await navigator.share({ title: "Event Invitation", text, url })
      } else {
        await navigator.clipboard.writeText(text)
      }
    },
    [portalSlug]
  )

  // Filter + search
  const filteredGuests = useMemo(() => {
    let list = groupFilter === "all" ? guests : guests.filter((g) => g.guest_group === groupFilter)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q) ||
          g.phone?.includes(q)
      )
    }

    return list
  }, [guests, groupFilter, search])

  // Group counts
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: guests.length }
    ;(Object.keys(GROUP_LABELS) as GuestGroup[]).forEach((g) => {
      counts[g] = guests.filter((guest) => guest.guest_group === g).length
    })
    return counts
  }, [guests])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="guest-loading">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="guest-list-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Guest List ({guests.length})
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
            data-testid="import-csv-btn"
          >
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditingId(null) }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            data-testid="add-guest-btn"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Guest
          </button>
        </div>
      </div>

      {/* CSV Import */}
      {showImport && (
        <div className="space-y-2 rounded-xl border p-4" data-testid="csv-import">
          <p className="text-xs text-muted-foreground">
            Paste CSV with headers: name, email, phone, group
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`name,email,phone,group\nJohn Doe,john@test.com,+123,friends`}
            className="w-full rounded-lg border px-3 py-2 text-xs font-mono"
            rows={4}
            data-testid="csv-textarea"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              data-testid="csv-import-submit"
            >
              Import
            </button>
            <button
              type="button"
              onClick={() => { setShowImport(false); setImportText("") }}
              className="rounded-lg border px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && !editingId && (
        <GuestForm
          onSubmit={addGuest}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-2 pe-3 ps-9 text-sm"
            data-testid="guest-search"
          />
        </div>
      </div>

      {/* Group Filter Pills */}
      <div className="flex flex-wrap gap-1.5" data-testid="group-filters">
        <button
          type="button"
          onClick={() => setGroupFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            groupFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
          data-testid="group-filter-all"
        >
          All ({groupCounts.all})
        </button>
        {(Object.keys(GROUP_LABELS) as GuestGroup[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroupFilter(g)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              groupFilter === g
                ? "text-white"
                : "bg-muted text-muted-foreground"
            }`}
            style={groupFilter === g ? { backgroundColor: GROUP_COLORS[g] } : {}}
            data-testid={`group-filter-${g}`}
          >
            {GROUP_LABELS[g]} ({groupCounts[g] ?? 0})
          </button>
        ))}
      </div>

      {/* Guest List */}
      {filteredGuests.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-12"
          data-testid="guest-empty"
        >
          <Users className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {guests.length === 0 ? "No guests added yet" : "No guests match your search"}
          </p>
        </div>
      ) : (
        <div className="space-y-2" data-testid="guest-list">
          {filteredGuests.map((guest) => (
            <div key={guest.id}>
              {editingId === guest.id ? (
                <GuestForm
                  initial={{
                    name: guest.name,
                    email: guest.email ?? "",
                    phone: guest.phone ?? "",
                    guest_group: guest.guest_group,
                    notes: guest.notes ?? "",
                    plus_ones_allowed: guest.plus_ones_allowed,
                  }}
                  onSubmit={(data) => updateGuest(guest.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div
                  className="flex items-center justify-between rounded-xl border px-4 py-3"
                  data-testid={`guest-row-${guest.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: GROUP_COLORS[guest.guest_group] }}
                    >
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{guest.name}</span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${GROUP_COLORS[guest.guest_group]}15`,
                            color: GROUP_COLORS[guest.guest_group],
                          }}
                          data-testid={`guest-group-badge-${guest.id}`}
                        >
                          {GROUP_LABELS[guest.guest_group]}
                        </span>
                        {guest.rsvp_linked && (
                          <span className="text-[10px] text-green-600" data-testid={`guest-rsvp-linked-${guest.id}`}>
                            RSVP linked
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {guest.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {guest.email}
                          </span>
                        )}
                        {guest.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {guest.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => shareInvite(guest)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                      title="Share invite"
                      data-testid={`guest-share-${guest.id}`}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingId(guest.id); setShowForm(false) }}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                      title="Edit"
                      data-testid={`guest-edit-${guest.id}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGuest(guest.id)}
                      className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                      title="Delete"
                      data-testid={`guest-delete-${guest.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
