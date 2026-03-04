"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useDailyBonus } from "@/lib/hooks/use-daily-bonus"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const AUTO_DISMISS_MS = 3000

export function DailyBonusToast({ className }: { className?: string }) {
  const { justClaimed } = useDailyBonus()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!justClaimed) return

    setVisible(true)

    const timer = setTimeout(() => {
      setVisible(false)
    }, AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [justClaimed])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="daily-bonus-toast"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className={cn(
            "fixed top-4 inset-x-4 z-[60] flex items-center justify-center gap-2",
            "rounded-xl bg-bg-elevated border border-border-subtle",
            "px-4 py-3 shadow-md",
            className
          )}
          style={{
            top: "max(env(safe-area-inset-top, 16px), 16px)",
          }}
        >
          <motion.span
            data-testid="daily-bonus-coin"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.2 }}
            className="text-lg"
            aria-hidden="true"
          >
            🪙
          </motion.span>
          <span className="text-sm font-medium text-text-primary font-body">
            +5 Daily bonus!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
