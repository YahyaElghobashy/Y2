"use client"

import { cn } from "@/lib/utils"

type BadgeVariant = "milestone" | "copper" | "reminder" | "birthday"

interface EventCardProps {
  title: string
  date: string
  badge?: BadgeVariant
  emoji?: string
  className?: string
  onClick?: () => void
}

const badgeStyles: Record<BadgeVariant, string> = {
  milestone: "bg-[var(--gold,#DAA520)]/15 text-[var(--gold,#DAA520)]",
  copper: "bg-[var(--accent-copper,#B87333)]/15 text-[var(--accent-copper,#B87333)]",
  reminder: "bg-[var(--dusk-blue,#7EC8E3)]/15 text-[var(--dusk-blue,#7EC8E3)]",
  birthday: "bg-[var(--rose,#F4A8B8)]/15 text-[var(--rose,#F4A8B8)]",
}

const badgeLabels: Record<BadgeVariant, string> = {
  milestone: "Milestone",
  copper: "Date",
  reminder: "Reminder",
  birthday: "Birthday",
}

export function EventCard({
  title,
  date,
  badge,
  emoji,
  className,
  onClick,
}: EventCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl w-full text-start",
        "bg-[var(--bg-elevated,#FFFFFF)] border border-[var(--border-subtle)] shadow-warm-sm",
        "hover:shadow-warm-md transition-shadow",
        className
      )}
    >
      {emoji && (
        <span className="text-xl shrink-0">{emoji}</span>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[var(--text-primary,#2C2825)] truncate">
          {title}
        </p>
        <p className="text-[12px] text-[var(--text-muted,#B5ADA4)] font-mono mt-0.5">
          {date}
        </p>
      </div>

      {badge && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            badgeStyles[badge]
          )}
        >
          {badgeLabels[badge]}
        </span>
      )}
    </button>
  )
}
