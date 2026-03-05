"use client"

import { motion } from "framer-motion"
import type { OnboardingStep } from "@/lib/types/onboarding.types"
import { TOUR_STEPS } from "@/lib/types/onboarding.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type OnboardingShellProps = {
  children: React.ReactNode
  stepIndex: number
  totalSteps: number
  currentStep: OnboardingStep
  canSkip: boolean
  onSkip: () => Promise<void>
}

export function OnboardingShell({
  children,
  stepIndex,
  totalSteps,
  currentStep,
  canSkip,
  onSkip,
}: OnboardingShellProps) {
  const progress = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0
  const isTourStep = TOUR_STEPS.includes(currentStep)

  return (
    <div className="relative flex min-h-[100dvh] flex-col" data-testid="onboarding-shell">
      {/* Animated gradient background */}
      <div
        className="pointer-events-none fixed inset-0 animate-onboarding-gradient"
        aria-hidden
      />

      {/* Progress bar */}
      <div className="relative z-10 h-[3px] w-full bg-[var(--color-border-subtle)]">
        <motion.div
          className="h-full bg-[var(--color-accent-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          data-testid="onboarding-progress"
        />
      </div>

      {/* Step content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5">
        {children}
      </div>

      {/* Skip button (tour steps only) */}
      {canSkip && isTourStep && (
        <motion.button
          className="absolute bottom-8 end-5 z-10 font-[family-name:var(--font-body)] text-[13px] text-[var(--color-text-secondary)] opacity-50"
          onClick={onSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          data-testid="skip-tour-btn"
        >
          Skip tour &rarr;
        </motion.button>
      )}
    </div>
  )
}
