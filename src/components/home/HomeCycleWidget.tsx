"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCycle } from "@/lib/hooks/use-cycle"
import { useAuth } from "@/lib/providers/AuthProvider"
import { CycleInsightCard } from "@/components/health/CycleInsightCard"

export function HomeCycleWidget({ className }: { className?: string }) {
  const { profile } = useAuth()
  const { config, currentDay, phase, isLoading } = useCycle()

  // Only show for admin (Yahya) with active config
  if (isLoading || !config || !phase || profile?.role !== "admin") return null

  const phaseLabel = phase === "active" ? "Active" : "Break"

  return (
    <Link href="/me/body" className="block">
      <motion.div
        className={cn(
          "bg-[var(--color-bg-elevated)] rounded-2xl shadow-soft overflow-hidden",
          className
        )}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
        data-testid="home-cycle-widget"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
            Cycle Tracker
          </span>
          <span className="text-[12px] font-[var(--font-mono)] text-text-muted">
            Day {currentDay} &middot; {phaseLabel}
          </span>
        </div>

        {/* Compact Insight Card */}
        <div className="px-3 pb-3">
          <CycleInsightCard compact />
        </div>
      </motion.div>
    </Link>
  )
}
