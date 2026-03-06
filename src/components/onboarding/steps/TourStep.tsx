"use client"

import { useEffect } from "react"
import { useSpotlight, type SpotlightTarget } from "@/lib/hooks/use-spotlight"
import { SpotlightOverlay } from "@/components/onboarding/SpotlightOverlay"
import { BottomNavPreview } from "@/components/onboarding/BottomNavPreview"

export type TourStepConfig = {
  tabLabel: string
  selector: string
  shape: SpotlightTarget["shape"]
  padding: number
  tooltipPosition: SpotlightTarget["tooltipPosition"]
  title: string
  description: string
  pulseTarget: boolean
  stepNumber: number
  totalTourSteps: number
  isFirstTourStep: boolean
  isLastTourStep: boolean
  lastButtonText?: string
  lastButtonClassName?: string
}

type TourStepProps = {
  config: TourStepConfig
  onNext: () => Promise<void>
  onBack: () => Promise<void>
}

export function TourStep({ config, onNext, onBack }: TourStepProps) {
  const spotlight = useSpotlight({
    targets: [
      {
        selector: config.selector,
        shape: config.shape,
        padding: config.padding,
        tooltipPosition: config.tooltipPosition,
        title: config.title,
        description: config.description,
        pulseTarget: config.pulseTarget,
      },
    ],
    onComplete: onNext,
  })

  // Auto-start spotlight after BottomNavPreview renders
  useEffect(() => {
    const timer = setTimeout(() => spotlight.start(), 150)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div data-testid={`tour-step-${config.tabLabel.toLowerCase()}`}>
      <BottomNavPreview highlightLabel={config.tabLabel} />
      {spotlight.isActive && (
        <SpotlightOverlay
          target={spotlight.currentTarget}
          targetRect={spotlight.targetRect}
          currentIndex={config.stepNumber - 1}
          totalTargets={config.totalTourSteps}
          onNext={onNext}
          onBack={config.isFirstTourStep ? () => {} : onBack}
          onDismiss={onNext}
          lastButtonText={config.lastButtonText}
          lastButtonClassName={config.lastButtonClassName}
        />
      )}
    </div>
  )
}
