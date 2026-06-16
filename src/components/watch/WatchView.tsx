"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Star } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * WatchView — the shared watch list (docs/DESIGN_BLUEPRINT.md §4.4). Cinematic,
 * indigo+amber. Status tabs, poster cards with both ratings + agreement.
 * Presentational.
 */
export type WatchItem = {
  id: string
  title: string
  year: number
  kind: "movie" | "show"
  status: "watchlist" | "watching" | "watched"
  mine?: number
  theirs?: number
}

const GRAD: Record<"movie" | "show", string> = {
  movie: "linear-gradient(150deg, #2B2F5E, #5A3B1E)",
  show: "linear-gradient(150deg, #15706F, #2B2F5E)",
}

const TABS: { id: WatchItem["status"]; label: string }[] = [
  { id: "watchlist", label: "Watchlist" },
  { id: "watching", label: "Watching" },
  { id: "watched", label: "Watched" },
]

export function WatchView({
  items,
  partnerName = "Yara",
  onAdd,
}: {
  items: WatchItem[]
  partnerName?: string
  /** Authed page injects the real "add title" flow; preview leaves it undefined (FAB is inert there). */
  onAdd?: () => void
}) {
  const [tab, setTab] = useState<WatchItem["status"]>("watchlist")
  const list = items.filter((i) => i.status === tab)
  const watched = items.filter((i) => i.status === "watched" && i.mine && i.theirs)
  const avg = watched.length ? (watched.reduce((s, i) => s + (i.mine! + i.theirs!) / 2, 0) / watched.length).toFixed(1) : "—"
  const agree = watched.length ? Math.round((watched.filter((i) => Math.abs(i.mine! - i.theirs!) <= 1).length / watched.length) * 100) : 0

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-3">
        <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-indigo)" }}>نشاهد</p>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Watch</h1>
      </header>

      <div className="mb-4 flex gap-2 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>
        <span><b style={{ color: "var(--foreground)" }}>{watched.length}</b> watched</span>
        <span>·</span>
        <span><b style={{ color: "var(--foreground)" }}>{avg}</b> avg</span>
        <span>·</span>
        <span><b style={{ color: "var(--foreground)" }}>{agree}%</b> agree</span>
      </div>

      <div className="pill-tab-group mb-4">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`pill-tab ${tab === t.id ? "pill-tab-active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="grid gap-2.5">
        {list.map((w, i) => (
          <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <PosterCard grain={false} className="flex items-center gap-3 !p-3">
              <span className="grid h-16 w-12 shrink-0 place-items-center rounded-lg text-xl" style={{ background: GRAD[w.kind] }}>
                {w.kind === "movie" ? "🎬" : "📺"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{w.title}</span>
                <span className="block text-[12px] uppercase tracking-wide" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>{w.kind} · {w.year}</span>
                {w.status === "watched" && (
                  <span className="mt-1 flex items-center gap-3 text-[12px]">
                    <Rating who="You" v={w.mine} dot="var(--color-preference-me)" />
                    <Rating who={partnerName} v={w.theirs} dot="var(--color-preference-partner)" />
                  </span>
                )}
              </span>
            </PosterCard>
          </motion.div>
        ))}
      </div>

      <button type="button" onClick={onAdd} className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-glow-copper)" }} aria-label="Add title">
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  )
}

function Rating({ who, v, dot }: { who: string; v?: number; dot: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      <span style={{ color: "var(--color-ink-soft)" }}>{who}</span>
      <Star size={12} fill="var(--color-amber)" stroke="none" />
      <b style={{ color: "var(--foreground)" }}>{v ?? "–"}</b>
    </span>
  )
}

export const WATCH_MOCK: WatchItem[] = [
  { id: "1", title: "Paddington in Peru", year: 2025, kind: "movie", status: "watchlist" },
  { id: "2", title: "The Bear", year: 2024, kind: "show", status: "watching", mine: 9 },
  { id: "3", title: "Past Lives", year: 2023, kind: "movie", status: "watched", mine: 9, theirs: 10 },
  { id: "4", title: "Shōgun", year: 2024, kind: "show", status: "watched", mine: 8, theirs: 9 },
  { id: "5", title: "Dune: Part Two", year: 2024, kind: "movie", status: "watched", mine: 9, theirs: 7 },
]
