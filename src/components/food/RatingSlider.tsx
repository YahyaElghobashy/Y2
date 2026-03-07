"use client"

import { useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { GradientSlider } from "@/components/ui/GradientSlider"

interface RatingSliderProps {
  question: string
  stepLabel: string
  stepProgress: number
  onNext: (score: number) => void
  onClose: () => void
  initialScore?: number
}

const SCORE_EMOJIS: { range: [number, number]; emoji: string }[] = [
  { range: [0, 2], emoji: "😕" },
  { range: [2, 4], emoji: "😐" },
  { range: [4, 6], emoji: "🙂" },
  { range: [6, 7.5], emoji: "😋" },
  { range: [7.5, 9], emoji: "🤩" },
  { range: [9, 10], emoji: "🍝" },
]

const SCORE_BADGES: { range: [number, number]; label: string }[] = [
  { range: [0, 3], label: "Below Average" },
  { range: [3, 5], label: "Average" },
  { range: [5, 7], label: "Good" },
  { range: [7, 8.5], label: "Exceptional" },
  { range: [8.5, 10], label: "Divine" },
]

function getEmoji(score: number): string {
  const match = SCORE_EMOJIS.find(
    (e) => score >= e.range[0] && score <= e.range[1]
  )
  return match?.emoji ?? "🍽️"
}

function getBadge(score: number): string {
  const match = SCORE_BADGES.find(
    (b) => score >= b.range[0] && score <= b.range[1]
  )
  return match?.label ?? "Good"
}

export function RatingSlider({
  question,
  stepLabel,
  stepProgress,
  onNext,
  onClose,
  initialScore = 5,
}: RatingSliderProps) {
  const [score, setScore] = useState(initialScore)

  const emoji = useMemo(() => getEmoji(score), [score])
  const badge = useMemo(() => getBadge(score), [score])

  const handleNext = useCallback(() => {
    onNext(score)
  }, [score, onNext])

  return (
    <main
      className="relative flex h-dvh w-full flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg-warm-white, #FFFDF9)" }}
      data-testid="rating-slider"
    >
      {/* Top bar */}
      <header className="flex items-center justify-between p-6">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)] transition-colors"
          data-testid="rating-close-btn"
        >
          <X size={20} className="text-[var(--text-secondary)]" />
        </button>
        <h2 className="text-sm font-bold tracking-widest uppercase text-[var(--text-muted)]">
          Our Table
        </h2>
        <div className="h-10 w-10" />
      </header>

      {/* Content — centered */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-8 text-center"
        style={{ backgroundColor: "rgba(184,115,51,0.03)" }}
      >
        {/* Emoji */}
        <motion.div
          key={emoji}
          className="mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <span className="text-[80px] leading-none drop-shadow-xl">
            {emoji}
          </span>
        </motion.div>

        {/* Question — serif italic */}
        <h1 className="font-display text-4xl font-medium italic tracking-tight text-[var(--text-primary)] mb-6">
          {question}
        </h1>

        {/* Score display */}
        <div className="relative flex items-center justify-center mb-12">
          <motion.span
            key={score}
            className="text-[72px] font-extrabold tracking-tighter text-[var(--text-primary)]"
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
            data-testid="rating-score"
          >
            {score.toFixed(1)}
          </motion.span>
          <motion.div
            key={badge}
            className="absolute -top-4 -end-2 rounded-full px-2 py-1 text-xs font-bold uppercase tracking-tighter text-white"
            style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            data-testid="rating-badge"
          >
            {badge}
          </motion.div>
        </div>

        {/* Slider */}
        <div className="w-full max-w-md px-4">
          <GradientSlider
            value={score}
            onChange={setScore}
            min={0}
            max={10}
            step={0.5}
          />
          {/* Labels */}
          <div className="flex w-full justify-between px-1 mt-4 font-nav text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)]">
            <span>Average</span>
            <span>Good</span>
            <span>Divine</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <footer className="p-8 flex flex-col items-center">
        <motion.button
          className="group relative flex w-full max-w-md items-center justify-center gap-3 rounded-xl py-5 text-xl font-bold text-white shadow-xl"
          style={{
            backgroundColor: "var(--accent-copper, #B87333)",
            boxShadow: "0 4px 14px rgba(184,115,51,0.2)",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          data-testid="rating-next-btn"
        >
          Next
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </motion.button>
        <p className="mt-6 text-sm font-medium text-[var(--text-muted)]">
          {stepLabel}
        </p>
      </footer>

      {/* Progress bar at very bottom */}
      <div
        className="fixed bottom-0 inset-x-0 h-1"
        style={{ backgroundColor: "rgba(184,115,51,0.15)" }}
      >
        <motion.div
          className="h-full"
          style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
          initial={{ width: 0 }}
          animate={{ width: `${stepProgress * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </main>
  )
}
