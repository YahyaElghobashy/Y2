"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { StepDirection } from "@/lib/types/onboarding.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type StepTransitionProps = {
  children: React.ReactNode
  stepKey: string
  direction: StepDirection
}

export function StepTransition({ children, stepKey, direction }: StepTransitionProps) {
  const yOffset = direction === "forward" ? 24 : -24

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        className="flex w-full max-w-sm flex-col items-center"
        initial={{ opacity: 0, y: yOffset }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -yOffset }}
        transition={{
          duration: 0.3,
          ease: EASE_OUT,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
