"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { usePrayer } from "@/lib/hooks/use-prayer"
import { PRAYER_NAMES } from "@/lib/types/spiritual.types"

export function HomePrayerWidget({ className }: { className?: string }) {
  const { today, completedCount, isLoading } = usePrayer()

  // Don't render while loading or when no data
  if (isLoading || !today) return null

  return (
    <Link href="/me/soul" className="block">
      <motion.div
        className={cn(
          "bg-[var(--color-bg-elevated)] rounded-2xl shadow-soft overflow-hidden px-4 py-4",
          className
        )}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
        data-testid="home-prayer-widget"
      >
        <div className="flex items-center justify-between">
          {/* 5 mini circles */}
          <div className="flex items-center gap-2" data-testid="prayer-circles">
            {PRAYER_NAMES.map((name) => {
              const completed = today[name]
              return (
                <div
                  key={name}
                  className={cn(
                    "w-5 h-5 rounded-full border transition-colors duration-200",
                    completed
                      ? "bg-[var(--accent-primary,#C4956A)] border-[var(--accent-primary,#C4956A)]"
                      : "bg-transparent border-[var(--color-border-subtle,rgba(44,40,37,0.08))]"
                  )}
                  data-testid={`mini-circle-${name}`}
                  data-completed={completed}
                />
              )
            })}
          </div>

          {/* Summary text */}
          <span
            className="text-[12px] text-[var(--color-text-secondary,#8C8279)]"
            data-testid="prayer-summary"
          >
            {completedCount}/5 prayers today
          </span>
        </div>
      </motion.div>
    </Link>
  )
}
