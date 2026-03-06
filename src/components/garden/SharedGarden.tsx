"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useGarden } from "@/lib/hooks/use-garden"

type SharedGardenProps = {
  compact?: boolean
  className?: string
}

export function SharedGarden({ compact = false, className }: SharedGardenProps) {
  const { gardenDays, recentFlowers, isLoading } = useGarden()

  if (isLoading) return null

  const displayDays = compact ? recentFlowers.slice(0, 8) : gardenDays

  if (displayDays.length === 0) {
    return (
      <div
        data-testid="shared-garden"
        className={cn(
          "rounded-2xl p-5 text-center",
          className,
        )}
        style={{
          backgroundColor: "white",
          border: "1px solid rgba(184,115,51,0.06)",
          boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
        }}
      >
        <p
          className="text-sm font-[family-name:var(--font-body)]"
          style={{ color: "var(--text-muted, #B5ADA4)" }}
        >
          Open the app together to grow your garden
        </p>
      </div>
    )
  }

  return (
    <div
      data-testid="shared-garden"
      className={cn(
        compact
          ? "rounded-2xl p-4"
          : "p-4",
        className,
      )}
      style={compact ? {
        backgroundColor: "white",
        border: "1px solid rgba(184,115,51,0.06)",
        boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
      } : undefined}
    >
      {!compact && (
        <h2
          className="text-base font-semibold mb-3 font-[family-name:var(--font-display)]"
          style={{ color: "var(--text-primary)" }}
        >
          Our Garden
        </h2>
      )}

      <div
        data-testid="garden-grid"
        className={cn(
          "grid gap-1",
          compact ? "grid-cols-8" : "grid-cols-8",
        )}
      >
        {displayDays.map((day, index) => {
          const hasFlower = !!day.flower_type
          const isPartial =
            (day.yahya_opened || day.yara_opened) && !hasFlower

          return (
            <motion.div
              key={day.id}
              data-testid={`garden-cell-${index}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: index * 0.03,
                duration: 0.3,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className={cn(
                "flex items-center justify-center rounded-md aspect-square text-lg",
                hasFlower
                  ? ""
                  : isPartial
                    ? "bg-[var(--color-bg-secondary)]"
                    : "bg-[var(--color-bg-tertiary)]",
              )}
              title={day.garden_date}
            >
              {hasFlower ? (
                <span data-testid={`flower-${index}`}>{day.flower_type}</span>
              ) : isPartial ? (
                <span data-testid={`seedling-${index}`}>🌱</span>
              ) : null}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
