"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Gift } from "lucide-react"
import { cn } from "@/lib/utils"

type FeelingGenerousCTAProps = {
  className?: string
}

export function FeelingGenerousCTA({ className }: FeelingGenerousCTAProps) {
  return (
    <Link href="/create-coupon" className={cn("block", className)} data-testid="feeling-generous-cta">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-[0_2px_12px_rgba(44,40,37,0.06)]"
      >
        {/* Speech bubble tail */}
        <div
          className="absolute -top-2 start-5 h-4 w-4 bg-[var(--bg-elevated)] border-t border-s border-[var(--border-subtle)]"
          style={{ transform: "rotate(45deg)" }}
        />

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-glow)]">
            <Gift size={20} className="text-[var(--accent-primary)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
              Feeling generous?
            </p>
            <p className="text-[13px] font-[family-name:var(--font-body)] text-[var(--text-secondary)]">
              Create a love coupon for your partner
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
