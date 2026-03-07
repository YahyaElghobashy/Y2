"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"

interface SparklesEffectProps {
  count?: number
  className?: string
  colors?: string[]
  size?: { min: number; max: number }
}

export function SparklesEffect({
  count = 10,
  className = "",
  colors = ["#B87333", "#D4A574", "#DAA520", "#C4956A"],
  size = { min: 3, max: 6 },
}: SparklesEffectProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        color: colors[i % colors.length],
        diameter: size.min + Math.random() * (size.max - size.min),
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      })),
    [count, colors, size]
  )

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.diameter,
            height: p.diameter,
            backgroundColor: p.color,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
      ))}
    </div>
  )
}
