"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PingLimitDotsProps {
  total: number
  remaining: number
  className?: string
}

export function PingLimitDots({
  total,
  remaining,
  className,
}: PingLimitDotsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i < remaining
        return (
          <motion.div
            key={i}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              isActive
                ? "bg-[var(--accent-copper,#B87333)]"
                : "bg-[var(--bg-parchment,#E5D9CB)]"
            )}
            animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          />
        )
      })}
    </div>
  )
}
