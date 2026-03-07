"use client"

import { useEffect, useRef } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"

type DaysTogetherCounterProps = {
  variant?: "full" | "compact"
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

function getTodayKey(): string {
  const d = new Date()
  return `dtc_animated_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function DaysTogetherCounter({
  variant = "full",
  className,
}: DaysTogetherCounterProps) {
  const { profile } = useAuth()
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => Math.round(v))
  const displayRef = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  const pairedAt = profile?.paired_at ?? null

  const dayCount =
    pairedAt !== null
      ? Math.floor(
          (Date.now() - new Date(pairedAt).getTime()) / 86_400_000,
        )
      : null

  useEffect(() => {
    if (dayCount === null || hasAnimated.current) return

    const todayKey = getTodayKey()
    const alreadyAnimatedToday =
      typeof window !== "undefined" && sessionStorage.getItem(todayKey) === "1"

    if (alreadyAnimatedToday) {
      motionValue.set(dayCount)
      hasAnimated.current = true
      return
    }

    const controls = animate(motionValue, dayCount, {
      duration: 0.2,
      ease: EASE_OUT,
      onComplete: () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(todayKey, "1")
        }
        hasAnimated.current = true
      },
    })

    return () => controls.stop()
  }, [dayCount, motionValue])

  // Sync the DOM node with the rounded motion value
  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (displayRef.current) {
        displayRef.current.textContent = String(v)
      }
    })
    return unsubscribe
  }, [rounded])

  if (!profile || pairedAt === null || dayCount === null) return null

  if (variant === "compact") {
    return (
      <motion.div
        data-testid="days-together-counter"
        className={cn("inline-flex items-center gap-1.5", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
      >
        <span
          ref={displayRef}
          data-testid="day-count"
          className="text-[14px] font-display font-semibold tabular-nums"
          style={{ color: "var(--accent-copper, #B87333)" }}
        >
          {dayCount}
        </span>
        <Heart
          data-testid="heart-icon"
          size={14}
          style={{ color: "var(--accent-copper, #B87333)" }}
          strokeWidth={1.75}
        />
      </motion.div>
    )
  }

  // Full variant (default)
  return (
    <motion.div
      data-testid="days-together-counter"
      className={cn(
        "rounded-2xl p-5",
        className,
      )}
      style={{
        backgroundColor: "white",
        border: "1px solid rgba(184,115,51,0.06)",
        boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
    >
      <p
        data-testid="days-label"
        className="text-[14px] font-serif italic"
        style={{ color: "var(--text-secondary, #6B6560)" }}
      >
        Day{" "}
        <Heart
          size={14}
          className="inline mx-1"
          style={{ color: "var(--accent-copper, #B87333)" }}
          strokeWidth={1.75}
        />{" "}
        <span
          ref={displayRef}
          data-testid="day-count"
          className="text-[20px] font-display font-bold tabular-nums not-italic"
          style={{ color: "var(--accent-copper, #B87333)" }}
        >
          {dayCount}
        </span>{" "}
        together on Hayah
      </p>
    </motion.div>
  )
}
