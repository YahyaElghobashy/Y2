"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

type CouponSendAnimationProps = {
  visible: boolean
  onComplete: () => void
  className?: string
}

// Deterministic particle positions (12 particles, evenly spaced 30° apart)
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * 30 * Math.PI) / 180
  return {
    x: Math.cos(angle) * 80,
    y: Math.sin(angle) * 80,
    delay: i * 0.05,
    color: i % 2 === 0 ? "var(--accent-primary)" : "#DAA520",
  }
})

export function CouponSendAnimation({ visible, onComplete, className }: CouponSendAnimationProps) {
  const prefersReduced = useReducedMotion()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!visible) return

    if (prefersReduced) {
      timerRef.current = setTimeout(() => onComplete(), 100)
      return
    }

    // Total animation: fold(400) + lift(200) + flight(600) + particles(600) = ~1800ms
    timerRef.current = setTimeout(() => onComplete(), 2000)
  }, [visible, prefersReduced, onComplete])

  if (!visible) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-label="Coupon sent"
          data-testid="send-animation"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" />

          {prefersReduced ? (
            /* Reduced motion: instant "Sent!" */
            <motion.div
              className="relative z-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0 }}
            >
              <span
                className="block text-[32px] font-bold font-[family-name:var(--font-display)] text-[var(--accent-primary)]"
                data-testid="sent-confirm"
              >
                Sent!
              </span>
            </motion.div>
          ) : (
            <div className="relative z-10">
              {/* Paper airplane: fold → lift → flight */}
              <motion.div
                className="text-[48px] leading-none"
                data-testid="airplane-element"
                initial={{
                  scale: 1,
                  rotateX: 0,
                  y: 0,
                  x: 0,
                  opacity: 1,
                }}
                animate={{
                  // Fold phase then lift then flight arc to top-right
                  scale: [1, 0.85, 0.9, 0.9, 0.3],
                  rotateX: [0, 45, 0, 0, 0],
                  y: [0, 0, -20, -20, -300],
                  x: [0, 0, 0, 0, 200],
                  opacity: [1, 1, 1, 1, 0],
                }}
                transition={{
                  duration: 1.2,
                  times: [0, 0.33, 0.5, 0.5, 1],
                  ease: "easeInOut",
                }}
                style={{ perspective: 600 }}
              >
                ✈️
              </motion.div>

              {/* Particles burst after flight (delay 1.2s) */}
              {PARTICLES.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  data-testid="particle"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: p.color,
                    top: "50%",
                    left: "50%",
                    marginTop: -4,
                    marginLeft: -4,
                  }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.2, 0],
                    x: [0, p.x],
                    y: [0, p.y],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 1.2 + p.delay,
                    ease: "easeOut",
                  }}
                />
              ))}

              {/* "Sent!" confirmation text */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.5 }}
              >
                <span
                  className="block text-[32px] font-bold font-[family-name:var(--font-display)] text-[var(--accent-primary)]"
                  data-testid="sent-confirm"
                >
                  Sent!
                </span>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
