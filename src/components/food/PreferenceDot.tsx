"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { PreferenceDotColor } from "@/lib/types/food-journal.types"

type PreferenceDotProps = {
  color: PreferenceDotColor
  myScore?: number
  partnerScore?: number
  className?: string
}

export function PreferenceDot({
  color,
  myScore,
  partnerScore,
  className,
}: PreferenceDotProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        data-testid="preference-dot"
        data-color={color}
        onPointerDown={() => setShowTooltip(true)}
        onPointerUp={() => setShowTooltip(false)}
        onPointerLeave={() => setShowTooltip(false)}
        className={cn(
          "h-2 w-2 rounded-full",
          color === "me" && "bg-[#E85D75]",
          color === "partner" && "bg-[#7EC8E3]",
          color === "similar" && "preference-dot-pulse"
        )}
        aria-label={
          color === "me"
            ? "You rated higher"
            : color === "partner"
              ? "Partner rated higher"
              : "Similar rating"
        }
      />

      {/* Tooltip on long-press */}
      {showTooltip && myScore !== undefined && partnerScore !== undefined && (
        <div
          data-testid="preference-tooltip"
          className="absolute bottom-full start-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-[var(--text-primary,#2C2825)] px-2.5 py-1 text-[11px] text-white shadow-md z-10"
        >
          You: {myScore} · Partner: {partnerScore}
          <div className="absolute top-full start-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--text-primary,#2C2825)]" />
        </div>
      )}

      <style jsx>{`
        .preference-dot-pulse {
          background: linear-gradient(135deg, #E85D75, #7EC8E3);
          background-size: 200% 200%;
          animation: dotPulse 2s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .preference-dot-pulse {
            animation: none;
            background-position: 50% 50%;
          }
        }
      `}</style>
    </div>
  )
}
