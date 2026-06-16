"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { TrendingDown, TrendingUp, Minus, Plus, Trash2 } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { computeWeightTrend } from "@/lib/utils/weight-trend"
import type { WeightLog } from "@/lib/types/health.types"

/**
 * FitnessView — real weight tracking for Me·Body (docs/DESIGN_BLUEPRINT.md §7.1).
 * Presentational: fed weight history + callbacks. Mutations route through OPTIONAL
 * callbacks that default to no-ops, so /preview renders with mock data and never
 * touches Supabase. Token-styled throughout (no hardcoded colours).
 */

export type FitnessViewProps = {
  history: WeightLog[]
  /** Target weight in kg for the progress hero (handover: 85kg). */
  goalKg?: number
  isLoading?: boolean
  /** Real mutation — defaults to a no-op so /preview stays inert. */
  onLog?: (input: { weightKg: number; loggedAt: string; note?: string }) => void | Promise<void>
  /** Real mutation — defaults to a no-op so /preview stays inert. */
  onDelete?: (id: string) => void | Promise<void>
}

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })
}

function formatDate(iso: string): string {
  // iso is YYYY-MM-DD; render as e.g. "16 Jun"
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
}

export function FitnessView({
  history,
  goalKg = 85,
  isLoading = false,
  onLog,
  onDelete,
}: FitnessViewProps) {
  const trend = useMemo(() => computeWeightTrend(history), [history])
  const latest = trend.latest

  const [weight, setWeight] = useState("")
  const [date, setDate] = useState(todayISO())
  const [submitting, setSubmitting] = useState(false)

  // Oldest entry acts as the "start" baseline for goal progress.
  const sortedAsc = useMemo(
    () => [...history].sort((a, b) => (a.logged_at < b.logged_at ? -1 : 1)),
    [history],
  )
  const startKg = sortedAsc[0]?.weight_kg ?? null

  const goalPct = useMemo(() => {
    if (latest == null || startKg == null) return null
    const span = startKg - goalKg
    if (span === 0) return 100
    return Math.round(((startKg - latest.weight_kg) / span) * 100)
  }, [latest, startKg, goalKg])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = Number(weight)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 999.99) return
    setSubmitting(true)
    try {
      await onLog?.({ weightKg: parsed, loggedAt: date || todayISO() })
      setWeight("")
      setDate(todayISO())
    } finally {
      setSubmitting(false)
    }
  }

  const DirIcon =
    trend.direction === "down" ? TrendingDown : trend.direction === "up" ? TrendingUp : Minus
  // For weight loss, "down" is the encouraging direction → teal; "up" → terracotta.
  const dirColor =
    trend.direction === "down"
      ? "var(--color-teal)"
      : trend.direction === "up"
        ? "var(--color-terracotta)"
        : "var(--color-ink-soft)"

  return (
    <section aria-label="Fitness" className="mt-6">
      <h2
        className="mb-2 text-[17px] font-bold tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
      >
        {latest ? `Toward ${goalKg}kg` : "Fitness"}
      </h2>

      {/* ── Hero: latest weight + goal progress + trend ── */}
      {latest ? (
        <PosterCard accent="teal" grain={false}>
          <div className="flex items-end justify-between">
            <span
              className="text-[34px] font-extrabold leading-none"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              {latest.weight_kg}
              <span className="text-[15px] font-medium" style={{ color: "var(--color-ink-soft)" }}>
                {" "}
                kg
              </span>
            </span>

            {trend.deltaSinceLast != null && (
              <span
                className="flex items-center gap-1 text-[13px] font-semibold"
                style={{ color: dirColor }}
              >
                <DirIcon size={15} strokeWidth={2} aria-hidden />
                {trend.deltaSinceLast > 0 ? "+" : ""}
                {trend.deltaSinceLast} kg
              </span>
            )}
          </div>

          {goalPct != null && (
            <>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[12px]" style={{ color: "var(--color-ink-soft)" }}>
                  {goalPct}% there
                </span>
                <span className="text-[12px]" style={{ color: "var(--color-ink-soft)" }}>
                  goal {goalKg} kg
                </span>
              </div>
              <div
                className="mt-1.5 h-2.5 overflow-hidden rounded-full"
                style={{ background: "var(--color-sand)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--color-teal)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, Math.min(100, goalPct))}%` }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
            </>
          )}

          {/* sparkline */}
          {sortedAsc.length >= 2 && <Sparkline points={sortedAsc.map((w) => w.weight_kg)} />}
        </PosterCard>
      ) : (
        <PosterCard accent="teal" grain={false}>
          <p
            className="text-[15px] font-bold leading-snug"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            {isLoading ? "Loading your journey…" : "Log your first weight"}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--color-ink-soft)" }}>
            A gentle place to follow the journey toward {goalKg} kg.
          </p>
        </PosterCard>
      )}

      {/* ── Quick add ── */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2" aria-label="Log weight">
        <label className="flex flex-1 flex-col gap-1">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
          >
            Weight (kg)
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            max="999.99"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.0"
            aria-label="Weight in kilograms"
            className="h-11 rounded-[14px] px-3 text-[16px] outline-none"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--foreground)",
              fontFamily: "var(--font-mono)",
            }}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}
          >
            Date
          </span>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="h-11 rounded-[14px] px-3 text-[15px] outline-none"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--foreground)",
            }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting || weight.trim() === ""}
          aria-label="Add weight entry"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] disabled:opacity-40"
          style={{ background: "var(--color-teal)", color: "var(--color-primary-foreground)" }}
        >
          <Plus size={20} strokeWidth={2.25} aria-hidden />
        </button>
      </form>

      {/* ── History ── */}
      {history.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5" aria-label="Weight history">
          {trend.latest != null &&
            [...history]
              .sort((a, b) => (a.logged_at < b.logged_at ? 1 : -1))
              .map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between rounded-[14px] px-3.5 py-2.5"
                  style={{ background: "var(--color-card)", border: "1px solid var(--color-border-subtle)" }}
                >
                  <span className="text-[13px]" style={{ color: "var(--color-ink-soft)" }}>
                    {formatDate(entry.logged_at)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[16px] font-semibold tabular-nums"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
                    >
                      {entry.weight_kg} kg
                    </span>
                    <button
                      type="button"
                      onClick={() => onDelete?.(entry.id)}
                      aria-label={`Delete entry from ${formatDate(entry.logged_at)}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ color: "var(--color-ink-soft)" }}
                    >
                      <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
        </ul>
      )}
    </section>
  )
}

/** Minimal token-styled SVG sparkline — values ascending (oldest → newest). */
function Sparkline({ points }: { points: number[] }) {
  const W = 100
  const H = 28
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const step = points.length > 1 ? W / (points.length - 1) : 0
  const coords = points.map((v, i) => {
    const x = i * step
    const y = H - ((v - min) / span) * H
    return [x, y] as const
  })
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const last = coords[coords.length - 1]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="mt-4 h-9 w-full"
      role="img"
      aria-label="Weight trend sparkline"
    >
      <path d={path} fill="none" stroke="var(--color-teal)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r={2} fill="var(--color-teal)" />}
    </svg>
  )
}

/** Mock history for /preview — newest first, plausible cut toward 85kg. */
export const FITNESS_MOCK: WeightLog[] = [
  { id: "w-6", user_id: "demo", weight_kg: 90.4, logged_at: "2026-06-14", note: null, created_at: "2026-06-14T07:00:00Z" },
  { id: "w-5", user_id: "demo", weight_kg: 91.0, logged_at: "2026-06-07", note: null, created_at: "2026-06-07T07:00:00Z" },
  { id: "w-4", user_id: "demo", weight_kg: 91.8, logged_at: "2026-05-31", note: null, created_at: "2026-05-31T07:00:00Z" },
  { id: "w-3", user_id: "demo", weight_kg: 93.2, logged_at: "2026-05-24", note: null, created_at: "2026-05-24T07:00:00Z" },
  { id: "w-2", user_id: "demo", weight_kg: 94.5, logged_at: "2026-05-17", note: null, created_at: "2026-05-17T07:00:00Z" },
  { id: "w-1", user_id: "demo", weight_kg: 96.1, logged_at: "2026-05-10", note: null, created_at: "2026-05-10T07:00:00Z" },
]
