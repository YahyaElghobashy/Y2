"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/providers/AuthProvider"
import { Avatar } from "@/components/shared/Avatar"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const CONFETTI_COLORS = [
  "#C4956A", // copper
  "#B87333", // deep copper
  "#D4A574", // light copper
  "#DAA520", // gold
  "#E8C4B8", // rose
]

type ReadyStepProps = {
  onComplete: () => Promise<void>
}

function MiniConfettiParticle({ index }: { index: number }) {
  const angle = (index / 15) * 360
  const distance = 40 + (index % 4) * 20
  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance
  const rotation = Math.random() * 360
  const size = 3 + (index % 3) * 2

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
      animate={{ x, y: y - 10, opacity: 0, scale: 1, rotate: rotation }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
      aria-hidden
    />
  )
}

export function ReadyStep({ onComplete }: ReadyStepProps) {
  const { profile, partner } = useAuth()
  const [showButton, setShowButton] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const isPaired = !!partner
  const displayName = profile?.display_name ?? "there"
  const partnerName = partner?.display_name ?? ""

  // Reveal button after 1s delay
  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleLaunch = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setIsExiting(true)

    // Wait for exit animation (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300))

    try {
      await onComplete()
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, onComplete])

  return (
    <motion.div
      className="flex flex-col items-center gap-6 text-center"
      animate={isExiting ? { scale: 1.05, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      data-testid="ready-step"
    >
      {/* Avatars */}
      <div className="relative flex items-center justify-center" data-testid="ready-avatars">
        {/* User avatar */}
        <div
          className="rounded-full"
          style={{
            padding: 2,
            background: "linear-gradient(135deg, #C4956A, #D4A574)",
          }}
        >
          <div className="rounded-full bg-[var(--color-bg-elevated)] p-0.5">
            <Avatar
              src={profile?.avatar_url}
              name={displayName}
              size="lg"
            />
          </div>
        </div>

        {/* Partner avatar (only if paired) */}
        {isPaired && (
          <div
            className="-ms-3 rounded-full"
            style={{
              padding: 2,
              background: "linear-gradient(135deg, #C4956A, #D4A574)",
            }}
            data-testid="ready-partner-avatar"
          >
            <div className="rounded-full bg-[var(--color-bg-elevated)] p-0.5">
              <Avatar
                src={partner?.avatar_url}
                name={partnerName}
                size="lg"
              />
            </div>
          </div>
        )}

        {/* Mini confetti — only if paired */}
        {isPaired &&
          Array.from({ length: 15 }).map((_, i) => (
            <MiniConfettiParticle key={i} index={i} />
          ))}
      </div>

      {/* Welcome heading */}
      <motion.h2
        className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--color-text-primary)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.2 }}
        data-testid="ready-heading"
      >
        Welcome home, {displayName}.
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        className="font-[family-name:var(--font-body)] text-[14px] text-[var(--color-text-secondary)]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.5 }}
        data-testid="ready-subtitle"
      >
        {isPaired
          ? `Your shared space with ${partnerName} is ready.`
          : "Your space is ready."}
      </motion.p>

      {/* Launch button */}
      {showButton && (
        <motion.button
          className="mt-2 rounded-xl bg-[var(--color-accent-primary)] px-8 py-3.5 font-[family-name:var(--font-body)] text-[15px] font-medium text-white shadow-[0_0_16px_rgba(196,149,106,0.3)] disabled:opacity-50"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          onClick={handleLaunch}
          disabled={isSubmitting}
          data-testid="ready-launch-btn"
        >
          Let&apos;s begin &rarr;
        </motion.button>
      )}
    </motion.div>
  )
}
