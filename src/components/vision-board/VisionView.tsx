"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Plus } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"

/**
 * VisionView — the 2026 board (docs/DESIGN_BLUEPRINT.md §6.3). Editorial
 * annual-report meets cork-board; theme hero, Mine/partner tabs, category
 * sections of goals. Presentational.
 */
// `id` is present only in the authed context (real data), where toggling an
// item routes to the real mutation via `onToggleItem`. Preview mocks omit it.
export type VisionItem = { text: string; done: boolean; id?: string }
export type VisionCategory = { name: string; emoji: string; accent: "teal" | "amber" | "coral" | "rose" | "indigo"; items: VisionItem[] }
export type Board = { theme: string; categories: VisionCategory[] }

export function VisionView({
  mine,
  partner,
  partnerName = "Yara",
  activeTab,
  onTabChange,
  onToggleItem,
  onAddGoal,
}: {
  mine: Board
  partner: Board
  partnerName?: string
  /** Controlled tab — when provided, the parent owns tab state (authed page
   *  drives the hook's active board). Falls back to internal state in preview. */
  activeTab?: "mine" | "partner"
  onTabChange?: (tab: "mine" | "partner") => void
  /** Real toggle mutation (authed). Preview leaves it undefined → display-only. */
  onToggleItem?: (itemId: string) => void
  /** Real "add goal" entry point (authed). Preview leaves it undefined → no-op. */
  onAddGoal?: () => void
}) {
  const [internalTab, setInternalTab] = useState<"mine" | "partner">("mine")
  const tab = activeTab ?? internalTab
  const setTab = (next: "mine" | "partner") => {
    setInternalTab(next)
    onTabChange?.(next)
  }
  const board = tab === "mine" ? mine : partner
  const total = board.categories.reduce((s, c) => s + c.items.length, 0)
  const done = board.categories.reduce((s, c) => s + c.items.filter((i) => i.done).length, 0)

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-3">
        <h1 className="text-[40px] font-extrabold leading-none tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>2026</h1>
        <p className="mt-1 text-[16px]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--color-terracotta)" }}>{board.theme}</p>
      </header>

      <div className="pill-tab-group mb-1">
        <button type="button" className={`pill-tab ${tab === "mine" ? "pill-tab-active" : ""}`} onClick={() => setTab("mine")}>Mine</button>
        <button type="button" className={`pill-tab ${tab === "partner" ? "pill-tab-active" : ""}`} onClick={() => setTab("partner")}>{partnerName}&apos;s</button>
      </div>
      <p className="mb-4 mt-2 text-[12px]" style={{ color: "var(--color-ink-soft)" }}>
        <b style={{ color: "var(--foreground)" }}>{done}</b> of {total} so far this year
      </p>

      <div className="grid gap-3">
        {board.categories.map((c, ci) => (
          <motion.div key={c.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: ci * 0.06 }}>
            <PosterCard accent={c.accent} grain={false}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{c.emoji}</span>
                <span className="text-[16px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{c.name}</span>
              </div>
              <ul className="grid gap-1.5">
                {c.items.map((it, i) => {
                  // Toggling is only offered on your own board, with a real id + handler.
                  const canToggle = tab === "mine" && !!onToggleItem && !!it.id
                  const checkbox = (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border" style={{ borderColor: it.done ? "var(--color-teal)" : "var(--border)", background: it.done ? "var(--color-teal)" : "transparent", color: "#FFF7EF" }}>
                      {it.done && <Check size={12} strokeWidth={3} />}
                    </span>
                  )
                  return (
                    <li key={it.id ?? i} className="flex items-center gap-2.5">
                      {canToggle ? (
                        <button
                          type="button"
                          onClick={() => onToggleItem!(it.id!)}
                          aria-label={it.done ? "Mark not done" : "Mark done"}
                          className="shrink-0"
                        >
                          {checkbox}
                        </button>
                      ) : (
                        checkbox
                      )}
                      <span className="text-[14px]" style={{ fontFamily: "var(--font-serif)", color: it.done ? "var(--color-ink-soft)" : "var(--foreground)", textDecoration: it.done ? "line-through" : "none" }}>
                        {it.text}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </PosterCard>
          </motion.div>
        ))}
      </div>

      {tab === "mine" && (
        <button type="button" onClick={onAddGoal} className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-glow-copper)" }} aria-label="Add goal">
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

export const VISION_MINE: Board = {
  theme: "the year we build gently",
  categories: [
    { name: "Us", emoji: "❤️", accent: "coral", items: [{ text: "A trip, just the two of us", done: true }, { text: "Cook through one whole cookbook", done: false }] },
    { name: "Body", emoji: "💪", accent: "teal", items: [{ text: "Reach 85kg", done: false }, { text: "Run the 10k in October", done: false }] },
    { name: "Soul", emoji: "🌙", accent: "amber", items: [{ text: "Finish memorizing Al-Mulk", done: true }, { text: "Fajr in jama'ah, 100 days", done: false }] },
  ],
}
export const VISION_PARTNER: Board = {
  theme: "softer, braver, mine",
  categories: [
    { name: "Career", emoji: "📈", accent: "indigo", items: [{ text: "Submit the PhD chapter", done: true }, { text: "Speak at one conference", done: false }] },
    { name: "Joy", emoji: "🌸", accent: "rose", items: [{ text: "Learn ceramics", done: false }, { text: "Plant a real garden", done: true }] },
  ],
}
