"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const CONFETTI_COLORS = [
  "#C4956A", // copper
  "#B87333", // deep copper
  "#D4A574", // light copper
  "#DAA520", // gold
  "#E8C4B8", // rose
]

type PairingCelebrationProps = {
  userName: string
  partnerName: string
  onContinue: () => Promise<void>
}

function ConfettiParticle({ index }: { index: number }) {
  const angle = (index / 25) * 360
  const distance = 60 + (index % 5) * 25
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance
  const rotation = Math.random() * 360
  const size = 4 + (index % 4) * 2

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
      animate={{ x, y: y - 15, opacity: 0, scale: 1, rotate: rotation }}
      transition={{ duration: 1.0, ease: EASE_OUT, delay: 0.6 }}
      aria-hidden
    />
  )
}

export function PairingCelebration({ userName, partnerName, onContinue }: PairingCelebrationProps) {
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
    <div className="flex flex-col items-center gap-6 text-center" data-testid="pairing-celebration">
      {/* Copper glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0] }}
        transition={{ duration: 2, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(196, 149, 106, 0.2) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Names + Heart */}
      <div className="relative flex items-center gap-4">
        {/* User name from left */}
        <motion.span
          className="font-[family-name:var(--font-display)] text-[20px] font-bold text-[var(--color-text-primary)]"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.2 }}
          data-testid="celebration-user-name"
        >
          {userName}
        </motion.span>

        {/* Heart */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1, 1.4, 1] }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.5 }}
        >
          <Heart
            size={28}
            className="fill-[var(--color-accent-primary)] text-[var(--color-accent-primary)]"
            data-testid="celebration-heart"
          />
        </motion.div>

        {/* Partner name from right */}
        <motion.span
          className="font-[family-name:var(--font-display)] text-[20px] font-bold text-[var(--color-text-primary)]"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.2 }}
          data-testid="celebration-partner-name"
        >
          {partnerName}
        </motion.span>

        {/* Confetti burst */}
        {Array.from({ length: 25 }).map((_, i) => (
          <ConfettiParticle key={i} index={i} />
        ))}
      </div>

      {/* Subtitle */}
      <motion.p
        className="font-[family-name:var(--font-body)] text-[15px] text-[var(--color-text-secondary)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4, ease: EASE_OUT }}
        data-testid="celebration-subtitle"
      >
        Your space is ready.
      </motion.p>

      {/* Continue button */}
      {showButton && (
        <motion.button
          className="mt-2 rounded-xl bg-[var(--color-accent-primary)] px-8 py-3.5 font-[family-name:var(--font-body)] text-[15px] font-medium text-white shadow-[0_0_16px_rgba(196,149,106,0.3)] disabled:opacity-50"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          onClick={handleContinue}
          disabled={isSubmitting}
          data-testid="celebration-continue-btn"
        >
          Enter Your Space &rarr;
        </motion.button>
      )}
    </div>
  )
}
