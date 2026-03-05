"use client"

import { motion } from "framer-motion"
import { REACTION_EMOJIS } from "@/lib/types/snap.types"
import type { ReactionEmoji } from "@/lib/types/snap.types"
import { cn } from "@/lib/utils"

type SnapReactionProps = {
  snapId: string
  currentReaction?: string | null
  onReact: (snapId: string, emoji: ReactionEmoji | null) => void
  className?: string
}

export function SnapReaction({
  snapId,
  currentReaction,
  onReact,
  className,
}: SnapReactionProps) {
  return (
    <div
      data-testid="snap-reaction"
      className={cn("flex items-center gap-2 py-2", className)}
    >
      {REACTION_EMOJIS.map((emoji) => {
        const isSelected = currentReaction === emoji

        return (
          <motion.button
            key={emoji}
            data-testid={`reaction-${emoji}`}
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              if (isSelected) {
                onReact(snapId, null)
              } else {
                onReact(snapId, emoji)
              }
            }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-[16px] transition-all",
              isSelected
                ? "scale-120 ring-2 ring-[var(--color-accent-primary)] bg-[var(--color-accent-soft)]"
                : "opacity-60 hover:opacity-100"
            )}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </motion.button>
        )
      })}
    </div>
  )
}
