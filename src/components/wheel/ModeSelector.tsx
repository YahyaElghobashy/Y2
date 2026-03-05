"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Target, Minus, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WheelMode } from "@/lib/types/wheel.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type ModeSelectorProps = {
  onSelect: (mode: WheelMode, bestOfTarget?: number) => void
  className?: string
}

const MODE_CARDS: {
  mode: WheelMode
  icon: React.ReactNode
  label: string
  description: string
}[] = [
  {
    mode: "selection",
    icon: <Target size={24} />,
    label: "Selection",
    description: "One spin decides it all",
  },
  {
    mode: "elimination",
    icon: <Minus size={24} />,
    label: "Elimination",
    description: "Remove options until one remains",
  },
  {
    mode: "best_of",
    icon: <Trophy size={24} />,
    label: "Best of",
    description: "First to reach the target wins",
  },
]

const BEST_OF_OPTIONS = [3, 5, 7]

export function ModeSelector({ onSelect, className }: ModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<WheelMode | null>(null)
  const [bestOfTarget, setBestOfTarget] = useState(3)

  const handleSelect = (mode: WheelMode) => {
    if (mode === "best_of") {
      setSelectedMode("best_of")
    } else {
      onSelect(mode)
    }
  }

  const handleBestOfConfirm = () => {
    onSelect("best_of", bestOfTarget)
  }

  return (
    <div data-testid="mode-selector" className={cn("flex flex-col gap-3", className)}>
      <h2 className="font-display text-[16px] font-semibold text-[var(--text-primary)]">
        Choose a Mode
      </h2>

      {MODE_CARDS.map((card) => (
        <motion.button
          key={card.mode}
          data-testid={`mode-${card.mode}`}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          onClick={() => handleSelect(card.mode)}
          className={cn(
            "flex items-center gap-4 rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] p-4 text-start shadow-sm transition-colors",
            selectedMode === card.mode && "ring-2 ring-[var(--accent-primary,#C4956A)]"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft,#E8D5C0)] text-[var(--accent-primary,#C4956A)]">
            {card.icon}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">
              {card.label}
            </p>
            <p className="text-[12px] text-[var(--text-muted)]">
              {card.description}
            </p>
          </div>
        </motion.button>
      ))}

      {/* Best-of rounds picker */}
      {selectedMode === "best_of" && (
        <motion.div
          data-testid="best-of-picker"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3 rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] p-4 shadow-sm"
        >
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">
            First to win:
          </p>
          <div className="flex gap-3">
            {BEST_OF_OPTIONS.map((n) => (
              <button
                key={n}
                data-testid={`best-of-${n}`}
                onClick={() => setBestOfTarget(n)}
                className={cn(
                  "flex-1 rounded-xl py-2 text-center text-[14px] font-semibold transition-colors",
                  bestOfTarget === n
                    ? "bg-[var(--accent-primary,#C4956A)] text-white"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <motion.button
            data-testid="best-of-confirm"
            whileTap={{ scale: 0.97 }}
            onClick={handleBestOfConfirm}
            className="mt-1 rounded-xl bg-[var(--accent-primary,#C4956A)] py-2.5 text-[14px] font-medium text-white"
          >
            Start Best of {bestOfTarget}
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
