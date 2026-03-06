"use client"

import { TourStep, type TourStepConfig } from "./TourStep"

type TourMoreStepProps = {
  onNext: () => Promise<void>
  onBack: () => Promise<void>
}

const CONFIG: TourStepConfig = {
  tabLabel: "More",
  selector: "[data-testid='nav-tab-more']",
  shape: "circle",
  padding: 12,
  tooltipPosition: "top",
  title: "More",
  description:
    "Settings, preferences, and everything else. Customize your experience, manage notifications, and more.",
  pulseTarget: false,
  stepNumber: 5,
  totalTourSteps: 5,
  isFirstTourStep: false,
  isLastTourStep: true,
  lastButtonText: "Finish Tour \u2192",
  lastButtonClassName: "shadow-[0_0_12px_rgba(196,149,106,0.4)]",
}

export function TourMoreStep({ onNext, onBack }: TourMoreStepProps) {
  return <TourStep config={CONFIG} onNext={onNext} onBack={onBack} />
}
