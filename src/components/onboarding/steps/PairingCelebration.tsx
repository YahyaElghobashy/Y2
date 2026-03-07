"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const CONFETTI_COLORS = [
  "#B87333", // copper
  "#DAA520", // gold
  "#F4A8B8", // rose
  "#D4A574", // light copper
  "#E8C4B8", // warm rose
]

type PairingCelebrationProps = {
  userName: string
  partnerName: string
  onContinue: () => Promise<void>
}

function ConfettiParticle({ index }: { index: number }) {
  const { x, y, rotation, size } = useMemo(() => {
    const angle = (index / 25) * 360
    const distance = 80 + (index % 5) * 30
    return {
      x: Math.cos((angle * Math.PI) / 180) * distance,
      y: Math.sin((angle * Math.PI) / 180) * distance - 20,
      rotation: (index * 47) % 360,
      size: 4 + (index % 4) * 2,
    }
  }, [index])

  return (
    <motion.div
      className="absolute rounded-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        left: "50%",
        top: "50%",
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
      animate={{ x, y, opacity: 0, scale: 1, rotate: rotation }}
      transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.6 }}
      aria-hidden
    />
  )
}

export function PairingCelebration({
  userName,
  partnerName,
  onContinue,
}: PairingCelebrationProps) {
  const [showButton, setShowButton] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleContinue = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onContinue()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-warm-white, #FFFDF9) 0%, var(--bg-soft-cream, #F5EDE3) 100%)",
      }}
      data-testid="pairing-celebration"
    >
      {/* Copper glow background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0.08] }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(184,115,51,0.15) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* CONNECTION ESTABLISHED */}
        <motion.span
          className="mb-2 text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-muted)]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: EASE_OUT }}
        >
          Connection Established
        </motion.span>

        {/* Names + Heart */}
        <div className="relative flex items-center justify-center gap-4 mb-8">
          {/* User name from left */}
          <motion.h1
            className="font-display text-5xl font-bold tracking-tight text-[var(--text-primary)]"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.3 }}
            data-testid="celebration-user-name"
          >
            {userName}
          </motion.h1>

          {/* Pulsing heart with concentric rings */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 1.3, 1] }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.6 }}
          >
            {/* Ring 1 */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 64,
                height: 64,
                border: "2px solid var(--accent-copper, #B87333)",
              }}
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
                delay: 1.0,
                repeat: 2,
                repeatDelay: 0.5,
              }}
              aria-hidden
            />
            {/* Ring 2 */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 64,
                height: 64,
                border: "1px solid var(--accent-copper, #B87333)",
              }}
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 3], opacity: [0.25, 0] }}
              transition={{
                duration: 1.5,
                ease: "easeOut",
                delay: 1.3,
                repeat: 2,
                repeatDelay: 0.5,
              }}
              aria-hidden
            />
            <Heart
              size={48}
              className="fill-[var(--accent-copper,#B87333)] text-[var(--accent-copper,#B87333)]"
              data-testid="celebration-heart"
            />
          </motion.div>

          {/* Partner name from right */}
          <motion.h1
            className="font-display text-5xl font-bold tracking-tight text-[var(--text-primary)]"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.3 }}
            data-testid="celebration-partner-name"
          >
            {partnerName}
          </motion.h1>

          {/* Confetti burst */}
          {Array.from({ length: 25 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>

        {/* Subtitle */}
        <motion.p
          className="font-display text-xl italic font-normal text-[var(--text-primary)] opacity-80 max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.4, ease: EASE_OUT }}
          data-testid="celebration-subtitle"
        >
          You&apos;re connected. This is yours now.
        </motion.p>

        {/* Decorative divider */}
        <motion.div
          className="mt-12 mb-12 flex gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.4 }}
        >
          <div
            className="h-1 w-8 rounded-full opacity-20"
            style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
          />
          <div
            className="h-1 w-12 rounded-full"
            style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
          />
          <div
            className="h-1 w-8 rounded-full opacity-20"
            style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
          />
        </motion.div>

        {/* CTA */}
        <div className="w-full max-w-xs">
          {showButton && (
            <motion.button
              className="group relative w-full overflow-hidden rounded-xl py-4 px-8 font-body text-[16px] font-bold text-white shadow-lg disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent-copper, #B87333)",
                boxShadow: "0 4px 14px rgba(184,115,51,0.3)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              onClick={handleContinue}
              disabled={isSubmitting}
              data-testid="celebration-continue-btn"
            >
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? "..." : "Enter Your Space"}
                {!isSubmitting && <span>→</span>}
              </span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
