"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Timer, Zap } from "lucide-react"
import { weightedPick, winnerSummary } from "../../shared/random"
import { haptic, playDecideSound } from "../../shared/primitives"
import { SubToolFrame, useDecideOnce, type SubToolProps } from "./shared"
import type { DecideOption } from "../../contract"

const ACCENT = "var(--color-coral)"
const START = 10
const R = 52 // ring radius
const CIRC = 2 * Math.PI * R

/**
 * COUNTDOWN PICKER — a ten-second timer that pressure-picks a random option when
 * it hits zero. Can't wait? Tap to pick now.
 */
export default function CountdownPicker({ options, onResult, onBack }: SubToolProps) {
  const reduce = useReducedMotion()
  const commit = useDecideOnce(onResult)
  const [left, setLeft] = useState(START)
  const [picked, setPicked] = useState<DecideOption | null>(null)
  const pickedRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function pick(at: number) {
    if (pickedRef.current) return
    pickedRef.current = true
    if (intervalRef.current) clearInterval(intervalRef.current)
    const winner = weightedPick(options)
    playDecideSound("win")
    haptic([10, 40, 10, 40, 18])
    setPicked(winner)
    setLeft(0)
    commit({
      winner,
      summary: winnerSummary(winner),
      detail: { tool: "bonus", subTool: "countdown", pickedAt: at },
    })
  }

  // Tick down once per second.
  useEffect(() => {
    intervalRef.current = setInterval(() => setLeft((p) => Math.max(0, p - 1)), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Auto-pick the instant the clock reaches zero, and stop the (now idle) timer.
  useEffect(() => {
    if (left > 0) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!pickedRef.current) pick(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  const urgent = left <= 3 && !picked
  const numberColor = picked
    ? "var(--color-coral)"
    : urgent
      ? "var(--color-coral)"
      : "var(--color-terracotta)"
  const progress = picked ? 0 : left / START

  return (
    <SubToolFrame title="Countdown" accent={ACCENT} onBack={onBack}>
      <div className="grid place-items-center py-2">
        <div className="relative grid h-[132px] w-[132px] place-items-center">
          <svg width={132} height={132} className="absolute inset-0 -rotate-90">
            <circle cx={66} cy={66} r={R} fill="none" stroke="var(--color-sand)" strokeWidth={8} />
            <motion.circle
              cx={66}
              cy={66}
              r={R}
              fill="none"
              stroke={numberColor}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              animate={{ strokeDashoffset: CIRC * (1 - progress) }}
              transition={{ duration: 0.6, ease: "linear" }}
            />
          </svg>
          {picked ? (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 14 }}
              className="max-w-[104px] truncate px-1 text-center text-[18px] font-extrabold"
              style={{ fontFamily: "var(--font-display)", color: ACCENT }}
            >
              {picked.label}
            </motion.span>
          ) : (
            <motion.span
              key={left}
              initial={{ scale: 1.25, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.3 }}
              className="text-[44px] font-black tabular-nums"
              style={{ fontFamily: "var(--font-display)", color: numberColor }}
              data-testid="countdown-seconds"
            >
              {left}
            </motion.span>
          )}
        </div>
      </div>

      <motion.button
        type="button"
        onClick={() => pick(left)}
        disabled={!!picked}
        whileTap={{ scale: 0.96 }}
        animate={urgent && !reduce ? { scale: [1, 1.04, 1] } : undefined}
        transition={urgent && !reduce ? { duration: 0.5, repeat: Infinity } : undefined}
        className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-bold disabled:opacity-40"
        style={{ background: ACCENT, color: "var(--primary-foreground)", fontFamily: "var(--font-nav)" }}
        data-testid="countdown-pick-btn"
      >
        {picked ? <Timer size={18} strokeWidth={2.2} /> : <Zap size={18} strokeWidth={2.2} />}
        {picked ? "Decided" : "Pick now"}
      </motion.button>
    </SubToolFrame>
  )
}
