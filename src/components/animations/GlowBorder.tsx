"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { motion, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

type GlowBorderProps = {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  intensity?: "subtle" | "medium" | "strong"
}

const intensityMap = {
  subtle: { opacity: 0.15, spread: "40%" },
  medium: { opacity: 0.25, spread: "50%" },
  strong: { opacity: 0.35, spread: "60%" },
}

export function GlowBorder({
  children,
  className,
  disabled = false,
  intensity = "subtle",
}: GlowBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile("ontouchstart" in window)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || isMobile) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    },
    [disabled, isMobile, mouseX, mouseY]
  )

  const { opacity, spread } = intensityMap[intensity]

  if (disabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onPointerMove={handlePointerMove}
    >
      {/* Glow overlay */}
      {isMobile ? (
        // Mobile: gentle rotating conic-gradient glow
        <motion.div
          className="absolute -inset-px rounded-[inherit] pointer-events-none z-0"
          style={{
            background: `conic-gradient(from 0deg, transparent, rgba(184, 115, 51, ${opacity}), transparent, rgba(184, 115, 51, ${opacity * 0.5}), transparent)`,
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          aria-hidden="true"
        />
      ) : (
        // Desktop: pointer-tracking radial glow
        <motion.div
          className="absolute -inset-px rounded-[inherit] pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle ${spread} at ${mouseX.get()}px ${mouseY.get()}px, rgba(184, 115, 51, ${opacity}), transparent)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Content (sits above glow) */}
      <div className="relative z-10 rounded-[inherit] bg-[inherit]">
        {children}
      </div>
    </div>
  )
}
