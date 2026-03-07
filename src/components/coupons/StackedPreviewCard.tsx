"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Gift } from "lucide-react"

interface StackedPreviewCardProps {
  count: number
  label?: string
  className?: string
  onClick?: () => void
}

export function StackedPreviewCard({
  count,
  label = "gifts waiting",
  className,
  onClick,
}: StackedPreviewCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn("relative w-full h-32", className)}
    >
      {/* Back card */}
      <div className="absolute inset-x-4 top-0 h-full rounded-2xl bg-[var(--bg-soft-cream,#F5EDE3)] border border-[var(--border-subtle)] rotate-[-2deg] shadow-warm-sm" />

      {/* Middle card */}
      <div className="absolute inset-x-2 top-1 h-full rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] border border-[var(--border-subtle)] rotate-[1deg] shadow-warm-md" />

      {/* Front card */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className="relative h-full rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] border border-[var(--border-subtle)] shadow-warm-lg flex flex-col items-center justify-center gap-2"
      >
        <Gift
          size={24}
          className="text-[var(--accent-copper,#B87333)]"
          strokeWidth={1.75}
        />
        <div className="text-center">
          <p className="text-[24px] font-display font-bold text-[var(--accent-copper,#B87333)]">
            {count}
          </p>
          <p className="text-[12px] text-[var(--text-secondary,#8C8279)] font-nav">
            {label}
          </p>
        </div>
      </motion.div>
    </button>
  )
}
