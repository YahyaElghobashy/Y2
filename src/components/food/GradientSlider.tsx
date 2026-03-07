"use client"

import { useCallback, useRef } from "react"
import { cn } from "@/lib/utils"

type GradientSliderProps = {
  value: number
  onChange: (value: number) => void
  variant?: "standard" | "vibe"
  label?: string
  className?: string
}

export function GradientSlider({
  value,
  onChange,
  variant = "standard",
  label,
  className,
}: GradientSliderProps) {
  const sliderRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const snapped = Math.round(Number(e.target.value))
      onChange(snapped)
      // Haptic feedback on snap
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10)
      }
    },
    [onChange]
  )

  // Calculate thumb position percentage for score display
  const pct = ((value - 1) / 9) * 100

  const gradientFrom = variant === "vibe" ? "#E85D75" : "#B5ADA4"
  const gradientTo = "#C4956A"

  return (
    <div data-testid="gradient-slider" className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">
          {label}
        </span>
      )}

      {/* Score display above slider */}
      <div className="relative h-6 mb-1">
        <span
          data-testid="slider-score"
          className="absolute -translate-x-1/2 text-[18px] font-bold font-display text-[var(--accent-primary,#C4956A)]"
          style={{ left: `calc(${pct}% + ${(50 - pct) * 0.2}px)` }}
        >
          {value}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative">
        <input
          ref={sliderRef}
          data-testid="slider-input"
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={handleChange}
          className="gradient-slider w-full"
          style={
            {
              "--gradient-from": gradientFrom,
              "--gradient-to": gradientTo,
              "--slider-pct": `${pct}%`,
            } as React.CSSProperties
          }
        />
      </div>

      {/* Min/max labels */}
      <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
        <span>1</span>
        <span>10</span>
      </div>

      <style jsx>{`
        .gradient-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(
            to right,
            var(--gradient-from),
            var(--gradient-to)
          );
          outline: none;
        }
        .gradient-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          border: 3px solid var(--gradient-to);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          cursor: pointer;
        }
        .gradient-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          border: 3px solid var(--gradient-to);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
