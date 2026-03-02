"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type FadeInProps = {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  className,
}: FadeInProps) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASE_OUT,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
