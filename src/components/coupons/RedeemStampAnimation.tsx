"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

type RedeemStampAnimationProps = {
  visible: boolean
  onComplete?: () => void
  className?: string
}

export function RedeemStampAnimation({ visible, onComplete, className }: RedeemStampAnimationProps) {
  const prefersReduced = useReducedMotion()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleAnimationComplete = () => {
    timerRef.current = setTimeout(() => {
      onComplete?.()
    }, 200)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center pointer-events-none",
            className
          )}
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -200, scale: 1.2 }}
          animate={
            prefersReduced
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: 0,
                  scale: [1.2, 1, 1.05, 0.97, 1.03, 1],
                }
          }
          transition={
            prefersReduced
              ? { duration: 0 }
              : {
                  duration: 0.55,
                  times: [0, 0.55, 0.65, 0.73, 0.82, 1],
                  ease: [0.25, 0.1, 0.25, 1],
                }
          }
          onAnimationComplete={handleAnimationComplete}
          role="status"
          aria-label="Coupon redeemed"
          data-testid="redeem-stamp"
        >
          <div
            className="rounded-lg border-4 border-[var(--accent-primary)] px-6 py-3"
            style={{ transform: "rotate(-12deg)" }}
          >
            <span
              className="block text-[28px] font-bold uppercase tracking-[0.15em] font-[family-name:var(--font-display)] text-[var(--accent-primary)]"
              style={{ textShadow: "0 1px 2px rgba(196,149,106,0.3)" }}
            >
              REDEEMED
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
