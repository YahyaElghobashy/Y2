"use client"

import { TourStep, type TourStepConfig } from "./TourStep"

type TourMeStepProps = {
  onNext: () => Promise<void>
  onBack: () => Promise<void>
}

const CONFIG: TourStepConfig = {
  tabLabel: "Me",
  selector: "[data-testid='nav-tab-me']",
  shape: "circle",
  padding: 12,
  tooltipPosition: "top",
  title: "Me",
  description:
    "Your personal space. Body tracking, spiritual practice, journaling — the things that help you grow individually.",
  pulseTarget: true,
  stepNumber: 4,
  totalTourSteps: 5,
  isFirstTourStep: false,
  isLastTourStep: false,
}

export function TourMeStep({ onNext, onBack }: TourMeStepProps) {
  return <TourStep config={CONFIG} onNext={onNext} onBack={onBack} />
}
