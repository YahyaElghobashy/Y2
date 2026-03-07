"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCoupons } from "@/lib/hooks/use-coupons"

type HomeCouponInboxProps = {
  className?: string
}

export function HomeCouponInbox({ className }: HomeCouponInboxProps) {
  const { receivedCoupons, pendingApprovals } = useCoupons()

  const activeCoupons = receivedCoupons.filter(
    (c) => c.status === "active" || c.status === "pending_approval"
  )

  if (activeCoupons.length === 0) return null

  const topCoupon = activeCoupons[0]
  const hasPending = pendingApprovals.length > 0

  return (
    <Link href="/us/coupons" className={cn("block", className)} data-testid="home-coupon-inbox">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="relative"
      >
        {/* Stacked background cards */}
        {activeCoupons.length >= 3 && (
          <div
            className="absolute inset-x-2 top-1 h-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
            style={{ transform: "rotate(-2deg)" }}
          />
        )}
        {activeCoupons.length >= 2 && (
          <div
            className="absolute inset-x-1 top-0.5 h-full rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
            style={{ transform: "rotate(1deg)" }}
          />
        )}

        {/* Front card */}
        <div
          className={cn(
            "relative rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-[0_2px_12px_rgba(44,40,37,0.06)]",
            hasPending && "shadow-[0_0_12px_var(--accent-glow)] animate-pulse"
          )}
        >
          <div className="flex items-center gap-3">
            {topCoupon.emoji && <span className="text-[32px]">{topCoupon.emoji}</span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold font-body text-[var(--text-primary)]">
                {topCoupon.title}
              </p>
              <p className="text-[12px] font-body text-[var(--text-secondary)]">
                {activeCoupons.length === 1
                  ? "1 coupon"
                  : `${activeCoupons.length} coupons`}
              </p>
            </div>
          </div>
        </div>

        {/* Count badge */}
        <div
          className="absolute -end-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-[var(--accent-primary)] px-1.5 py-0.5"
          data-testid="count-badge"
        >
          <span className="text-[11px] font-bold text-white">{activeCoupons.length}</span>
        </div>
      </motion.div>
    </Link>
  )
}
