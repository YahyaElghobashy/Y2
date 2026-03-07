"use client"

import { motion } from "framer-motion"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WheelPreset } from "@/lib/types/wheel.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type PresetCardProps = {
  preset: WheelPreset
  onPlay: (id: string) => void
  onDelete: (id: string) => void
  className?: string
}

export function PresetCard({
  preset,
  onPlay,
  onDelete,
  className,
}: PresetCardProps) {
  return (
    <motion.div
      data-testid={`preset-card-${preset.id}`}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      onClick={() => onPlay(preset.id)}
      className={cn(
        "relative cursor-pointer rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] p-4 shadow-warm-md",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[24px]">{preset.icon}</span>
        <button
          data-testid={`delete-preset-${preset.id}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(preset.id)
          }}
          className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">
        {preset.name}
      </p>
      <p className="text-[12px] text-[var(--text-muted)]">
        {preset.items.length} items
      </p>
    </motion.div>
  )
}
