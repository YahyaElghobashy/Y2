"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { WheelItem } from "@/lib/types/wheel.types"

// ── Warm palette for slices ──────────────────────────────────
const SLICE_COLORS = [
  "#C4956A", // copper
  "#E8D5C0", // sand
  "#D4A574", // caramel
  "#B8A090", // warm gray
  "#DEB887", // burlywood
  "#C8B8A0", // khaki
  "#E0C8A8", // wheat
  "#D0A080", // tan
  "#BFA888", // warm stone
  "#C0B0A0", // muted copper
]

type WheelState = "idle" | "spinning" | "result" | "disabled"

type SpinTheWheelProps = {
  items: WheelItem[]
  onSpin: () => { resultIndex: number; angle: number; label: string }
  onResult: (label: string, resultIndex: number) => void
  state?: WheelState
  className?: string
}

export function SpinTheWheel({
  items,
  onSpin,
  onResult,
  state = "idle",
  className,
}: SpinTheWheelProps) {
  const prefersReduced = useReducedMotion()
  const [rotation, setRotation] = useState(0)
  const [wheelState, setWheelState] = useState<WheelState>(state)
  const [resultLabel, setResultLabel] = useState<string | null>(null)
  const lastTickRef = useRef<number>(-1)

  // Sync external state prop
  useEffect(() => {
    setWheelState(state)
  }, [state])

  const SIZE = 300
  const CENTER = SIZE / 2
  const RADIUS = 140
  const sliceAngle = (2 * Math.PI) / items.length

  const handleSpin = useCallback(() => {
    if (wheelState !== "idle" || items.length < 2) return

    const result = onSpin()
    setWheelState("spinning")
    setResultLabel(null)

    if (prefersReduced) {
      // Skip animation, show result immediately
      setRotation((prev) => prev + result.angle)
      setWheelState("result")
      setResultLabel(result.label)
      onResult(result.label, result.resultIndex)
      return
    }

    setRotation((prev) => prev + result.angle)

    // After animation completes, show result
    const duration = 3500
    setTimeout(() => {
      setWheelState("result")
      setResultLabel(result.label)
      onResult(result.label, result.resultIndex)
    }, duration)
  }, [wheelState, items.length, onSpin, onResult, prefersReduced])

  // Haptic feedback during spin
  useEffect(() => {
    if (wheelState !== "spinning" || prefersReduced) return
    if (!navigator.vibrate) return

    const interval = setInterval(() => {
      const currentSlice = Math.floor(
        ((rotation % 360) / 360) * items.length
      )
      if (currentSlice !== lastTickRef.current) {
        lastTickRef.current = currentSlice
        navigator.vibrate(10)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [wheelState, rotation, items.length, prefersReduced])

  // Build SVG path for a slice
  const getSlicePath = (index: number): string => {
    const startAngle = index * sliceAngle - Math.PI / 2
    const endAngle = startAngle + sliceAngle

    const x1 = CENTER + RADIUS * Math.cos(startAngle)
    const y1 = CENTER + RADIUS * Math.sin(startAngle)
    const x2 = CENTER + RADIUS * Math.cos(endAngle)
    const y2 = CENTER + RADIUS * Math.sin(endAngle)

    const largeArc = sliceAngle > Math.PI ? 1 : 0

    return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`
  }

  // Label position (centered in slice)
  const getLabelPosition = (index: number) => {
    const midAngle = index * sliceAngle + sliceAngle / 2 - Math.PI / 2
    const labelRadius = RADIUS * 0.65
    return {
      x: CENTER + labelRadius * Math.cos(midAngle),
      y: CENTER + labelRadius * Math.sin(midAngle),
      angle: (midAngle * 180) / Math.PI,
    }
  }

  const isDisabled = wheelState === "disabled" || wheelState === "spinning"

  return (
    <div
      data-testid="spin-the-wheel"
      className={cn("relative mx-auto", className)}
      style={{ maxWidth: 320, width: "100%" }}
    >
      {/* Pointer at 12 o'clock */}
      <div
        data-testid="wheel-pointer"
        className="absolute start-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <polygon
            points="12,24 2,4 22,4"
            fill="var(--accent-primary, #C4956A)"
            stroke="var(--bg-elevated, #FFFFFF)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Wheel SVG */}
      <motion.svg
        data-testid="wheel-svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ width: "100%", height: "auto" }}
        animate={{ rotate: rotation }}
        transition={
          prefersReduced
            ? { duration: 0 }
            : {
                duration: 3.5,
                ease: [0.15, 0.8, 0.3, 1],
              }
        }
      >
        {items.map((item, i) => {
          const color = item.color ?? SLICE_COLORS[i % SLICE_COLORS.length]
          const pos = getLabelPosition(i)
          const label =
            item.label.length > 15
              ? item.label.slice(0, 13) + "..."
              : item.label

          return (
            <g key={item.id ?? i}>
              <path
                data-testid={`slice-${i}`}
                d={getSlicePath(i)}
                fill={color}
                stroke="var(--bg-elevated, #FFFFFF)"
                strokeWidth="2"
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${pos.angle}, ${pos.x}, ${pos.y})`}
                fill={i % 2 === 0 ? "#FFFFFF" : "var(--text-primary, #2C2C2C)"}
                fontSize="10"
                fontWeight="600"
              >
                {label}
              </text>
            </g>
          )
        })}
      </motion.svg>

      {/* Spin button */}
      <motion.button
        data-testid="spin-button"
        whileTap={isDisabled ? {} : { scale: 0.95 }}
        onClick={handleSpin}
        disabled={isDisabled}
        className={cn(
          "absolute start-1/2 top-1/2 z-10 flex h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-[11px] font-bold uppercase tracking-wide text-white shadow-md",
          isDisabled
            ? "bg-[var(--text-muted)] opacity-50"
            : "bg-[var(--accent-primary,#C4956A)]"
        )}
      >
        SPIN
      </motion.button>

      {/* Result overlay */}
      {wheelState === "result" && resultLabel && (
        <motion.div
          data-testid="result-overlay"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] px-6 py-4 shadow-lg">
            <p className="text-center font-display text-[18px] font-bold text-[var(--accent-primary,#C4956A)]">
              {resultLabel}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
