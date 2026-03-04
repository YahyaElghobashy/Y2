"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

type RedeemStampAnimationProps = {
  visible: boolean
  onComplete?: () => void
  className?: string
}

// Deterministic ink splatter positions (8 dots radiating outward)
const INK_DOTS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * 45 * Math.PI) / 180
  const dist = 30 + (i % 3) * 15
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    size: 4 + (i % 2) * 3,
    delay: 0.05 * i,
  }
})

export function RedeemStampAnimation({ visible, onComplete, className }: RedeemStampAnimationProps) {
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
      timerRef.current = setTimeout(() => onComplete?.(), 100)
      return
    }

    // Total: appear(200) + slam(300) + shake(150) + imprint(200) + settle(200) ≈ 1500ms
    timerRef.current = setTimeout(() => onComplete?.(), 1500)
  }, [visible, prefersReduced, onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center pointer-events-none",
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          role="status"
          aria-label="Coupon redeemed"
          data-testid="redeem-stamp"
        >
          {prefersReduced ? (
            /* Reduced motion: instant display */
            <div
              className="rounded-lg border-4 border-[var(--accent-primary)] px-6 py-3"
              style={{ transform: "rotate(-5deg)" }}
            >
              <span
                className="block text-[28px] font-bold uppercase tracking-[0.15em] font-[family-name:var(--font-display)] text-[#B85C4A]"
                data-testid="redeemed-text"
              >
                REDEEMED
              </span>
            </div>
          ) : (
            <div className="relative">
              {/* Stamp: appear at scale 2 → accelerating slam → shake */}
              <motion.div
                className="relative"
                data-testid="stamp-container"
                initial={{ scale: 2, y: -100, opacity: 0 }}
                animate={{
                  scale: [2, 1.3, 1, 1, 1, 1, 1],
                  y: [-100, -100, 0, 0, 0, 0, 0],
                  x: [0, 0, 0, 3, -3, 2, 0],
                  opacity: [0, 1, 1, 1, 1, 1, 1],
                }}
                transition={{
                  duration: 0.85,
                  times: [0, 0.24, 0.59, 0.65, 0.71, 0.77, 0.85],
                  ease: "easeIn",
                }}
              >
                <div
                  className="rounded-lg border-4 border-[#B85C4A] px-6 py-3"
                  style={{ transform: "rotate(-5deg)" }}
                >
                  <span
                    className="block text-[28px] font-bold uppercase tracking-[0.15em] font-[family-name:var(--font-display)] text-[#B85C4A]"
                    data-testid="redeemed-text"
                    style={{ textShadow: "0 1px 2px rgba(184,92,74,0.3)" }}
                  >
                    REDEEMED
                  </span>
                </div>
              </motion.div>

              {/* Ink splatter dots */}
              {INK_DOTS.map((dot, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  data-testid="ink-dot"
                  style={{
                    width: dot.size,
                    height: dot.size,
                    backgroundColor: "#B85C4A",
                    top: "50%",
                    left: "50%",
                    marginTop: -(dot.size / 2),
                    marginLeft: -(dot.size / 2),
                  }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.5, 1],
                    x: [0, dot.x],
                    y: [0, dot.y],
                    opacity: [0, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 0.4,
                    delay: 0.5 + dot.delay,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
