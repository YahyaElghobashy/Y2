"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export type SpotlightShape = "rect" | "circle" | "pill"

export type SpotlightTarget = {
  selector: string
  shape: SpotlightShape
  padding?: number
  tooltipPosition: "top" | "bottom" | "left" | "right"
  title: string
  description: string
  pulseTarget?: boolean
}

export type UseSpotlightReturn = {
  isActive: boolean
  currentIndex: number
  totalTargets: number
  currentTarget: SpotlightTarget | null
  targetRect: DOMRect | null
  start: () => void
  next: () => void
  back: () => void
  dismiss: () => void
}

type UseSpotlightConfig = {
  targets: SpotlightTarget[]
  onComplete: () => void
}

export function useSpotlight({ targets, onComplete }: UseSpotlightConfig): UseSpotlightReturn {
  const [isActive, setIsActive] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  const currentTarget = isActive && currentIndex < targets.length ? targets[currentIndex] : null

  // Calculate target rect
  const updateRect = useCallback(() => {
    if (!currentTarget) {
      setTargetRect(null)
      return
    }

    const el = document.querySelector(currentTarget.selector)
    if (!el) {
      setTargetRect(null)
      return
    }

    // Scroll element into view
    el.scrollIntoView({ behavior: "smooth", block: "center" })

    // Get rect after scroll
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
    })
  }, [currentTarget])

  // Update rect on mount and when target changes
  useEffect(() => {
    if (!isActive || !currentTarget) return

    // Initial calculation with slight delay for scroll
    const timer = setTimeout(updateRect, 100)

    // Observe resize
    observerRef.current = new ResizeObserver(() => {
      updateRect()
    })
    observerRef.current.observe(document.body)

    // Recalculate on window resize (debounced)
    let resizeTimer: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateRect, 100)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      clearTimeout(timer)
      clearTimeout(resizeTimer)
      window.removeEventListener("resize", handleResize)
      observerRef.current?.disconnect()
    }
  }, [isActive, currentTarget, updateRect])

  // Scroll lock
  useEffect(() => {
    if (!isActive) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isActive])

  const start = useCallback(() => {
    setCurrentIndex(0)
    setIsActive(true)
  }, [])

  const next = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= targets.length) {
      setIsActive(false)
      onComplete()
    } else {
      setCurrentIndex(nextIndex)
    }
  }, [currentIndex, targets.length, onComplete])

  const back = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const dismiss = useCallback(() => {
    setIsActive(false)
    onComplete()
  }, [onComplete])

  return {
    isActive,
    currentIndex,
    totalTargets: targets.length,
    currentTarget,
    targetRect,
    start,
    next,
    back,
    dismiss,
  }
}
