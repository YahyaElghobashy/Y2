"use client"

import { cn } from "@/lib/utils"

type SendLimitIndicatorProps = {
  remainingSends: number
  bonusSends?: number
  onBuyMore?: () => void
  className?: string
}

export function SendLimitIndicator({
  remainingSends,
  bonusSends = 0,
  onBuyMore,
  className,
}: SendLimitIndicatorProps) {
  const total = remainingSends + bonusSends
  const colorClass =
    total >= 2
      ? "text-[var(--success)]"
      : total === 1
        ? "text-[var(--warning)]"
        : "text-[var(--error)]"

  const dotColor =
    total >= 2
      ? "bg-[var(--success)]"
      : total === 1
        ? "bg-[var(--warning)]"
        : "bg-[var(--error)]"

  const emptyDotColor = "bg-[var(--text-muted)] opacity-30"

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      data-testid="send-limit-indicator"
    >
      {/* Dots */}
      <div className="flex items-center gap-1">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              i < total ? dotColor : emptyDotColor
            )}
            data-testid={`send-dot-${i}`}
          />
        ))}
      </div>

      {/* Text */}
      <span
        className={cn(
          "text-[12px] font-[var(--font-body)]",
          colorClass
        )}
        data-testid="send-limit-text"
      >
        {total} send{total !== 1 ? "s" : ""} left
      </span>

      {/* Buy more link */}
      {remainingSends <= 0 && onBuyMore && (
        <button
          type="button"
          onClick={onBuyMore}
          className="text-[12px] font-medium font-[var(--font-body)] text-accent-primary underline underline-offset-2"
          data-testid="send-buy-more"
        >
          Buy more
        </button>
      )}
    </div>
  )
}
