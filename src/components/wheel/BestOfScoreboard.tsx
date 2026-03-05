"use client"

import { cn } from "@/lib/utils"

type BestOfScoreboardProps = {
  tally: Record<string, number>
  target: number
  className?: string
}

export function BestOfScoreboard({
  tally,
  target,
  className,
}: BestOfScoreboardProps) {
  const entries = Object.entries(tally).sort((a, b) => b[1] - a[1])
  const maxWins = entries.length > 0 ? entries[0][1] : 0

  // Check for tie at max
  const topEntries = entries.filter(([, count]) => count === maxWins)
  const isTie = topEntries.length > 1 && maxWins > 0

  return (
    <div data-testid="best-of-scoreboard" className={cn("flex flex-col gap-2", className)}>
      {isTie && maxWins >= target - 1 && (
        <div
          data-testid="sudden-death-banner"
          className="rounded-xl bg-red-50 py-2 text-center text-[13px] font-semibold text-red-500"
        >
          SUDDEN DEATH!
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {entries.map(([label, count]) => (
          <div
            key={label}
            data-testid={`score-${label}`}
            className="flex items-center justify-between rounded-xl bg-[var(--bg-elevated,#FFFFFF)] px-3 py-2 shadow-sm"
          >
            <span className="text-[13px] font-medium text-[var(--text-primary)]">
              {label}
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: target }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-3 w-3 rounded-full",
                    i < count
                      ? "bg-[var(--accent-primary,#C4956A)]"
                      : "bg-[var(--bg-secondary)]"
                  )}
                />
              ))}
              <span className="ms-2 text-[12px] font-semibold text-[var(--text-muted)]">
                {count}/{target}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
