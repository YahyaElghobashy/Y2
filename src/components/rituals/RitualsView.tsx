"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Plus, PenLine } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * RitualsView — the habit journal (docs/DESIGN_BLUEPRINT.md §7.3). Cadence
 * groups of warm ritual cards (tap to log), partner status, and the monthly
 * letter CTA into Keepsake. Sage+amber. Presentational.
 */
export type Ritual = { id: string; emoji: string; title: string; streak: number; shared: boolean; doneByPartner?: boolean }
export type RitualGroup = { cadence: string; items: Ritual[] }

function RitualRow({ r }: { r: Ritual }) {
  const [done, setDone] = useState(false)
  return (
    <PosterCard grain={false} className="flex items-center gap-3 !p-3.5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl" style={{ background: "var(--color-sand)" }}>{r.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{r.title}</span>
        <span className="mt-0.5 flex items-center gap-2 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>
          <span>🔥 {r.streak + (done ? 1 : 0)}</span>
          {r.shared && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.doneByPartner ? "var(--color-teal)" : "var(--color-clay)" }} />
              {r.doneByPartner ? "Yara done" : "Yara pending"}
            </span>
          )}
        </span>
      </span>
      <motion.button
        type="button"
        onClick={() => setDone((d) => !d)}
        whileTap={{ scale: 0.88 }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors"
        style={{
          borderColor: done ? "var(--color-sage)" : "var(--border)",
          background: done ? "var(--color-sage)" : "transparent",
          color: done ? "#FFF7EF" : "var(--color-ink-soft)",
        }}
        aria-pressed={done}
      >
        <Check size={18} strokeWidth={2.6} />
      </motion.button>
    </PosterCard>
  )
}

export function RitualsView({ groups }: { groups: RitualGroup[] }) {
  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4">
        <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-sage)" }}>طقوس</p>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Rituals</h1>
      </header>

      {/* Monthly letter CTA */}
      <Link href="/keepsake/letters">
        <PosterCard accent="rose" interactive className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: "var(--color-sand)", color: "var(--color-dusty-rose)" }}>
            <PenLine size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Write Yara a letter</span>
            <span className="block text-[13px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>this month&apos;s, sealed by hand</span>
          </span>
        </PosterCard>
      </Link>

      {groups.map((g) => (
        <section key={g.cadence} className="mb-5">
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-ink-soft)" }}>{g.cadence}</h2>
          <div className="grid gap-2.5">
            {g.items.map((r) => <RitualRow key={r.id} r={r} />)}
          </div>
        </section>
      ))}

      <button
        type="button"
        className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full"
        style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-glow-copper)" }}
        aria-label="Create ritual"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export const RITUALS_MOCK: RitualGroup[] = [
  {
    cadence: "Daily",
    items: [
      { id: "1", emoji: "🤲", title: "Morning du'a", streak: 23, shared: false },
      { id: "2", emoji: "☕", title: "Coffee together", streak: 12, shared: true, doneByPartner: true },
      { id: "3", emoji: "📝", title: "One gratitude", streak: 6, shared: false },
    ],
  },
  {
    cadence: "Weekly",
    items: [
      { id: "4", emoji: "🌙", title: "Date night", streak: 4, shared: true, doneByPartner: false },
      { id: "5", emoji: "💬", title: "The real check-in", streak: 7, shared: true, doneByPartner: true },
    ],
  },
  {
    cadence: "Monthly",
    items: [
      { id: "6", emoji: "🎯", title: "Review our 2026", streak: 2, shared: true, doneByPartner: false },
    ],
  },
]
