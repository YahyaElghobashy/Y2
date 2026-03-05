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

  // Show button after animation completes (or 1s if reduced motion)
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
    <div className="flex flex-col items-center gap-6 text-center" data-testid="welcome-step">
      {/* Arabic text */}
      <motion.p
        className="font-[family-name:var(--font-amiri)] text-[48px] font-bold leading-tight text-[var(--color-accent-primary)]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: makeDelay(800),
          duration: makeDuration(500),
          ease: EASE_OUT,
        }}
        data-testid="welcome-arabic"
      >
        حَيَاة
      </motion.p>

      {/* English transliteration */}
      <motion.p
        className="font-[family-name:var(--font-display)] text-[28px] font-bold text-[var(--color-text-primary)]"
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
      </motion.p>

      {/* Tagline */}
      <motion.p
        className="font-[family-name:var(--font-body)] text-[16px] text-[var(--color-text-secondary)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: makeDelay(2500),
          duration: makeDuration(400),
          ease: EASE_OUT,
        }}
        data-testid="welcome-tagline"
      >
        Our shared life, in one place.
      </motion.p>

      {/* Philosophy line */}
      <motion.p
        className="font-[family-name:var(--font-body)] text-[14px] text-[var(--color-text-muted)] max-w-[280px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: makeDelay(3200),
          duration: makeDuration(400),
          ease: EASE_OUT,
        }}
        data-testid="welcome-philosophy"
      >
        A space built with intention, for two people building a life together.
      </motion.p>

      {/* Begin button */}
      {showButton && (
        <motion.button
          className="mt-4 rounded-xl bg-[var(--color-accent-primary)] px-8 py-3.5 font-[family-name:var(--font-body)] text-[15px] font-medium text-white disabled:opacity-50"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: makeDuration(300), ease: EASE_OUT }}
          onClick={handleContinue}
          disabled={isSubmitting}
          data-testid="welcome-begin-btn"
        >
          {isSubmitting ? "..." : "Begin \u2192"}
        </motion.button>
      )}
    </div>
  )
}
