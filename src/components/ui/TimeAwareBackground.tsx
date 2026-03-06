"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface TimeAwareBackgroundProps {
  children: React.ReactNode
  className?: string
  photoSrc?: string
  photoOpacity?: number
}

function getTimeGradient(hour: number): string {
  // Morning (5-11): faint gold warmth
  if (hour >= 5 && hour < 12) {
    return "linear-gradient(135deg, #FBF7F4 0%, rgba(218,165,32,0.04) 50%, #F5EDE3 100%)"
  }
  // Afternoon (12-16): neutral cream
  if (hour >= 12 && hour < 17) {
    return "linear-gradient(180deg, #FBF7F4 0%, #F5EDE3 100%)"
  }
  // Evening (17-20): touch of rose
  if (hour >= 17 && hour < 21) {
    return "linear-gradient(135deg, #FBF7F4 0%, rgba(244,168,184,0.04) 50%, #F5EDE3 100%)"
  }
  // Night (21-4): darker cream
  return "linear-gradient(180deg, #F5EDE3 0%, #EDE0D0 100%)"
}

export function TimeAwareBackground({
  children,
  className,
  photoSrc,
  photoOpacity = 0.04,
}: TimeAwareBackgroundProps) {
  const gradient = useMemo(() => {
    const hour = new Date().getHours()
    return getTimeGradient(hour)
  }, [])

  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* Time-aware gradient layer */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: gradient }}
      />

      {/* Optional personal photo layer */}
      {photoSrc && (
        <div
          className="fixed inset-0 z-0 pointer-events-none bg-center bg-cover"
          style={{
            backgroundImage: `url(${photoSrc})`,
            filter: "blur(30px)",
            opacity: photoOpacity,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
