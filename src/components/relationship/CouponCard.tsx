"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Coupon } from "@/lib/types/relationship.types"

type CouponCardProps = {
  coupon: Coupon
  onPress?: () => void
  compact?: boolean
  className?: string
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  romantic: { bg: "bg-pink-100", text: "text-pink-700" },
  practical: { bg: "bg-blue-100", text: "text-blue-700" },
  fun: { bg: "bg-yellow-100", text: "text-yellow-700" },
  food: { bg: "bg-green-100", text: "text-green-700" },
  general: { bg: "bg-gray-100", text: "text-gray-600" },
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-[var(--success)]",
  pending_approval: "bg-[var(--warning)]",
  redeemed: "bg-accent-primary",
  rejected: "bg-[var(--error)]",
  expired: "bg-[var(--text-muted)]",
}

export function CouponCard({ coupon, onPress, compact = false, className }: CouponCardProps) {
  const { user } = useAuth()

  const isCreator = user?.id === coupon.creator_id
  const creatorLabel = isCreator ? "You" : "Partner"
  const isSurpriseHidden = coupon.is_surprise && !coupon.surprise_revealed

  const categoryStyle = CATEGORY_COLORS[coupon.category] ?? CATEGORY_COLORS.general
  const statusColor = STATUS_COLORS[coupon.status] ?? STATUS_COLORS.active

  return (
    <motion.button
      type="button"
      onClick={onPress}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-full text-start rounded-[var(--radius-card)] border border-border-subtle bg-bg-elevated border-s-2 border-s-dashed border-s-accent-soft",
        compact ? "p-3" : "p-4",
        !onPress && "cursor-default",
        className
      )}
      disabled={!onPress}
      data-testid="coupon-card"
    >
      {/* Surprise guard */}
      {isSurpriseHidden ? (
        <div className="flex flex-col items-center justify-center py-4" data-testid="coupon-surprise">
          <p className="text-[14px] font-medium font-[var(--font-body)] text-text-secondary blur-sm select-none">
            Hidden Surprise
          </p>
          <p className="mt-1 text-[12px] font-[var(--font-body)] text-accent-primary">
            Tap to reveal
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          {/* Emoji */}
          {coupon.emoji && (
            <span className={cn("leading-none", compact ? "text-[24px]" : "text-[40px]")}>
              {coupon.emoji}
            </span>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {/* Title row */}
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  "font-semibold font-[var(--font-body)] text-text-primary truncate",
                  compact ? "text-[14px]" : "text-[15px]"
                )}
                data-testid="coupon-title"
              >
                {coupon.title}
              </h4>
              {/* Status dot */}
              <span
                className={cn("inline-block h-2 w-2 shrink-0 rounded-full", statusColor)}
                data-testid="coupon-status-dot"
              />
            </div>

            {/* Description (not in compact mode) */}
            {!compact && coupon.description && (
              <p
                className="text-[13px] font-[var(--font-body)] text-text-secondary line-clamp-2"
                data-testid="coupon-description"
              >
                {coupon.description}
              </p>
            )}

            {/* Footer: category + creator */}
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium font-[var(--font-body)]",
                  categoryStyle.bg,
                  categoryStyle.text
                )}
                data-testid="coupon-category"
              >
                {coupon.category}
              </span>
              <span className="text-[11px] font-[var(--font-body)] text-text-muted">
                by {creatorLabel}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.button>
  )
}
