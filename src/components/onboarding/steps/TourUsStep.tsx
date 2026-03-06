"use client"

import { TourStep, type TourStepConfig } from "./TourStep"

type TourUsStepProps = {
  onNext: () => Promise<void>
  onBack: () => Promise<void>
}

const CONFIG: TourStepConfig = {
  tabLabel: "Us",
  selector: "[data-testid='nav-tab-us']",
  shape: "circle",
  padding: 12,
  tooltipPosition: "top",
  title: "Us",
  description:
    "The fun zone. CoYYns, coupons, marketplace — everything that makes your relationship playful and rewarding.",
  pulseTarget: true,
  stepNumber: 2,
  totalTourSteps: 5,
  isFirstTourStep: false,
  isLastTourStep: false,
}

export function TourUsStep({ onNext, onBack }: TourUsStepProps) {
  return <TourStep config={CONFIG} onNext={onNext} onBack={onBack} />
}
