"use client"

import { motion } from "framer-motion"

interface SpiralAnimationProps {
  size?: number
  strokeColor?: string
  strokeWidth?: number
  duration?: number
  className?: string
}

export function SpiralAnimation({
  size = 120,
  strokeColor = "var(--accent-copper, #B87333)",
  strokeWidth = 2,
  duration = 1.5,
  className = "",
}: SpiralAnimationProps) {
  // Golden spiral approximation using cubic bezier curves
  const spiralPath =
    "M60 60 C60 45, 75 35, 80 40 C90 48, 85 65, 72 72 C55 82, 35 72, 30 55 C22 32, 38 15, 60 12 C88 8, 108 32, 108 60 C108 92, 85 115, 60 115"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
    >
      <motion.path
        d={spiralPath}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration, ease: [0.25, 0.1, 0.25, 1] },
          opacity: { duration: 0.3 },
        }}
      />
    </svg>
  )
}
