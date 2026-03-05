"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useMood } from "@/lib/hooks/use-mood"
import { MOODS, MOOD_EMOJI, MOOD_LABELS } from "@/lib/types/mood.types"
import type { Mood } from "@/lib/types/mood.types"
import { cn } from "@/lib/utils"

type MoodPickerProps = {
  className?: string
}

export function MoodPicker({ className }: MoodPickerProps) {
  const { todayMood, isLoading, setMood } = useMood()
  const [showNote, setShowNote] = useState(false)
  const [noteText, setNoteText] = useState("")

  if (isLoading) return null

  const selectedMood = todayMood?.mood as Mood | undefined

  const handleMoodSelect = async (mood: Mood) => {
    // If already selected, do nothing
    if (selectedMood === mood) return

    await setMood(mood)

    // Show note input after first selection
    if (!showNote) {
      setShowNote(true)
    }
  }

  const handleNoteSubmit = async () => {
    if (!noteText.trim() || !selectedMood) return
    await setMood(selectedMood, noteText.trim())
  }

  return (
    <div data-testid="mood-picker" className={cn("flex flex-col items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood
          return (
            <div key={mood} className="flex flex-col items-center gap-1">
              <motion.button
                type="button"
                data-testid={`mood-button-${mood}`}
                whileTap={{ scale: 0.9 }}
                animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center text-lg",
                  "transition-colors duration-200",
                  isSelected
                    ? "bg-[var(--color-accent-primary)]"
                    : "bg-[var(--color-bg-secondary)]"
                )}
              >
                {MOOD_EMOJI[mood]}
              </motion.button>
              <span className="text-[10px] text-[var(--color-text-muted)] font-[family-name:var(--font-body)]">
                {MOOD_LABELS[mood]}
              </span>
            </div>
          )
        })}
      </div>

      {showNote && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xs"
        >
          <textarea
            data-testid="mood-note-input"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value.slice(0, 100))}
            onBlur={handleNoteSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleNoteSubmit()
              }
            }}
            placeholder="Add a note (optional)"
            maxLength={100}
            rows={2}
            className={cn(
              "w-full rounded-xl px-3 py-2 text-sm resize-none",
              "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]",
              "placeholder:text-[var(--color-text-muted)]",
              "border border-[var(--color-border-subtle)]",
              "font-[family-name:var(--font-body)]",
              "focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]"
            )}
          />
        </motion.div>
      )}
    </div>
  )
}
