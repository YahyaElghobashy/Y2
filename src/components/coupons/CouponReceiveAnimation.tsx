"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

type CouponReceiveAnimationProps = {
  visible: boolean
  couponTitle: string
  couponId: string
  onOpen: (id: string) => void
  onDismiss: () => void
  className?: string
}

export function CouponReceiveAnimation({
  visible,
  couponTitle,
  couponId,
  onOpen,
  onDismiss,
  className,
}: CouponReceiveAnimationProps) {
  const prefersReduced = useReducedMotion()
  const scrollLockRef = useRef(false)

  // Body scroll lock
  useEffect(() => {
    if (visible && !scrollLockRef.current) {
      document.body.style.overflow = "hidden"
      scrollLockRef.current = true
    }
    return () => {
      if (scrollLockRef.current) {
        document.body.style.overflow = ""
        scrollLockRef.current = false
      }
    }
  }, [visible])

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
          role="dialog"
          aria-label="Coupon received"
          aria-modal="true"
          data-testid="receive-animation"
        >
          {/* Warm backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/30"
            data-testid="backdrop"
            onClick={onDismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />

          {/* Letter envelope */}
          <motion.div
            className="relative z-10 w-[280px] rounded-2xl bg-[var(--color-bg-elevated,#FFFFFF)] px-6 py-8 text-center"
            style={{
              boxShadow: "0 8px 40px rgba(44, 40, 37, 0.15)",
            }}
            data-testid="letter-envelope"
            initial={
              prefersReduced
                ? { opacity: 1 }
                : { y: -300, scale: 0.8, opacity: 0 }
            }
            animate={
              prefersReduced
                ? { opacity: 1 }
                : {
                    y: [null, 10, -5, 0],
                    scale: [null, 1.02, 0.98, 1],
                    opacity: 1,
                  }
            }
            transition={
              prefersReduced
                ? { duration: 0 }
                : {
                    duration: 0.9,
                    times: [0, 0.67, 0.82, 1],
                    ease: "easeOut",
                  }
            }
          >
            {/* Envelope icon */}
            <motion.div
              className="text-[48px] leading-none mb-3"
              initial={prefersReduced ? {} : { scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: prefersReduced ? 0 : 0.6, duration: 0.2 }}
            >
              💌
            </motion.div>

            {/* Title */}
            <motion.h3
              className="text-[18px] font-semibold font-display text-[var(--color-text-primary,#2C2825)] mb-1"
              data-testid="coupon-title"
              initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReduced ? 0 : 0.8, duration: 0.2 }}
            >
              {couponTitle}
            </motion.h3>

            <motion.p
              className="text-[13px] text-[var(--color-text-secondary,#8C8279)] mb-6"
              initial={prefersReduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: prefersReduced ? 0 : 0.9, duration: 0.2 }}
            >
              You received a new coupon!
            </motion.p>

            {/* Action buttons */}
            <motion.div
              className="flex flex-col gap-3"
              initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReduced ? 0 : 1.0, duration: 0.2 }}
            >
              <button
                className="w-full rounded-lg bg-[var(--accent-primary,#C4956A)] px-4 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
                data-testid="open-button"
                onClick={() => onOpen(couponId)}
              >
                Open
              </button>
              <button
                className="w-full rounded-lg border border-[var(--color-border-subtle,rgba(44,40,37,0.08))] bg-transparent px-4 py-3 text-[15px] font-medium text-[var(--color-text-secondary,#8C8279)] transition-opacity hover:opacity-70"
                data-testid="dismiss-button"
                onClick={onDismiss}
              >
                Save for Later
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
