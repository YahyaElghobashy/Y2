"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface EliminationOption {
  id: string
  label: string
  eliminated: boolean
}

interface EliminationPillsProps {
  options: EliminationOption[]
  className?: string
}

export function EliminationPills({
  options,
  className,
}: EliminationPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <AnimatePresence mode="popLayout">
        {options.map((option) => (
          <motion.span
            key={option.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: option.eliminated ? 0.5 : 1,
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1.5",
              "font-nav text-[13px] transition-colors",
              option.eliminated
                ? "bg-[var(--bg-parchment,#E5D9CB)] text-[var(--text-muted,#B5ADA4)] line-through"
                : "bg-[var(--accent-soft,#E8D5C0)] font-semibold text-[var(--accent-copper,#B87333)]"
            )}
          >
            {option.label}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
