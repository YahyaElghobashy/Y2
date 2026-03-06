"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketplaceItem } from "@/lib/types/marketplace.types"

type MarketplaceItemCardProps = {
  item: MarketplaceItem
  balance: number
  onBuy: (itemId: string) => void
  variant: "horizontal" | "vertical"
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function MarketplaceItemCard({
  item,
  balance,
  onBuy,
  variant,
  className,
}: MarketplaceItemCardProps) {
  const [buyState, setBuyState] = useState<"idle" | "pressing" | "success">("idle")
  const [showTooltip, setShowTooltip] = useState(false)

  const canAfford = balance >= item.price
  const deficit = item.price - balance

  const handleBuy = useCallback(() => {
    if (!canAfford) {
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2000)
      return
    }

    if (buyState !== "idle") return

    setBuyState("pressing")
    setTimeout(() => {
      onBuy(item.id)
      setBuyState("success")
      setTimeout(() => setBuyState("idle"), 400)
    }, 100)
  }, [canAfford, buyState, onBuy, item.id])

  if (variant === "horizontal") {
    return (
      <div
        className={cn(
          "relative w-[140px] shrink-0 rounded-xl bg-white p-3 flex flex-col items-center gap-2",
          className
        )}
        style={{
          border: "1px solid rgba(184,115,51,0.06)",
          boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
        }}
        data-testid="marketplace-item-card"
      >
        {/* Icon in colored circle */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(184,115,51,0.08)" }}
        >
          <span className="text-[28px] leading-none" role="img" aria-hidden="true">
            {item.icon}
          </span>
        </div>

        {/* Name */}
        <p className="font-[family-name:var(--font-body)] text-[12px] font-semibold text-[var(--text-primary)] line-clamp-2 text-center w-full">
          {item.name}
        </p>

        {/* Copper price pill */}
        <span
          className="rounded-full px-2 py-0.5 font-[family-name:var(--font-mono)] text-[11px] font-bold"
          style={{
            backgroundColor: "rgba(184,115,51,0.1)",
            color: "var(--accent-copper, #B87333)",
          }}
        >
          {item.price} 🪙
        </span>

        {/* Buy button */}
        <motion.button
          type="button"
          onClick={handleBuy}
          disabled={buyState !== "idle"}
          className="h-8 w-full rounded-lg text-[12px] font-medium font-[family-name:var(--font-body)] transition-colors text-white"
          style={{
            backgroundColor: canAfford ? "var(--accent-copper, #B87333)" : "var(--text-muted, #B5ADA4)",
            opacity: canAfford ? 1 : 0.5,
          }}
          animate={buyState === "pressing" ? { scale: 0.95 } : { scale: 1 }}
          transition={{ duration: 0.1, ease: EASE_OUT }}
          data-testid="buy-button"
        >
          Buy
        </motion.button>

        {/* Success overlay */}
        <AnimatePresence>
          {buyState === "success" && (
            <motion.div
              className="absolute inset-0 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(184,115,51,0.15)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              data-testid="buy-success-overlay"
            >
              <Check size={24} style={{ color: "var(--accent-copper, #B87333)" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !canAfford && (
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-[family-name:var(--font-body)] text-white shadow-md"
              style={{ backgroundColor: "var(--text-primary, #2C2825)" }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              data-testid="need-more-tooltip"
            >
              Need {deficit} more
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Vertical variant (grid card for marketplace page) ──────────────────
  return (
    <div
      className={cn(
        "relative rounded-xl bg-white p-4 flex flex-col items-center gap-2",
        className
      )}
      style={{
        border: "1px solid rgba(184,115,51,0.06)",
        boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
      }}
      data-testid="marketplace-item-card"
    >
      {/* Icon in colored circle */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(184,115,51,0.08)" }}
      >
        <span className="text-[32px]" role="img" aria-hidden="true">
          {item.icon}
        </span>
      </div>

      {/* Name */}
      <h3 className="font-[family-name:var(--font-display)] text-[13px] font-bold text-[var(--text-primary)] line-clamp-2 text-center w-full">
        {item.name}
      </h3>

      {/* Description */}
      {item.description && (
        <p className="font-[family-name:var(--font-body)] text-[11px] text-[var(--text-secondary)] line-clamp-2 text-center">
          {item.description}
        </p>
      )}

      {/* Copper price pill */}
      <span
        className="rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[12px] font-bold"
        style={{
          backgroundColor: "rgba(184,115,51,0.1)",
          color: "var(--accent-copper, #B87333)",
        }}
      >
        {item.price} 🪙
      </span>

      {/* Buy button */}
      <motion.button
        type="button"
        onClick={handleBuy}
        disabled={buyState !== "idle"}
        className="h-9 w-full rounded-lg text-[13px] font-medium font-[family-name:var(--font-body)] transition-colors text-white"
        style={{
          backgroundColor: canAfford ? "var(--accent-copper, #B87333)" : "var(--text-muted, #B5ADA4)",
          opacity: canAfford ? 1 : 0.5,
          boxShadow: canAfford ? "0 2px 8px rgba(184,115,51,0.2)" : "none",
        }}
        animate={buyState === "pressing" ? { scale: 0.95 } : { scale: 1 }}
        transition={{ duration: 0.1, ease: EASE_OUT }}
        data-testid="buy-button"
      >
        Buy
      </motion.button>

      {/* Success overlay */}
      <AnimatePresence>
        {buyState === "success" && (
          <motion.div
            className="absolute inset-0 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(184,115,51,0.15)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            data-testid="buy-success-overlay"
          >
            <Check size={24} style={{ color: "var(--accent-copper, #B87333)" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !canAfford && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-[family-name:var(--font-body)] text-white shadow-md"
            style={{ backgroundColor: "var(--text-primary, #2C2825)" }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            data-testid="need-more-tooltip"
          >
            Need {deficit} more
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Loading Skeleton ──────────────────────────────────────
type MarketplaceItemCardSkeletonProps = {
  variant: "horizontal" | "vertical"
}

export function MarketplaceItemCardSkeleton({ variant }: MarketplaceItemCardSkeletonProps) {
  if (variant === "horizontal") {
    return (
      <div
        className="w-[140px] shrink-0 rounded-2xl bg-bg-secondary animate-pulse p-3 flex flex-col items-center gap-2"
        data-testid="marketplace-skeleton"
      >
        <div className="h-10 w-10 rounded-full bg-bg-primary/70" />
        <div className="h-3 w-[80%] rounded bg-bg-primary/70" />
        <div className="h-2.5 w-[50%] rounded bg-bg-primary/70" />
        <div className="h-8 w-full rounded-lg bg-bg-primary/70" />
      </div>
    )
  }

  return (
    <div
      className="w-full rounded-2xl bg-bg-secondary animate-pulse p-5"
      data-testid="marketplace-skeleton"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-bg-primary/70 shrink-0" />
        <div className="flex-1">
          <div className="h-3.5 w-[60%] rounded bg-bg-primary/70" />
          <div className="h-2.5 w-[40%] rounded bg-bg-primary/70 mt-2" />
        </div>
        <div className="h-10 w-16 rounded-xl bg-bg-primary/70 shrink-0" />
      </div>
    </div>
  )
}
