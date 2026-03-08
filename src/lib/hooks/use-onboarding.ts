"use client"

import { useState, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  ONBOARDING_STEPS,
  TOUR_STEPS,
  type OnboardingStep,
  type StepDirection,
  type UseOnboardingReturn,
} from "@/lib/types/onboarding.types"

export function useOnboarding(): UseOnboardingReturn {
  const { user, profile, refreshProfile } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const initialStep = (profile?.onboarding_step as OnboardingStep) ?? "welcome"

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep)
  const [direction, setDirection] = useState<StepDirection>("forward")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stepIndex = ONBOARDING_STEPS.indexOf(currentStep)
  const totalSteps = ONBOARDING_STEPS.length
  const progress = totalSteps > 1 ? stepIndex / (totalSteps - 1) : 0
  const isComplete = !!profile?.onboarding_completed_at
  const isTourStep = TOUR_STEPS.includes(currentStep)
  const canSkip = true // Allow skip from any step (was: isTourStep)

  const persistStep = useCallback(
    async (step: OnboardingStep, completedAt?: string) => {
      if (!user) return

      const updateData: Record<string, unknown> = { onboarding_step: step }
      if (completedAt) {
        updateData.onboarding_completed_at = completedAt
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }
    },
    [user, supabase]
  )

  const goNext = useCallback(async () => {
    const nextIndex = stepIndex + 1
    if (nextIndex >= totalSteps) return

    setIsLoading(true)
    setError(null)
    setDirection("forward")

    try {
      const nextStep = ONBOARDING_STEPS[nextIndex]
      await persistStep(nextStep)
      setCurrentStep(nextStep)
      await refreshProfile()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save progress")
    } finally {
      setIsLoading(false)
    }
  }, [stepIndex, totalSteps, persistStep, refreshProfile])

  const goBack = useCallback(async () => {
    const prevIndex = stepIndex - 1
    if (prevIndex < 0) return

    setIsLoading(true)
    setError(null)
    setDirection("backward")

    try {
      const prevStep = ONBOARDING_STEPS[prevIndex]
      await persistStep(prevStep)
      setCurrentStep(prevStep)
      await refreshProfile()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save progress")
    } finally {
      setIsLoading(false)
    }
  }, [stepIndex, persistStep, refreshProfile])

  const completeOnboarding = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const now = new Date().toISOString()
      await persistStep("ready", now)
      setCurrentStep("ready")
      await refreshProfile()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete onboarding")
    } finally {
      setIsLoading(false)
    }
  }, [persistStep, refreshProfile])

  const skipOnboarding = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setDirection("forward")

    try {
      const now = new Date().toISOString()
      await persistStep("ready", now)
      setCurrentStep("ready")
      await refreshProfile()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to skip onboarding")
    } finally {
      setIsLoading(false)
    }
  }, [persistStep, refreshProfile])

  return useMemo(
    () => ({
      currentStep,
      stepIndex,
      totalSteps,
      progress,
      isComplete,
      isTourStep,
      canSkip,
      direction,
      goNext,
      goBack,
      completeOnboarding,
      skipOnboarding,
      isLoading,
      error,
    }),
    [
      currentStep,
      stepIndex,
      totalSteps,
      progress,
      isComplete,
      isTourStep,
      canSkip,
      direction,
      goNext,
      goBack,
      completeOnboarding,
      skipOnboarding,
      isLoading,
      error,
    ]
  )
}
