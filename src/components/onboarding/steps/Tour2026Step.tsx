"use client"

import { TourStep, type TourStepConfig } from "./TourStep"

type Tour2026StepProps = {
  onNext: () => Promise<void>
  onBack: () => Promise<void>
}

const CONFIG: TourStepConfig = {
  tabLabel: "2026",
  selector: "[data-testid='nav-tab-2026']",
  shape: "pill",
  padding: 14,
  tooltipPosition: "top",
  title: "2026",
  description:
    "Your shared vision board. Set goals together, track progress, and dream about what\u2019s next — all in one place.",
  pulseTarget: true,
  stepNumber: 3,
  totalTourSteps: 5,
  isFirstTourStep: false,
  isLastTourStep: false,
}

export function Tour2026Step({ onNext, onBack }: Tour2026StepProps) {
  return <TourStep config={CONFIG} onNext={onNext} onBack={onBack} />
}
