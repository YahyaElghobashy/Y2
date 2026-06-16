"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Pencil, Trash2, X } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { Coin } from "@/components/shared/Coin"
import {
  EFFECT_TYPES,
  type EffectType,
  type EffectConfig,
  type MarketplaceItem,
  type MarketplaceItemInput,
} from "@/lib/types/marketplace.types"
import { validateEffectConfig } from "@/lib/hooks/use-marketplace-admin"

/**
 * MarketplaceAdminView — manage the CoYYns shop catalogue. Lists every item
 * (active + deactivated), filterable by effect type and searchable by name.
 * Create / edit via a bottom sheet, deactivate (soft) or delete (hard). All
 * mutations are injected as OPTIONAL CALLBACKS — when omitted the view mutates
 * its own local copy so the /preview gallery works with no auth.
 */

const ACCENTS: PosterCardAccent[] = ["teal", "indigo", "amber", "coral", "terracotta", "rose"]
type PosterCardAccent = "terracotta" | "amber" | "coral" | "teal" | "indigo" | "rose"

type FilterValue = "all" | EffectType

const EMPTY_FORM: MarketplaceItemInput = {
  name: "",
  description: "",
  price: 10,
  icon: "✦",
  effect_type: "extra_ping",
  effect_config: {},
  is_active: true,
  sort_order: 0,
}

function defaultConfigFor(type: EffectType): EffectConfig {
  switch (type) {
    case "extra_ping":
      return { extra_sends: 1 }
    case "veto":
      return { requires_input: true, input_prompt: "" }
    case "task_order":
      return { deadline_hours: 24, task_description: "" }
    case "dnd_timer":
      return { duration_minutes: 60 }
    case "wildcard":
      return { negotiable: true, requires_input: true, input_prompt: "" }
  }
}

export type MarketplaceAdminViewProps = {
  items: MarketplaceItem[]
  /** Authed: persist a new item. Preview: undefined → local demo insert. */
  onCreate?: (input: MarketplaceItemInput) => Promise<unknown> | void
  /** Authed: persist an edit. Preview: undefined → local demo update. */
  onUpdate?: (id: string, input: Partial<MarketplaceItemInput>) => Promise<unknown> | void
  /** Authed: flip is_active. Preview: undefined → local demo toggle. */
  onToggleActive?: (id: string, isActive: boolean) => Promise<unknown> | void
  /** Authed: hard delete. Preview: undefined → local demo remove. */
  onDelete?: (id: string) => Promise<unknown> | void
  backHref?: string
}

