"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Gift } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { Coin } from "@/components/shared/Coin"

/**
 * WishlistView — things you're dreaming of (docs/DESIGN_BLUEPRINT.md §5.4). Warm
 * catalog, rose+amber, Mine / Partner's tabs, claim on theirs. Presentational.
 */
type Priority = "someday" | "soon" | "dying-for"
const PRIORITY: Record<Priority, { label: string; color: string }> = {
  someday: { label: "someday", color: "var(--color-sage)" },
  soon: { label: "soon", color: "var(--color-amber)" },
  "dying-for": { label: "dying for it", color: "var(--color-coral)" },
}

export type WishItem = { id: string; title: string; price?: number; priority: Priority; claimed?: boolean }

export function WishlistView({ mine, partner, partnerName = "Yara" }: { mine: WishItem[]; partner: WishItem[]; partnerName?: string }) {
  const [tab, setTab] = useState<"mine" | "partner">("mine")
  const [claimed, setClaimed] = useState<Record<string, boolean>>({})
  const list = tab === "mine" ? mine : partner

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4">
        <p className="text-[19px] leading-none" style={{ fontFamily: "var(--font-arabic)", color: "var(--color-dusty-rose)" }}>أمنيات</p>
        <h1 className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>Wishlist</h1>
      </header>

      <div className="pill-tab-group mb-4">
        <button type="button" className={`pill-tab ${tab === "mine" ? "pill-tab-active" : ""}`} onClick={() => setTab("mine")}>Mine</button>
        <button type="button" className={`pill-tab ${tab === "partner" ? "pill-tab-active" : ""}`} onClick={() => setTab("partner")}>{partnerName}&apos;s</button>
      </div>

      <div className="grid gap-2.5">
        {list.map((w, i) => {
          const isClaimed = w.claimed || claimed[w.id]
          return (
            <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <PosterCard grain={false} className="flex items-center gap-3 !p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--color-sand)", color: PRIORITY[w.priority].color }}>
                  <Gift size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{w.title}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-[12px]">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: `${PRIORITY[w.priority].color}22`, color: PRIORITY[w.priority].color, fontFamily: "var(--font-nav)" }}>
                      {PRIORITY[w.priority].label}
                    </span>
                    {w.price !== undefined && <Coin amount={w.price} size={15} />}
                  </span>
                </span>
                {tab === "partner" && (
                  <button
                    type="button"
                    onClick={() => setClaimed((c) => ({ ...c, [w.id]: !c[w.id] }))}
                    className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold"
                    style={{
                      background: isClaimed ? "var(--color-sage)" : "var(--color-coral)",
                      color: "#FFF7EF",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {isClaimed ? "Claimed ✓" : "I'll get it"}
                  </button>
                )}
              </PosterCard>
            </motion.div>
          )
        })}
      </div>

      <button type="button" className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--color-terracotta)", color: "#FFF7EF", boxShadow: "var(--shadow-glow-copper)" }} aria-label="Add wish">
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export const WISHLIST_MINE: WishItem[] = [
  { id: "1", title: "That film camera we saw", price: 220, priority: "dying-for" },
  { id: "2", title: "A weekend in Siwa", priority: "soon" },
  { id: "3", title: "The good olive oil", price: 12, priority: "someday" },
]
export const WISHLIST_PARTNER: WishItem[] = [
  { id: "4", title: "Ceramics class, together", price: 60, priority: "soon" },
  { id: "5", title: "The jasmine perfume", price: 45, priority: "dying-for" },
  { id: "6", title: "New running shoes", price: 90, priority: "someday", claimed: true },
]
