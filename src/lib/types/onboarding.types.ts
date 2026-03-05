export const ONBOARDING_STEPS = [
  "welcome",
  "profile",
  "pairing",
  "tour_home",
  "tour_us",
  "tour_2026",
  "tour_me",
  "tour_more",
  "ready",
] as const

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export const TOUR_STEPS: OnboardingStep[] = [
  "tour_home",
  "tour_us",
  "tour_2026",
  "tour_me",
  "tour_more",
]

export type StepDirection = "forward" | "backward"

export type UseOnboardingReturn = {
  currentStep: OnboardingStep
  stepIndex: number
  totalSteps: number
  progress: number
  isComplete: boolean
  isTourStep: boolean
  canSkip: boolean
  direction: StepDirection
  goNext: () => Promise<void>
  goBack: () => Promise<void>
  completeOnboarding: () => Promise<void>
  skipOnboarding: () => Promise<void>
  isLoading: boolean
  error: string | null
}
