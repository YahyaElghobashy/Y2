"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type PageTransitionProps = {
  children: React.ReactNode
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.25,
        ease: EASE_OUT,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
