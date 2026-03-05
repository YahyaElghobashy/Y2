"use client"

import { motion } from "framer-motion"
import { Gift, Lock, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WishlistItem } from "@/lib/types/wishlist.types"

type ClaimBadgeProps = {
  item: WishlistItem
  userId: string
  onClaim: (itemId: string) => void
  onUnclaim: (itemId: string) => void
  onMarkPurchased: (itemId: string) => void
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function ClaimBadge({
  item,
  userId,
  onClaim,
  onUnclaim,
  onMarkPurchased,
  className,
}: ClaimBadgeProps) {
  // State 3: Purchased
  if (item.is_purchased) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium",
          "bg-[var(--color-success)]/10 text-[var(--color-success)]",
          className
        )}
        data-testid="claim-badge-purchased"
      >
        <Check size={14} />
        <span>Purchased</span>
      </div>
    )
  }

  // State 2: Claimed by me
  if (item.claimed_by === userId) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          onClick={() => onUnclaim(item.id)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--color-accent-primary)] px-3 py-1.5 text-[12px] font-medium text-white"
          data-testid="claim-badge-claimed"
        >
          <Lock size={14} />
          <span>Claimed</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          onClick={() => onMarkPurchased(item.id)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--color-success)]/10 px-3 py-1.5 text-[12px] font-medium text-[var(--color-success)]"
          data-testid="claim-badge-mark-purchased"
        >
          <Check size={14} />
          <span>Got it</span>
        </motion.button>
      </div>
    )
  }

  // State 1: Unclaimed
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      onClick={() => onClaim(item.id)}
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium",
        "bg-[var(--color-accent-soft)] text-[var(--color-accent-primary)]",
        className
      )}
      data-testid="claim-badge-unclaimed"
    >
      <Gift size={14} />
      <span>Claim</span>
    </motion.button>
  )
}
