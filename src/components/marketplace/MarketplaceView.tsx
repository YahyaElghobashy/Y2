"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SlidersHorizontal } from "lucide-react"
import { PosterCard } from "@/components/shared/PosterCard"
import { Coin } from "@/components/shared/Coin"
import { Celebration } from "@/components/shared/Celebration"

/**
 * MarketplaceView — the CoYYns shop (docs/DESIGN_BLUEPRINT.md §5.2). Poster-stall
 * item grid → buy opens a confirm sheet → confirming deducts + fires a quiet
 * Celebration ("sent to your love"). Presentational; real purchase lifecycle is
 * wired in the functional pass.
 */
export type MarketItem = {
  id: string
  title: string
  price: number
  emoji: string
  accent: "terracotta" | "amber" | "coral" | "teal" | "indigo" | "rose"
}

export function MarketplaceView({
  items,
  initialBalance,
  partnerName = "Yara",
  onBuy,
  onManage,
  topSlot,
  bottomSlot,
}: {
  items: MarketItem[]
  initialBalance: number
  partnerName?: string
  /** Authed: open the real purchase modal. Preview: undefined → demo sheet. */
  onBuy?: (id: string) => void
  /** Authed: open the item-admin screen. Preview: undefined → button hidden. */
  onManage?: () => void
  /** Authed: active-purchase cards rendered above the grid. */
  topSlot?: React.ReactNode
  /** Authed: purchase history rendered below the grid. */
  bottomSlot?: React.ReactNode
}) {
  const [balance, setBalance] = useState(initialBalance)
  const [confirming, setConfirming] = useState<MarketItem | null>(null)
  const [celebrate, setCelebrate] = useState<{ open: boolean; title: string }>({ open: false, title: "" })

  const buy = (item: MarketItem) => {
    if (balance < item.price) return
    setBalance((b) => b - item.price)
    setConfirming(null)
    setCelebrate({ open: true, title: item.title })
  }

  return (
    <div className="skin-aware min-h-[100dvh] px-5 pb-28 pt-6" style={{ background: "var(--background)" }}>
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Marketplace
          </h1>
          <p className="mt-0.5 text-[15px]" style={{ fontFamily: "var(--font-serif)", color: "var(--color-ink-soft)" }}>
            Spend CoYYns on each other.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onManage && (
            <button
              type="button"
              onClick={onManage}
              aria-label="Manage items"
              data-testid="marketplace-manage"
              className="grid h-9 w-9 place-items-center rounded-full"
              style={{ background: "var(--color-sand)", color: "var(--foreground)" }}
            >
              <SlidersHorizontal size={17} />
            </button>
          )}
          <span className="rounded-full px-3 py-1.5" style={{ background: "var(--color-sand)" }}>
            <Coin amount={balance} size={22} />
          </span>
        </div>
      </header>

      {topSlot}

      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => {
          const afford = balance >= item.price
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }}>
              <PosterCard accent={item.accent} grain={false} className="flex h-full flex-col !p-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: "var(--color-sand)" }}>
                  {item.emoji}
                </span>
                <p className="mt-2.5 flex-1 text-[14px] font-bold leading-snug" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                  {item.title}
                </p>
                <button
                  type="button"
                  disabled={!afford}
                  onClick={() => (onBuy ? onBuy(item.id) : setConfirming(item))}
                  className="mt-3 flex items-center justify-center gap-1 rounded-full py-2 text-[13px] font-bold disabled:opacity-45"
                  style={{ background: afford ? "var(--color-terracotta)" : "var(--color-clay)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}
                >
                  <Coin amount={item.price} size={16} />
                </button>
              </PosterCard>
            </motion.div>
          )
        })}
      </div>

      {bottomSlot}

      {/* Confirm sheet */}
      <AnimatePresence>
        {confirming && (
          <>
            <motion.div className="fixed inset-0 z-[90] bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirming(null)} />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[100] mx-auto max-w-[430px] rounded-t-[28px] p-6 pb-10"
              style={{ background: "var(--card)", boxShadow: "var(--shadow-warm-xl)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
            >
              <span className="mx-auto mb-4 block h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />
              <p className="text-center text-[12px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}>
                Send to {partnerName}?
              </p>
              <p className="mt-2 text-center text-[22px] font-extrabold leading-snug" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                {confirming.title}
              </p>
              <div className="mt-2 flex justify-center">
                <Coin amount={confirming.price} size={26} label="from your pot" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setConfirming(null)} className="rounded-full py-3 text-[14px] font-bold" style={{ background: "var(--color-sand)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}>
                  Not yet
                </button>
                <button type="button" onClick={() => buy(confirming)} className="rounded-full py-3 text-[14px] font-bold" style={{ background: "var(--color-coral)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}>
                  Send it ✦
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Celebration open={celebrate.open} tone="quiet" title="On its way ✦" subtitle={`"${celebrate.title}" — sent to ${partnerName}`} onDone={() => setCelebrate((s) => ({ ...s, open: false }))} />
    </div>
  )
}

export const MARKET_MOCK: MarketItem[] = [
  { id: "1", title: "Skip one chore", price: 50, emoji: "🧹", accent: "teal" },
  { id: "2", title: "I pick the movie", price: 30, emoji: "🎬", accent: "indigo" },
  { id: "3", title: "Breakfast in bed", price: 80, emoji: "🍳", accent: "amber" },
  { id: "4", title: "One extra ping", price: 10, emoji: "💬", accent: "coral" },
  { id: "5", title: "Veto one plan", price: 60, emoji: "✋", accent: "terracotta" },
  { id: "6", title: "A wildcard wish", price: 100, emoji: "✨", accent: "rose" },
]
