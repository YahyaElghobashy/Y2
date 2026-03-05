"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { SpotlightTarget } from "@/lib/hooks/use-spotlight"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]
const OVERLAY_COLOR = "rgba(44, 40, 37, 0.6)"
const PULSE_COLOR = "rgba(196, 149, 106, 0.3)"

type SpotlightOverlayProps = {
  target: SpotlightTarget | null
  targetRect: DOMRect | null
  currentIndex: number
  totalTargets: number
  onNext: () => void
  onBack: () => void
  onDismiss: () => void
}

function getHoleParams(
  rect: DOMRect | null,
  shape: SpotlightTarget["shape"],
  padding: number
) {
  if (!rect) {
    return { cx: 0, cy: 0, rx: 0, ry: 0, x: 0, y: 0, width: 0, height: 0, borderRadius: 0 }
  }

  const x = rect.left - padding
  const y = rect.top - padding
  const width = rect.width + padding * 2
  const height = rect.height + padding * 2
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  if (shape === "circle") {
    const r = Math.max(width, height) / 2
    return { cx, cy, rx: r, ry: r, x, y, width, height, borderRadius: r }
  }

  if (shape === "pill") {
    const r = height / 2
    return { cx, cy, rx: width / 2, ry: r, x, y, width, height, borderRadius: r }
  }

  // rect
  return { cx, cy, rx: width / 2, ry: height / 2, x, y, width, height, borderRadius: 12 }
}

function getTooltipStyle(
  rect: DOMRect | null,
  position: SpotlightTarget["tooltipPosition"],
  padding: number
): React.CSSProperties {
  if (!rect) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }

  const gap = 16
  const tooltipWidth = 280

  switch (position) {
    case "top":
      return {
        left: rect.left + rect.width / 2 - tooltipWidth / 2,
        top: rect.top - padding - gap,
        transform: "translateY(-100%)",
      }
    case "bottom":
      return {
        left: rect.left + rect.width / 2 - tooltipWidth / 2,
        top: rect.bottom + padding + gap,
      }
    case "left":
      return {
        left: rect.left - padding - gap,
        top: rect.top + rect.height / 2,
        transform: "translate(-100%, -50%)",
      }
    case "right":
      return {
        left: rect.right + padding + gap,
        top: rect.top + rect.height / 2,
        transform: "translateY(-50%)",
      }
  }
}

export function SpotlightOverlay({
  target,
  targetRect,
  currentIndex,
  totalTargets,
  onNext,
  onBack,
  onDismiss,
}: SpotlightOverlayProps) {
  const padding = target?.padding ?? 8
  const shape = target?.shape ?? "rect"
  const showPulse = target?.pulseTarget !== false

  const hole = useMemo(
    () => getHoleParams(targetRect, shape, padding),
    [targetRect, shape, padding]
  )

  const tooltipStyle = useMemo(
    () => getTooltipStyle(targetRect, target?.tooltipPosition ?? "bottom", padding),
    [targetRect, target?.tooltipPosition, padding]
  )

  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalTargets - 1

  if (!target) return null

  return (
    <div className="fixed inset-0 z-[9999]" data-testid="spotlight-overlay">
      {/* SVG Mask overlay */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              fill="black"
              rx={hole.borderRadius}
              initial={{ x: window.innerWidth / 2, y: window.innerHeight / 2, width: 0, height: 0 }}
              animate={{ x: hole.x, y: hole.y, width: hole.width, height: hole.height }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={OVERLAY_COLOR}
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Pulse ring */}
      {showPulse && targetRect && (
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: hole.cx - hole.rx - 4,
            top: hole.cy - hole.ry - 4,
            width: (hole.rx + 4) * 2,
            height: (hole.ry + 4) * 2,
            border: `2px solid ${PULSE_COLOR}`,
            borderRadius: shape === "rect" ? hole.borderRadius + 4 : "50%",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          data-testid="spotlight-pulse"
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute z-10 w-[280px] rounded-2xl border-t-2 border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] p-5 shadow-lg"
          style={tooltipStyle}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          data-testid="spotlight-tooltip"
        >
          {/* Step label */}
          <p
            className="mb-1 font-[family-name:var(--font-body)] text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]"
            data-testid="spotlight-step-label"
          >
            Step {currentIndex + 1} of {totalTargets}
          </p>

          {/* Title */}
          <h3
            className="mb-1 font-[family-name:var(--font-display)] text-[18px] font-bold text-[var(--color-text-primary)]"
            data-testid="spotlight-title"
          >
            {target.title}
          </h3>

          {/* Description */}
          <p
            className="mb-4 font-[family-name:var(--font-body)] text-[14px] leading-relaxed text-[var(--color-text-secondary)]"
            data-testid="spotlight-description"
          >
            {target.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {/* Step dots */}
            <div className="flex gap-1.5" data-testid="spotlight-dots">
              {Array.from({ length: totalTargets }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    i === currentIndex
                      ? "bg-[var(--color-accent-primary)]"
                      : "bg-[var(--color-border-subtle)]"
                  )}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={onBack}
                  className="rounded-lg px-3 py-1.5 font-[family-name:var(--font-body)] text-[13px] text-[var(--color-text-secondary)]"
                  data-testid="spotlight-back-btn"
                >
                  Back
                </button>
              )}
              <button
                onClick={isLast ? onDismiss : onNext}
                className="rounded-lg bg-[var(--color-accent-primary)] px-4 py-1.5 font-[family-name:var(--font-body)] text-[13px] font-medium text-white"
                data-testid="spotlight-next-btn"
              >
                {isLast ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
