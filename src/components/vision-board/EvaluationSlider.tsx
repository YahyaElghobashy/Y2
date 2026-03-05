"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

type EvaluationSliderProps = {
  label: string
  icon?: string
  value: number
  onChange: (value: number) => void
  note?: string
  onNoteChange?: (note: string) => void
  className?: string
}

export function EvaluationSlider({
  label,
  icon,
  value,
  onChange,
  note,
  onNoteChange,
  className,
}: EvaluationSliderProps) {
  const [showNote, setShowNote] = useState(!!note)

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value, 10))
    },
    [onChange]
  )

  const getScoreColor = (score: number) => {
    if (score <= 3) return "text-[#D97706]" // amber
    if (score <= 6) return "text-[var(--color-text-secondary,#8C8279)]"
    return "text-[var(--accent-primary,#C4956A)]"
  }

  const getScoreLabel = (score: number) => {
    if (score <= 2) return "Needs work"
    if (score <= 4) return "Getting there"
    if (score <= 6) return "On track"
    if (score <= 8) return "Strong"
    return "Excellent"
  }

  return (
    <div className={cn("", className)} data-testid={`eval-slider-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[18px]">{icon}</span>}
          <span className="text-[14px] font-medium text-[var(--color-text-primary,#2C2825)]">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[24px] font-bold tabular-nums", getScoreColor(value))}>
            {value}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted,#B5ADA4)]">
            /10
          </span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={handleSliderChange}
        className={cn(
          "w-full h-2 rounded-full appearance-none cursor-pointer",
          "bg-[var(--color-bg-secondary,#F5F0E8)]",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6",
          "[&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-[var(--accent-primary,#C4956A)]",
          "[&::-webkit-slider-thumb]:shadow-md",
          "[&::-webkit-slider-thumb]:cursor-pointer"
        )}
        data-testid={`slider-input-${label.toLowerCase().replace(/\s+/g, "-")}`}
      />

      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-[var(--color-text-muted,#B5ADA4)]">
          {getScoreLabel(value)}
        </span>
        {onNoteChange && (
          <button
            className="text-[11px] text-[var(--accent-primary,#C4956A)]"
            onClick={() => setShowNote(!showNote)}
            data-testid={`toggle-note-${label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {showNote ? "Hide note" : "+ Note"}
          </button>
        )}
      </div>

      {/* Optional note */}
      {showNote && onNoteChange && (
        <textarea
          value={note ?? ""}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Add a note..."
          maxLength={200}
          rows={2}
          className={cn(
            "w-full mt-2 px-3 py-2 rounded-lg text-[13px] resize-none",
            "bg-[var(--color-bg-secondary,#F5F0E8)]",
            "text-[var(--color-text-primary,#2C2825)]",
            "placeholder:text-[var(--color-text-muted,#B5ADA4)]",
            "outline-none"
          )}
          data-testid={`note-input-${label.toLowerCase().replace(/\s+/g, "-")}`}
        />
      )}
    </div>
  )
}
