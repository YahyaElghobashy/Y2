"use client"

import { cn } from "@/lib/utils"
import { getCategoryColor, getCategoryLabel } from "@/lib/calendar-constants"
import type { EventCategory } from "@/lib/types/calendar.types"

type EventCategoryBadgeProps = {
  category: EventCategory
  variant: "dot" | "pill"
  className?: string
}

export function EventCategoryBadge({ category, variant, className }: EventCategoryBadgeProps) {
  const color = getCategoryColor(category)
  const label = getCategoryLabel(category)

  if (variant === "dot") {
    return (
      <span
        className={cn("inline-block w-2 h-2 rounded-full shrink-0", className)}
        style={{ backgroundColor: color }}
        data-testid={`category-dot-${category}`}
        aria-label={label}
      />
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "text-[12px] font-medium font-[family-name:var(--font-body)]",
        className
      )}
      style={{
        backgroundColor: `${color}1A`,
        color: color,
      }}
      data-testid={`category-pill-${category}`}
    >
      {label}
    </span>
  )
}
