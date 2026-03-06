"use client"

import { TourStep, type TourStepConfig } from "./TourStep"

type TourHomeStepProps = {
  onNext: () => Promise<void>
  onBack: () => Promise<void>
}

const CONFIG: TourStepConfig = {
  tabLabel: "Home",
  selector: "[data-testid='nav-tab-home']",
  shape: "circle",
  padding: 12,
  tooltipPosition: "top",
  title: "Home",
  description:
    "Your daily dashboard. It changes with time of day, shows your CoYYns balance, upcoming events, and what\u2019s happening between you two.",
  pulseTarget: true,
  stepNumber: 1,
  totalTourSteps: 5,
  isFirstTourStep: true,
  isLastTourStep: false,
}

export function TourHomeStep({ onNext, onBack }: TourHomeStepProps) {
  return <TourStep config={CONFIG} onNext={onNext} onBack={onBack} />
}
