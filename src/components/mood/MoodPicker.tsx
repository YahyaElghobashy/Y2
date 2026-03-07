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
                animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "rounded-full flex items-center justify-center",
                  "transition-all duration-200",
                  isSelected
                    ? "h-[62px] w-[62px] text-[28px]"
                    : "h-[54px] w-[54px] text-[24px]"
                )}
                style={{
                  backgroundColor: isSelected
                    ? "rgba(184,115,51,0.08)"
                    : "var(--bg-soft-cream, #F5EDE3)",
                  border: isSelected
                    ? "2px solid var(--accent-copper, #B87333)"
                    : "2px solid transparent",
                  boxShadow: isSelected
                    ? "0 2px 12px rgba(184,115,51,0.15)"
                    : "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
                }}
              >
                {MOOD_EMOJI[mood]}
              </motion.button>
              <span
                className="text-[10px] font-body"
                style={{
                  color: isSelected
                    ? "var(--accent-copper, #B87333)"
                    : "var(--text-muted, #B5ADA4)",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
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
              "font-body",
              "focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]"
            )}
          />
        </motion.div>
      )}
    </div>
  )
}
