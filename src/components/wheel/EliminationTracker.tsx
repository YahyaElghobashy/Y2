"use client"

import { cn } from "@/lib/utils"
import type { WheelItem } from "@/lib/types/wheel.types"

type EliminationTrackerProps = {
  allItems: WheelItem[]
  remainingItems: WheelItem[]
  className?: string
}

export function EliminationTracker({
  allItems,
  remainingItems,
  className,
}: EliminationTrackerProps) {
  const remainingIds = new Set(remainingItems.map((i) => i.id))
  const isFinalRound = remainingItems.length <= 2

  return (
    <div data-testid="elimination-tracker" className={cn("flex flex-col gap-2", className)}>
      {isFinalRound && (
        <div
          data-testid="final-round-banner"
          className="rounded-xl bg-[var(--accent-soft,#E8D5C0)] py-2 text-center text-[13px] font-semibold text-[var(--accent-primary,#C4956A)]"
        >
          FINAL ROUND!
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {allItems.map((item) => {
          const isEliminated = !remainingIds.has(item.id)
          return (
            <span
              key={item.id}
              data-testid={`tracker-item-${item.id}`}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium transition-all",
                isEliminated
                  ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] line-through opacity-60"
                  : "bg-[var(--accent-soft,#E8D5C0)] text-[var(--accent-primary,#C4956A)]"
              )}
            >
              {item.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
