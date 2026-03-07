"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMood } from "@/lib/hooks/use-mood"
import { useAuth } from "@/lib/providers/AuthProvider"
import { MOOD_EMOJI } from "@/lib/types/mood.types"
import type { Mood } from "@/lib/types/mood.types"
import { cn } from "@/lib/utils"

type PartnerMoodIndicatorProps = {
  className?: string
}

export function PartnerMoodIndicator({ className }: PartnerMoodIndicatorProps) {
  const { partnerMood } = useMood()
  const { partner } = useAuth()
  const [showNote, setShowNote] = useState(false)

  if (!partnerMood) return null

  const mood = partnerMood.mood as Mood
  const emoji = MOOD_EMOJI[mood] ?? ""
  const partnerName = partner?.display_name ?? "Partner"
  const hasNote = !!partnerMood.note

  return (
    <div
      data-testid="partner-mood-indicator"
      className={cn("flex flex-col gap-2", className)}
    >
      <div
        role={hasNote ? "button" : undefined}
        tabIndex={hasNote ? 0 : undefined}
        onClick={hasNote ? () => setShowNote((prev) => !prev) : undefined}
        onKeyDown={
          hasNote
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setShowNote((prev) => !prev)
                }
              }
            : undefined
        }
        className={cn(
          "text-[14px] text-[var(--color-text-muted)] font-body",
          hasNote ? "cursor-pointer" : "cursor-default"
        )}
      >
        {partnerName} is feeling {emoji} today
      </div>

      <AnimatePresence>
        {showNote && partnerMood.note && (
          <motion.div
            data-testid="partner-mood-note"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-[var(--color-bg-elevated)] rounded-xl p-3",
              "text-sm text-[var(--color-text-primary)]",
              "font-body"
            )}
          >
            {partnerMood.note}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
