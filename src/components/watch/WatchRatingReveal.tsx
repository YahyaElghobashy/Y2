"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { WatchRating } from "@/lib/types/watch.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type WatchRatingRevealProps = {
  myRating: WatchRating
  partnerRating: WatchRating
  className?: string
}

export function WatchRatingReveal({
  myRating,
  partnerRating,
  className,
}: WatchRatingRevealProps) {
  const diff = Math.abs(myRating.score - partnerRating.score)
  const isMatch = diff <= 1

  return (
    <div
      data-testid="watch-rating-reveal"
      className={cn("flex flex-col gap-3", className)}
    >
      {/* Scores */}
      <div className="flex items-center justify-between gap-4">
        {/* My score from left */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="flex flex-1 flex-col items-center gap-1"
          data-testid="my-score"
        >
          <span className="text-[12px] font-medium text-[var(--text-muted)]">
            You
          </span>
          <span className="font-display text-[28px] font-bold text-[var(--text-primary)]">
            {myRating.score}
          </span>
          {myRating.reaction && (
            <p className="mt-1 max-w-[120px] text-center text-[12px] text-[var(--text-secondary)]">
              {myRating.reaction}
            </p>
          )}
        </motion.div>

        {/* Divider */}
        <div className="h-12 w-px bg-[var(--border-subtle)]" />

        {/* Partner score from right */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.15 }}
          className="flex flex-1 flex-col items-center gap-1"
          data-testid="partner-score"
        >
          <span className="text-[12px] font-medium text-[var(--text-muted)]">
            Partner
          </span>
          <span className="font-display text-[28px] font-bold text-[var(--text-primary)]">
            {partnerRating.score}
          </span>
          {partnerRating.reaction && (
            <p className="mt-1 max-w-[120px] text-center text-[12px] text-[var(--text-secondary)]">
              {partnerRating.reaction}
            </p>
          )}
        </motion.div>
      </div>

      {/* Match/diverge message */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.4 }}
        data-testid="match-message"
        className={cn(
          "text-center text-[13px] font-medium",
          isMatch
            ? "text-[var(--color-success,#7CB67C)]"
            : "text-[var(--text-secondary)]"
        )}
      >
        {isMatch ? "You agree! 🎉" : "You diverge 🤔"}
      </motion.p>
    </div>
  )
}
