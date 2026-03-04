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
          "relative w-[140px] shrink-0 rounded-2xl bg-bg-elevated p-3 border border-border-subtle shadow-[0_2px_12px_rgba(44,40,37,0.06)] flex flex-col items-center gap-2",
          className
        )}
        data-testid="marketplace-item-card"
      >
        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft">
          <span className="text-[32px] leading-none" role="img" aria-hidden="true">
            {item.icon}
          </span>
        </div>

        {/* Name */}
        <p className="font-body text-[12px] font-semibold text-text-primary line-clamp-2 text-center w-full">
          {item.name}
        </p>

        {/* Price badge */}
        <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[12px] font-medium text-accent-primary">
          {item.price} &#x1FA99;
        </span>

        {/* Buy button */}
        <motion.button
          type="button"
          onClick={handleBuy}
          disabled={buyState !== "idle"}
          className={cn(
            "h-8 w-full rounded-lg text-[12px] font-medium font-body transition-colors",
            canAfford
              ? "bg-accent-primary text-bg-elevated"
              : "bg-bg-secondary text-text-muted opacity-50 cursor-not-allowed"
          )}
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
              className="absolute inset-0 rounded-2xl bg-accent-primary/20 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              data-testid="buy-success-overlay"
            >
              <Check size={24} className="text-accent-primary" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !canAfford && (
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-text-primary px-2 py-1 text-[11px] font-body text-bg-elevated shadow-md"
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

  // ── Vertical variant ──────────────────────────────────
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-bg-elevated p-5 border border-border-subtle shadow-[0_2px_12px_rgba(44,40,37,0.06)]",
        className
      )}
      data-testid="marketplace-item-card"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft">
          <span className="text-[20px]" role="img" aria-hidden="true">
            {item.icon}
          </span>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <h3 className="font-body text-[15px] font-semibold text-text-primary line-clamp-1">
            {item.name}
          </h3>
          <p className="font-body text-[13px] text-text-secondary line-clamp-2">
            {item.description}
          </p>
        </div>

        {/* Price + Buy */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1 font-mono text-[14px] font-medium text-accent-primary">
            {item.price} &#x1FA99;
          </span>

          <motion.button
            type="button"
            onClick={handleBuy}
            disabled={buyState !== "idle"}
            className={cn(
              "h-10 px-4 rounded-xl text-[13px] font-medium font-body transition-colors",
              canAfford
                ? "bg-accent-primary text-bg-elevated"
                : "bg-bg-secondary text-text-muted opacity-50 cursor-not-allowed"
            )}
            animate={buyState === "pressing" ? { scale: 0.95 } : { scale: 1 }}
            transition={{ duration: 0.1, ease: EASE_OUT }}
            data-testid="buy-button"
          >
            Buy
          </motion.button>
        </div>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {buyState === "success" && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-accent-primary/20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            data-testid="buy-success-overlay"
          >
            <Check size={24} className="text-accent-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !canAfford && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-text-primary px-2 py-1 text-[11px] font-body text-bg-elevated shadow-md"
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
