"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "@/lib/hooks/use-onboarding"
import { useAuth } from "@/lib/providers/AuthProvider"
import { OnboardingShell } from "@/components/onboarding/OnboardingShell"
import { StepTransition } from "@/components/onboarding/StepTransition"
import { WelcomeStep } from "@/components/onboarding/steps/WelcomeStep"
import { ProfileStep } from "@/components/onboarding/steps/ProfileStep"
import { PairingStep } from "@/components/onboarding/steps/PairingStep"

export default function OnboardingPage() {
  const router = useRouter()
  const { isLoading: authLoading } = useAuth()
  const onboarding = useOnboarding()

  // Redirect to home if onboarding is complete
  useEffect(() => {
    if (onboarding.isComplete) {
      router.replace("/")
    }
  }, [onboarding.isComplete, router])

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-bg-secondary)]" />
      </div>
    )
  }

  if (onboarding.isComplete) return null

  const renderStep = () => {
    switch (onboarding.currentStep) {
      case "welcome":
        return <WelcomeStep onContinue={onboarding.goNext} />
      case "profile":
        return (
          <ProfileStep
            onContinue={onboarding.goNext}
            onBack={onboarding.goBack}
          />
        )
      case "pairing":
        return (
          <PairingStep
            onContinue={onboarding.goNext}
            onSkip={onboarding.goNext}
          />
        )
      case "tour_home":
      case "tour_us":
      case "tour_2026":
      case "tour_me":
      case "tour_more":
        // Tour steps will be implemented in Phase 15 Part 2 (T1607-T1611)
        // For now, auto-advance through tour to ready
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-[var(--color-text-secondary)] text-[14px] font-[family-name:var(--font-body)]">
              Tour step: {onboarding.currentStep}
            </p>
            <button
              onClick={onboarding.goNext}
              className="rounded-xl bg-[var(--color-accent-primary)] px-6 py-3 text-white font-[family-name:var(--font-body)] text-[15px] font-medium"
            >
              Next &rarr;
            </button>
          </div>
        )
      case "ready":
        return null
      default:
        return null
    }
  }

  return (
    <OnboardingShell
      stepIndex={onboarding.stepIndex}
      totalSteps={onboarding.totalSteps}
      currentStep={onboarding.currentStep}
      canSkip={onboarding.canSkip}
      onSkip={onboarding.skipOnboarding}
    >
      <StepTransition
        stepKey={onboarding.currentStep}
        direction={onboarding.direction}
      >
        {renderStep()}
      </StepTransition>
    </OnboardingShell>
  )
}
