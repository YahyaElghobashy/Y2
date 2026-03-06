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
        whileTap={{ scale: 0.98 }}
        className="relative rounded-xl perforated-edge bg-white p-4 overflow-hidden"
        style={{
          border: "1px solid rgba(184,115,51,0.08)",
          boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(184,115,51,0.1)" }}
          >
            <Gift size={20} style={{ color: "var(--accent-copper, #B87333)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[18px] font-bold font-[family-name:var(--font-handwritten)]"
              style={{ color: "var(--accent-copper, #B87333)" }}
            >
              Feeling generous?
            </p>
            <p
              className="text-[13px] font-[family-name:var(--font-body)]"
              style={{ color: "var(--text-secondary, #6B6560)" }}
            >
              Create a love coupon for your partner
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
