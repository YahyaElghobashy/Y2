"use client"

import Image from "next/image"
import { motion } from "framer-motion"

/**
 * CouponTicket — a perforated love-coupon (docs/DESIGN_BLUEPRINT.md §5.1).
 * Coral ticket with a torn stub, Display title + handwritten "from". On redeem
 * the REDEEMED stamp thwacks on; the parent fires a Celebration.
 */
export type CouponStatus = "active" | "redeemed" | "pending"

export function CouponTicket({
  title,
  from,
  status,
  onRedeem,
}: {
  title: string
  from: string
  status: CouponStatus
  onRedeem?: () => void
}) {
  const redeemed = status === "redeemed"
  return (
    <motion.div
      whileTap={onRedeem && !redeemed ? { scale: 0.99 } : undefined}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: redeemed ? "var(--color-sand)" : "var(--color-coral)",
        boxShadow: "var(--shadow-warm-md)",
      }}
    >
      {/* torn stub on the left */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-3.5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 0 7px, transparent 4px, var(--background) 4px)",
          backgroundSize: "14px 16px",
          backgroundPosition: "-7px 0",
        }}
      />
      <div className="flex items-center gap-3 py-4 pl-6 pr-4">
        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ fontFamily: "var(--font-nav)", color: redeemed ? "var(--color-ink-soft)" : "#FFE9D8" }}
          >
            Love coupon
          </p>
          <p
            className="mt-1 text-[18px] font-extrabold leading-snug"
            style={{ fontFamily: "var(--font-display)", color: redeemed ? "var(--color-ink)" : "#FFF7EF" }}
          >
            {title}
          </p>
          <p
            className="mt-0.5 text-[18px] leading-none"
            style={{ fontFamily: "var(--font-handwritten)", color: redeemed ? "var(--color-ink-soft)" : "#FFE0CE" }}
          >
            from {from}
          </p>
        </div>

        {!redeemed && onRedeem && (
          <motion.button
            type="button"
            onClick={onRedeem}
            whileTap={{ scale: 0.94 }}
            className="shrink-0 rounded-full px-4 py-2 text-[13px] font-bold"
            style={{ background: "#FFF7EF", color: "var(--color-terracotta)", fontFamily: "var(--font-body)" }}
          >
            Redeem
          </motion.button>
        )}
      </div>

      {redeemed && (
        <motion.div
          aria-hidden
          initial={{ scale: 1.6, opacity: 0, rotate: -4 }}
          animate={{ scale: 1, opacity: 1, rotate: -12 }}
          transition={{ type: "spring", damping: 9, stiffness: 200 }}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          style={{ width: 84, height: 84 }}
        >
          <Image src="/assets/stamps/stamp-redeemed.png" alt="" width={84} height={84} />
        </motion.div>
      )}
    </motion.div>
  )
}
