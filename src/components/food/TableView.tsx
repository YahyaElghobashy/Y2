"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, MapPin, List as ListIcon } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * TableView — the food journal (docs/DESIGN_BLUEPRINT.md §4.5). Warm travelogue,
 * sepia. Map/List toggle, cuisine filters, visit cards with score + visit #.
 * Presentational (map is a placeholder here; Leaflet wires in the real page).
 */
export type Visit = { id: string; place: string; cuisine: string; score: number; date: string; visitNo: number }

const ORD = ["", "1st", "2nd", "3rd", "4th", "5th"]

export function TableView({
  visits,
  onAdd,
}: {
  visits: Visit[]
  /** Authed page injects the real "log a visit" flow; preview leaves it undefined (FAB is inert there). */
  onAdd?: () => void
}) {
  const [view, setView] = useState<"list" | "map">("list")
  const cuisines = ["All", ...Array.from(new Set(visits.map((v) => v.cuisine)))]
  const [cuisine, setCuisine] = useState("All")
  const list = visits.filter((v) => cuisine === "All" || v.cuisine === cuisine)
  const avg = (visits.reduce((s, v) => s + v.score, 0) / visits.length).toFixed(1)

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-3">
        <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-terracotta)" }}>طاولتنا</p>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Our Table</h1>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12px]" style={{ color: "var(--color-ink-soft)" }}>
          <b style={{ color: "var(--foreground)" }}>{visits.length}</b> places · <b style={{ color: "var(--foreground)" }}>{cuisines.length - 1}</b> cuisines · <b style={{ color: "var(--foreground)" }}>{avg}</b> avg
        </span>
        <div className="pill-tab-group" style={{ width: "auto" }}>
          <button type="button" className={`pill-tab ${view === "list" ? "pill-tab-active" : ""}`} style={{ flex: "none", padding: "6px 12px" }} onClick={() => setView("list")}><ListIcon size={15} /></button>
          <button type="button" className={`pill-tab ${view === "map" ? "pill-tab-active" : ""}`} style={{ flex: "none", padding: "6px 12px" }} onClick={() => setView("map")}><MapPin size={15} /></button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cuisines.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCuisine(c)}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold"
            style={{
              fontFamily: "var(--font-nav)",
              background: cuisine === c ? "var(--color-terracotta)" : "var(--color-sand)",
              color: cuisine === c ? "#FFF7EF" : "var(--color-ink-soft)",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {view === "map" ? (
        <div className="grid h-[300px] place-items-center rounded-2xl border" style={{ background: "linear-gradient(160deg, #EBDDC7, #E4CDAE)", borderColor: "var(--border)", boxShadow: "var(--shadow-warm-md)" }}>
          <span className="text-center" style={{ color: "var(--color-ink-soft)" }}>
            <MapPin size={28} className="mx-auto mb-2" />
            <span className="text-[13px]" style={{ fontFamily: "var(--font-serif)" }}>your map of places, pinned</span>
          </span>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {list.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
              <PosterCard grain={false} className="flex items-center gap-3 !p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl" style={{ background: "var(--color-sand)" }}>🍽️</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{v.place}</span>
                  <span className="block text-[12px]" style={{ color: "var(--color-ink-soft)" }}>{v.cuisine} · {ORD[v.visitNo] ?? `${v.visitNo}th`} visit · {v.date}</span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="text-[22px] font-extrabold leading-none tabular-nums" style={{ fontFamily: "var(--font-display)", color: v.score >= 8 ? "var(--color-teal-deep)" : "var(--foreground)" }}>{v.score}</span>
                  <span className="text-[10px] uppercase tracking-wide" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-faint)" }}>/ 10</span>
                </span>
              </PosterCard>
            </motion.div>
          ))}
        </div>
      )}

      <button type="button" onClick={onAdd} className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-glow-copper)" }} aria-label="Log a visit">
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export const TABLE_MOCK: Visit[] = [
  { id: "1", place: "Zooba", cuisine: "Egyptian", score: 9, date: "Jun 12", visitNo: 3 },
  { id: "2", place: "Eish + Malh", cuisine: "Italian", score: 8, date: "Jun 5", visitNo: 1 },
  { id: "3", place: "Kazoku", cuisine: "Japanese", score: 9, date: "May 28", visitNo: 2 },
  { id: "4", place: "Sachi", cuisine: "Asian", score: 7, date: "May 14", visitNo: 1 },
  { id: "5", place: "Abou Tarek", cuisine: "Egyptian", score: 10, date: "Apr 30", visitNo: 4 },
]
