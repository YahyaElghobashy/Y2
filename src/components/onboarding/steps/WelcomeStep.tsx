"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type WelcomeStepProps = {
  onContinue: () => Promise<void>
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return reduced
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  const reducedMotion = useReducedMotion()
  const [showButton, setShowButton] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const delay = reducedMotion ? 1000 : 4000
    const timer = setTimeout(() => setShowButton(true), delay)
    return () => clearTimeout(timer)
  }, [reducedMotion])

  const handleContinue = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onContinue()
    } finally {
      setIsSubmitting(false)
    }
  }

  const makeDelay = (ms: number) => (reducedMotion ? 0 : ms / 1000)
  const makeDuration = (ms: number) => (reducedMotion ? 0 : ms / 1000)

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden p-6"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-warm-white, #FFFDF9) 0%, rgba(218,165,32,0.06) 50%, var(--bg-soft-cream, #F5EDE3) 100%)",
      }}
      data-testid="welcome-step"
    >
      {/* Content */}
      <div className="relative z-10 flex max-w-lg w-full flex-col items-center text-center space-y-2">
        {/* Arabic text */}
        <motion.h1
          className="font-arabic text-[72px] leading-none font-bold text-[var(--accent-copper,#B87333)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: makeDelay(800),
            duration: makeDuration(500),
            ease: EASE_OUT,
          }}
          data-testid="welcome-arabic"
        >
          حياة
        </motion.h1>

        {/* English */}
        <motion.h2
          className="font-display text-4xl font-bold tracking-tight text-[var(--text-primary)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: makeDelay(1800),
            duration: makeDuration(400),
            ease: EASE_OUT,
          }}
          data-testid="welcome-english"
        >
          Hayah
        </motion.h2>

        {/* Tagline */}
        <motion.p
          className="pt-4 font-serif italic text-[16px] text-[var(--text-secondary)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: makeDelay(2500),
            duration: makeDuration(400),
            ease: EASE_OUT,
          }}
          data-testid="welcome-tagline"
        >
          A companion for the two of you.
        </motion.p>

        {/* Subtitle */}
        <motion.p
          className="font-body text-sm text-[var(--text-muted)] max-w-[280px] mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: makeDelay(3200),
            duration: makeDuration(400),
            ease: EASE_OUT,
          }}
          data-testid="welcome-philosophy"
        >
          Warm when you arrive.
          <br />
          Silent when you&apos;re away.
        </motion.p>

        {/* Begin button */}
        <div className="pt-12 w-full max-w-xs">
          {showButton && (
            <motion.button
              className="group w-full rounded-full py-4 px-8 font-body text-[15px] font-semibold text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--accent-copper, #B87333)",
                boxShadow: "0 4px 14px rgba(184,115,51,0.25)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: makeDuration(300), ease: EASE_OUT }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleContinue}
              disabled={isSubmitting}
              data-testid="welcome-begin-btn"
            >
              <span>{isSubmitting ? "..." : "Begin"}</span>
              {!isSubmitting && (
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom decorative bars */}
      <motion.div
        className="absolute bottom-10 flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: makeDelay(3500), duration: makeDuration(400) }}
      >
        <div
          className="h-1 w-8 rounded-full"
          style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
        />
        <div
          className="h-1 w-2 rounded-full"
          style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
        />
        <div
          className="h-1 w-2 rounded-full"
          style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
        />
      </motion.div>
    </div>
  )
}
