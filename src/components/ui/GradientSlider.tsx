"use client"

import { useCallback, useRef } from "react"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { cn } from "@/lib/utils"

type SliderPalette = "standard" | "vibe"

interface GradientSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  palette?: SliderPalette
  className?: string
}

const paletteGradients: Record<SliderPalette, string> = {
  standard: "linear-gradient(90deg, #D1D5DB 0%, rgba(218,165,32,0.5) 50%, #B87333 100%)",
  vibe: "linear-gradient(90deg, #F4A8B8 0%, rgba(218,165,32,0.5) 50%, #B87333 100%)",
}

export function GradientSlider({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.5,
  palette = "standard",
  className,
}: GradientSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const trackWidth = useRef(0)

  // Compute percentage position of current value
  const percentage = ((value - min) / (max - min)) * 100

  // Scale for thumb (stays constant, just for visual feel)
  const scale = useTransform(x, [-5, 0, 5], [0.95, 1, 0.95])

  const snapToStep = useCallback(
    (raw: number) => {
      const snapped = Math.round(raw / step) * step
      return Math.max(min, Math.min(max, Number(snapped.toFixed(1))))
    },
    [min, max, step]
  )

  const handlePan = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      trackWidth.current = rect.width

      const rawX = info.point.x - rect.left
      const pct = Math.max(0, Math.min(1, rawX / rect.width))
      const rawValue = min + pct * (max - min)
      const snapped = snapToStep(rawValue)

      if (snapped !== value) {
        onChange(snapped)
        // Haptic feedback on snap
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(5)
        }
      }
    },
    [min, max, value, onChange, snapToStep]
  )

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const rawValue = min + pct * (max - min)
      onChange(snapToStep(rawValue))
    },
    [min, max, onChange, snapToStep]
  )

  return (
    <div className={cn("w-full px-1", className)}>
      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-3 w-full rounded-full cursor-pointer"
        style={{ background: paletteGradients[palette] }}
        onClick={handleTrackClick}
      >
        {/* Thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          style={{
            left: `${percentage}%`,
            scale,
          }}
          onPan={handlePan}
        >
          <div
            className="w-8 h-8 rounded-full border-4 border-white shadow-lg cursor-grab active:cursor-grabbing"
            style={{
              backgroundColor: "var(--accent-copper, #B87333)",
              boxShadow: "0 0 0 4px rgba(184,115,51,0.2), 0 2px 8px rgba(44,40,37,0.15)",
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}
