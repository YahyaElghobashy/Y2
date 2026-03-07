"use client"

import Link from "next/link"
import { useRituals } from "@/lib/hooks/use-rituals"
import { cn } from "@/lib/utils"

type HomeRitualsWidgetProps = {
  className?: string
}

export function HomeRitualsWidget({ className }: HomeRitualsWidgetProps) {
  const { todayRituals, isLoading, isLoggedThisPeriod } = useRituals()

  if (isLoading || todayRituals.length === 0) return null

  const loggedCount = todayRituals.filter((r) => isLoggedThisPeriod(r.id)).length

  return (
    <div
      data-testid="home-rituals-widget"
      className={cn(
        "rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4",
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="font-body text-[14px] font-semibold text-[var(--text-primary)]">
          Rituals
        </p>
        <Link
          href="/me/rituals"
          className="text-[12px] font-medium text-[var(--accent-primary)]"
        >
          See All
        </Link>
      </div>

      {/* Ritual circles */}
      <div className="flex items-center gap-3 overflow-x-auto">
        {todayRituals.map((ritual) => {
          const logged = isLoggedThisPeriod(ritual.id)
          return (
            <div
              key={ritual.id}
              data-testid={`ritual-circle-${ritual.id}`}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-[18px] transition-colors",
                  logged
                    ? "bg-[var(--accent-primary)]"
                    : "bg-[var(--bg-secondary)]"
                )}
              >
                {ritual.icon}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] max-w-[48px] truncate text-center">
                {ritual.title}
              </span>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <p
        data-testid="rituals-summary"
        className="mt-2 text-[12px] text-[var(--text-muted)]"
      >
        {loggedCount}/{todayRituals.length} completed
      </p>
    </div>
  )
}
