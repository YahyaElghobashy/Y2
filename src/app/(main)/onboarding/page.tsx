"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "@/lib/hooks/use-onboarding"
import { useAuth } from "@/lib/providers/AuthProvider"
import { OnboardingShell } from "@/components/onboarding/OnboardingShell"
import { StepTransition } from "@/components/onboarding/StepTransition"
import { WelcomeStep } from "@/components/onboarding/steps/WelcomeStep"
import { ProfileStep } from "@/components/onboarding/steps/ProfileStep"
import { PairingStep } from "@/components/onboarding/steps/PairingStep"
import { TourHomeStep } from "@/components/onboarding/steps/TourHomeStep"
import { TourUsStep } from "@/components/onboarding/steps/TourUsStep"
import { Tour2026Step } from "@/components/onboarding/steps/Tour2026Step"
import { TourMeStep } from "@/components/onboarding/steps/TourMeStep"
import { TourMoreStep } from "@/components/onboarding/steps/TourMoreStep"
import { ReadyStep } from "@/components/onboarding/steps/ReadyStep"
import { AlertCircle } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const { isLoading: authLoading } = useAuth()
  const onboarding = useOnboarding()

  // Deep link code forwarding (e.g. /onboarding?code=ABC123)
  const [initialCode, setInitialCode] = useState<string | null>(null)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code")
    if (code) setInitialCode(code)
  }, [])

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
            initialCode={initialCode}
          />
        )
      case "tour_home":
        return (
          <TourHomeStep
            onNext={onboarding.goNext}
            onBack={onboarding.goBack}
          />
        )
      case "tour_us":
        return (
          <TourUsStep
            onNext={onboarding.goNext}
            onBack={onboarding.goBack}
          />
        )
      case "tour_2026":
        return (
          <Tour2026Step
            onNext={onboarding.goNext}
            onBack={onboarding.goBack}
          />
        )
      case "tour_me":
        return (
          <TourMeStep
            onNext={onboarding.goNext}
            onBack={onboarding.goBack}
          />
        )
      case "tour_more":
        return (
          <TourMoreStep
            onNext={onboarding.goNext}
            onBack={onboarding.goBack}
          />
        )
      case "ready":
        return <ReadyStep onComplete={onboarding.completeOnboarding} />
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
      {/* Error banner */}
      {onboarding.error && (
        <div
          className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-[var(--color-error-bg,rgba(220,38,38,0.08))] px-4 py-3"
          data-testid="onboarding-error-banner"
        >
          <AlertCircle size={16} className="shrink-0 text-[var(--error)]" />
          <p className="flex-1 font-body text-[13px] text-[var(--error)]">
            {onboarding.error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="font-body text-[13px] font-medium text-[var(--color-accent-primary)] underline"
            data-testid="onboarding-error-retry"
          >
            Retry
          </button>
        </div>
      )}
      <StepTransition
        stepKey={onboarding.currentStep}
        direction={onboarding.direction}
      >
        {renderStep()}
      </StepTransition>
    </OnboardingShell>
  )
}