export function MarketplaceAdminView({
  items,
  onCreate,
  onUpdate,
  onToggleActive,
  onDelete,
}: MarketplaceAdminViewProps) {
  const [localItems, setLocalItems] = useState<MarketplaceItem[]>(items)
  const [filter, setFilter] = useState<FilterValue>("all")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<MarketplaceItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<MarketplaceItemInput>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  // List-level action errors (toggle/delete) — shown as a banner because the
  // form sheet is closed when those run.
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Stay in sync with the authoritative source (the hook) when it re-renders.
  useEffect(() => {
    setLocalItems(items)
  }, [items])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return localItems.filter((it) => {
      const matchesType = filter === "all" || it.effect_type === filter
      const matchesTerm =
        term === "" ||
        it.name.toLowerCase().includes(term) ||
        it.description.toLowerCase().includes(term)
      return matchesType && matchesTerm
    })
  }, [localItems, filter, search])

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: localItems.length }
    for (const e of EFFECT_TYPES) map[e.value] = 0
    for (const it of localItems) map[it.effect_type] = (map[it.effect_type] ?? 0) + 1
    return map
  }, [localItems])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, effect_config: defaultConfigFor("extra_ping"), sort_order: localItems.length + 1 })
    setFormError(null)
    setCreating(true)
  }

  const openEdit = (item: MarketplaceItem) => {
    const effectType = item.effect_type as EffectType
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      icon: item.icon,
      effect_type: effectType,
      // Materialize the type's default numeric fields so what the form shows
      // matches what is validated/saved (existing values win over defaults).
      effect_config: { ...defaultConfigFor(effectType), ...((item.effect_config ?? {}) as EffectConfig) },
      is_active: item.is_active,
      sort_order: item.sort_order,
    })
    setFormError(null)
    setEditing(item)
  }

  const closeSheet = () => {
    setCreating(false)
    setEditing(null)
    setFormError(null)
  }

  const validate = (f: MarketplaceItemInput): string | null => {
    if (f.name.trim() === "") return "Name is required"
    if (!Number.isInteger(f.price) || f.price <= 0)
      return "Price must be a whole number greater than 0"
    if (!Number.isInteger(f.sort_order)) return "Sort order must be a whole number"
    if (f.icon.trim() === "") return "Icon is required"
    return validateEffectConfig(f.effect_type, f.effect_config)
  }

  const submit = async () => {
    const invalid = validate(form)
    if (invalid) {
      setFormError(invalid)
      return
    }
    setBusy(true)
    try {
      if (editing) {
        if (onUpdate) {
          await onUpdate(editing.id, form)
        } else {
          setLocalItems((prev) =>
            prev
              .map((it) => (it.id === editing.id ? { ...it, ...form, effect_config: form.effect_config } : it))
              .sort((a, b) => a.sort_order - b.sort_order),
          )
        }
      } else {
        if (onCreate) {
          await onCreate(form)
        } else {
          const demo: MarketplaceItem = {
            id: `demo-${localItems.length + 1}-${form.name}`,
            name: form.name,
            description: form.description,
            price: form.price,
            icon: form.icon,
            effect_type: form.effect_type,
            effect_config: form.effect_config,
            is_active: form.is_active,
            sort_order: form.sort_order,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          }
          setLocalItems((prev) => [...prev, demo].sort((a, b) => a.sort_order - b.sort_order))
        }
      }
      closeSheet()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (item: MarketplaceItem) => {
    const next = !item.is_active
    if (onToggleActive) {
      try {
        setActionError(null)
        await onToggleActive(item.id, next)
      } catch (err) {
        // Surface the failure instead of a silent no-op / unhandled rejection.
        setActionError(err instanceof Error ? err.message : "Failed to update status")
      }
    } else {
      setLocalItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_active: next } : it)))
    }
  }

  const remove = async (item: MarketplaceItem) => {
    if (onDelete) {
      try {
        setActionError(null)
        await onDelete(item.id)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Failed to delete")
      }
    } else {
      setLocalItems((prev) => prev.filter((it) => it.id !== item.id))
    }
  }

  const sheetOpen = creating || editing !== null

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }} data-testid="marketplace-admin">
      <header className="mb-4">
        <h1 className="text-[28px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
          Manage Items
        </h1>
        <p className="mt-0.5 text-[14px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>
          {localItems.length} items · {localItems.filter((i) => i.is_active).length} active
        </p>
      </header>

      {/* List-level action error (toggle / delete failures) */}
      {actionError && (
        <button
          type="button"
          onClick={() => setActionError(null)}
          data-testid="admin-action-error"
          className="mb-3 block w-full rounded-xl px-3 py-2 text-start text-[13px] font-semibold"
          style={{ background: "var(--color-coral)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}
        >
          {actionError} · tap to dismiss
        </button>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute inset-y-0 my-auto ms-3" style={{ color: "var(--color-ink-soft)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          aria-label="Search items"
          data-testid="admin-search"
          className="w-full rounded-full py-2.5 ps-9 pe-4 text-[14px] outline-none"
          style={{ background: "var(--color-sand)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}
        />
      </div>

      {/* Effect-type filter chips */}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by effect type">
        <FilterChip label="All" count={counts.all} active={filter === "all"} onClick={() => setFilter("all")} testId="filter-all" />
        {EFFECT_TYPES.map((e) => (
          <FilterChip
            key={e.value}
            label={`${e.emoji} ${e.label}`}
            count={counts[e.value] ?? 0}
            active={filter === e.value}
            onClick={() => setFilter(e.value)}
            testId={`filter-${e.value}`}
          />
        ))}
      </div>

      {/* Item list */}
      {visible.length === 0 ? (
        <p className="mt-12 text-center text-[14px]" style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-serif)" }} data-testid="admin-empty">
          No items match.
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="admin-item-list">
          {visible.map((item, i) => (
            <li key={item.id}>
              <PosterCard accent={ACCENTS[i % ACCENTS.length]} grain={false} className="!p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: "var(--color-sand)" }}>
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                        {item.name}
                      </p>
                      {!item.is_active && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "var(--color-clay)", color: "#FFF7EF" }} data-testid={`badge-inactive-${item.id}`}>
                          Off
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12px]" style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-body)" }}>
                      {item.description}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Coin amount={item.price} size={15} />
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--color-sand)", color: "var(--color-ink-soft)", fontFamily: "var(--font-nav)" }}>
                        {item.effect_type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    data-testid={`edit-${item.id}`}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold"
                    style={{ background: "var(--color-sand)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    data-testid={`toggle-${item.id}`}
                    aria-pressed={item.is_active}
                    className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                    style={{
                      background: item.is_active ? "var(--color-terracotta)" : "var(--color-clay)",
                      color: "#FFF7EF",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {item.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    data-testid={`delete-${item.id}`}
                    aria-label={`Delete ${item.name}`}
                    className="ms-auto grid h-8 w-8 place-items-center rounded-full"
                    style={{ background: "var(--color-sand)", color: "var(--color-coral)" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </PosterCard>
            </li>
          ))}
        </ul>
      )}

      {/* Add FAB */}
      <button
        type="button"
        onClick={openCreate}
        data-testid="admin-add"
        aria-label="Add item"
        className="fixed bottom-24 right-5 z-[80] grid h-14 w-14 place-items-center rounded-full"
        style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-warm-xl)" }}
      >
        <Plus size={26} />
      </button>

      {/* Create / Edit sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div className="fixed inset-0 z-[90] bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSheet} />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[100] mx-auto max-h-[88dvh] max-w-[430px] overflow-y-auto rounded-t-[28px] p-6 pb-10"
              style={{ background: "var(--card)", boxShadow: "var(--shadow-warm-xl)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              data-testid="admin-sheet"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[18px] font-extrabold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                  {editing ? "Edit item" : "New item"}
                </p>
                <button type="button" onClick={closeSheet} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--color-sand)" }}>
                  <X size={16} style={{ color: "var(--foreground)" }} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <Field label="Name">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    data-testid="form-name"
                    className="form-input"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    data-testid="form-description"
                    rows={2}
                    style={inputStyle}
                    className="resize-none"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price">
                    <input
                      type="number"
                      min={1}
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                      data-testid="form-price"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Icon">
                    <input
                      type="text"
                      value={form.icon}
                      onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                      data-testid="form-icon"
                      maxLength={4}
                      style={inputStyle}
                    />
                  </Field>
                </div>

                <Field label="Effect type">
                  <div className="flex flex-wrap gap-2" data-testid="form-effect-type">
                    {EFFECT_TYPES.map((e) => (
                      <button
                        key={e.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            effect_type: e.value,
                            effect_config: defaultConfigFor(e.value),
                          }))
                        }
                        data-testid={`form-effect-${e.value}`}
                        aria-pressed={form.effect_type === e.value}
                        className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                        style={{
                          background: form.effect_type === e.value ? "var(--color-terracotta)" : "var(--color-sand)",
                          color: form.effect_type === e.value ? "#FFF7EF" : "var(--foreground)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {e.emoji} {e.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <EffectConfigFields type={form.effect_type} config={form.effect_config} onChange={(cfg) => setForm((f) => ({ ...f, effect_config: cfg }))} />

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Sort order">
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                      data-testid="form-sort"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Active">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                      data-testid="form-active"
                      aria-pressed={form.is_active}
                      className="w-full rounded-xl py-2.5 text-[13px] font-bold"
                      style={{
                        background: form.is_active ? "var(--color-terracotta)" : "var(--color-sand)",
                        color: form.is_active ? "#FFF7EF" : "var(--color-ink-soft)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {form.is_active ? "Active" : "Inactive"}
                    </button>
                  </Field>
                </div>

                {formError && (
                  <p className="text-[13px] font-semibold" style={{ color: "var(--color-coral)", fontFamily: "var(--font-body)" }} data-testid="form-error">
                    {formError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  data-testid="form-submit"
                  className="mt-2 rounded-full py-3 text-[15px] font-bold disabled:opacity-50"
                  style={{ background: "var(--color-coral)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}
                >
                  {busy ? "Saving…" : editing ? "Save changes" : "Create item"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  background: "var(--color-sand)",
  color: "var(--foreground)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  padding: "10px 12px",
  outline: "none",
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-nav)" }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  testId,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  testId: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      data-testid={testId}
      className="rounded-full px-3 py-1.5 text-[12px] font-bold"
      style={{
        background: active ? "var(--color-terracotta)" : "var(--color-sand)",
        color: active ? "#FFF7EF" : "var(--color-ink-soft)",
        fontFamily: "var(--font-body)",
      }}
    >
      {label} <span style={{ opacity: 0.7 }}>{count}</span>
    </button>
  )
}

function EffectConfigFields({
  type,
  config,
  onChange,
}: {
  type: EffectType
  config: EffectConfig
  onChange: (cfg: EffectConfig) => void
}) {
  const set = (patch: Partial<EffectConfig>) => onChange({ ...config, ...patch })

  if (type === "extra_ping") {
    return (
      <Field label="Extra sends">
        <input type="number" min={1} value={config.extra_sends ?? 1} onChange={(e) => set({ extra_sends: Number(e.target.value) })} data-testid="cfg-extra_sends" style={inputStyle} />
      </Field>
    )
  }
  if (type === "dnd_timer") {
    return (
      <Field label="Duration (minutes)">
        <input type="number" min={1} value={config.duration_minutes ?? 60} onChange={(e) => set({ duration_minutes: Number(e.target.value) })} data-testid="cfg-duration_minutes" style={inputStyle} />
      </Field>
    )
  }
  if (type === "task_order") {
    return (
      <>
        <Field label="Deadline (hours)">
          <input type="number" min={1} value={config.deadline_hours ?? 24} onChange={(e) => set({ deadline_hours: Number(e.target.value) })} data-testid="cfg-deadline_hours" style={inputStyle} />
        </Field>
        <Field label="Task description">
          <input type="text" value={config.task_description ?? ""} onChange={(e) => set({ task_description: e.target.value })} data-testid="cfg-task_description" style={inputStyle} />
        </Field>
      </>
    )
  }
  // veto + wildcard both take an input prompt
  return (
    <Field label="Input prompt">
      <input type="text" value={config.input_prompt ?? ""} onChange={(e) => set({ input_prompt: e.target.value, requires_input: true })} data-testid="cfg-input_prompt" style={inputStyle} />
    </Field>
  )
}
