"use client"

import { useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion"
import { Trophy, Frown } from "lucide-react"

type ChallengeWinAnimationProps = {
  open: boolean
  isWinner: boolean
  amount: number
  onComplete?: () => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const CONFETTI_COUNT = 20
const CONFETTI_COLORS = ["#B87333", "#DAA520", "#C9956B", "#E8C872"]
const ANIMATION_DURATION_MS = 2400

type Particle = {
  id: number
  color: string
  angle: number
  distance: number
  rotation: number
  size: number
}

function generateParticles(): Particle[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    angle: (i / CONFETTI_COUNT) * 360 + (Math.random() * 20 - 10),
    distance: 80 + Math.random() * 60,
    rotation: Math.random() * 720 - 360,
    size: 6 + Math.random() * 4,
  }))
}

export function ChallengeWinAnimation({
  open,
  isWinner,
  amount,
  onComplete,
}: ChallengeWinAnimationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const counterValue = useMotionValue(0)
  const displayAmount = useTransform(counterValue, (v) => Math.round(v))

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const particles = useMemo(() => generateParticles(), [])

  useEffect(() => {
    if (!open) return

    if (isWinner) {
      counterValue.set(0)
      animate(counterValue, amount, {
        duration: prefersReducedMotion ? 0 : 0.6,
        ease: EASE_OUT,
      })
    }

    timerRef.current = setTimeout(() => {
      onComplete?.()
    }, prefersReducedMotion ? 800 : ANIMATION_DURATION_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [open, isWinner, amount, onComplete, counterValue, prefersReducedMotion])

  if (typeof window === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-testid="win-animation-overlay"
        >
          <div className="absolute inset-0 bg-black/40" />

          <motion.div
            className="relative flex flex-col items-center gap-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            data-testid="win-animation-content"
          >
            {isWinner ? (
              <>
                {/* Confetti particles */}
                {!prefersReducedMotion && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    data-testid="confetti-container"
                  >
                    {particles.map((p) => {
                      const rad = (p.angle * Math.PI) / 180
                      const x = Math.cos(rad) * p.distance
                      const y = Math.sin(rad) * p.distance - 40

                      return (
                        <motion.div
                          key={p.id}
                          className="absolute rounded-sm"
                          data-testid="confetti-particle"
                          style={{
                            width: p.size,
                            height: p.size,
                            backgroundColor: p.color,
                            left: "50%",
                            top: "50%",
                          }}
                          initial={{
                            x: 0,
                            y: 0,
                            rotate: 0,
                            opacity: 1,
                            scale: 0,
                          }}
                          animate={{
                            x,
                            y: y + 30,
                            rotate: p.rotation,
                            opacity: [1, 1, 0],
                            scale: [0, 1, 0.5],
                          }}
                          transition={{
                            duration: 1.2,
                            ease: "easeOut",
                          }}
                        />
                      )
                    })}
                  </div>
                )}

                {/* Trophy icon */}
                <motion.div
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.4,
                    delay: prefersReducedMotion ? 0 : 0.1,
                    ease: EASE_OUT,
                  }}
                  data-testid="winner-icon"
                >
                  <Trophy
                    size={40}
                    strokeWidth={1.5}
                    className="text-accent-primary"
                  />
                </motion.div>

                {/* You Won text */}
                <motion.h2
                  className="font-display text-[28px] font-bold text-white"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.3,
                    delay: prefersReducedMotion ? 0 : 0.2,
                    ease: EASE_OUT,
                  }}
                  data-testid="win-title"
                >
                  You Won!
                </motion.h2>

                {/* Amount counter */}
                <motion.div
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.3,
                    delay: prefersReducedMotion ? 0 : 0.3,
                  }}
                  data-testid="win-amount"
                >
                  <span className="font-mono text-[32px] font-bold text-accent-primary">
                    +
                  </span>
                  <motion.span
                    className="font-mono text-[32px] font-bold text-accent-primary"
                    data-testid="win-counter"
                  >
                    {displayAmount}
                  </motion.span>
                  <span className="text-[24px]">&#x1FA99;</span>
                </motion.div>
              </>
            ) : (
              <>
                {/* Loser view */}
                <motion.div
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-bg-elevated"
                  initial={
                    prefersReducedMotion
                      ? { scale: 1 }
                      : { x: 0 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { scale: 1 }
                      : { x: [0, -3, 3, -2, 2, 0] }
                  }
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                  }}
                  data-testid="loser-icon"
                >
                  <Frown
                    size={40}
                    strokeWidth={1.5}
                    className="text-text-secondary"
                  />
                </motion.div>

                <motion.h2
                  className="font-display text-[28px] font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  data-testid="lose-title"
                >
                  Better luck next time
                </motion.h2>

                <motion.div
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  data-testid="lose-amount"
                >
                  <span className="font-mono text-[32px] font-bold text-[var(--error)]">
                    -{amount}
                  </span>
                  <span className="text-[24px]">&#x1FA99;</span>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
