"use client"

import { TrendingUp, TrendingDown, Coins } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { StaggerList } from "@/components/animations"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { cn } from "@/lib/utils"
import type { CoyynsTransaction } from "@/lib/types/coyyns.types"

type CoyynsHistoryProps = {
  transactions?: CoyynsTransaction[]
  limit?: number
  compact?: boolean
  className?: string
}

function formatRelativeTime(isoDate: string): string {
  try {
    return formatDistanceToNow(new Date(isoDate), { addSuffix: true })
  } catch {
    return ""
  }
}

export function CoyynsHistory({
  transactions: transactionsProp,
  limit = 50,
  compact = false,
  className,
}: CoyynsHistoryProps) {
  const {
    transactions: hookTransactions,
    isLoading,
    error,
  } = useCoyyns()

  const useHookData = transactionsProp === undefined
  const resolvedTransactions = useHookData ? hookTransactions : transactionsProp
  const displayTransactions = resolvedTransactions.slice(0, limit)

  // Loading state — only when using hook data
  if (useHookData && isLoading) {
    return <LoadingSkeleton variant="list-item" count={3} className={className} />
  }

  // Error state — fail silently with EmptyState
  if (useHookData && error) {
    if (process.env.NODE_ENV === "development") {
      console.error("CoyynsHistory: useCoyyns error:", error)
    }
    return (
      <EmptyState
        icon={<Coins size={48} strokeWidth={1.5} />}
        title="No CoYYns yet"
        subtitle="Acts of care will appear here"
        className={className}
      />
    )
  }

  // Empty state
  if (displayTransactions.length === 0) {
    return (
      <EmptyState
        icon={<Coins size={48} strokeWidth={1.5} />}
        title="No CoYYns yet"
        subtitle="Acts of care will appear here"
        className={className}
      />
    )
  }

  return (
    <StaggerList
      staggerDelay={0.04}
      className={cn("overflow-y-auto", className)}
      role="list"
    >
      {displayTransactions.map((tx, index) => {
        const isEarn = tx.type === "earn"
        const isLast = index === displayTransactions.length - 1

        return (
          <div
            key={tx.id}
            role="listitem"
            className={cn(
              "flex items-center bg-white",
              compact ? "py-2 px-3" : "py-3 px-4",
              !isLast && "border-b border-[rgba(184,115,51,0.06)]"
            )}
          >
            {/* Direction icon */}
            <div
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{
                width: 32,
                height: 32,
                backgroundColor: isEarn
                  ? "rgba(124,182,124,0.12)"
                  : "rgba(194,112,112,0.12)",
              }}
            >
              {isEarn ? (
                <TrendingUp
                  size={16}
                  className="text-[var(--success)]"
                  aria-hidden="true"
                />
              ) : (
                <TrendingDown
                  size={16}
                  className="text-[var(--error)]"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Text column */}
            <div className={cn("flex min-w-0 flex-1 flex-col", compact ? "ms-2" : "ms-3")}>
              <span
                className={cn(
                  "truncate font-body text-[var(--text-primary)]",
                  compact ? "text-[13px]" : "text-[14px]"
                )}
              >
                {tx.description ?? ""}
              </span>
              {(!compact || !transactionsProp) && (
                <span className="text-[11px] font-body text-[var(--text-muted)]">
                  {tx.category}
                  {" \u00B7 "}
                  {formatRelativeTime(tx.created_at)}
                </span>
              )}
            </div>

            {/* Amount */}
            <span
              className={cn(
                "shrink-0 font-mono font-bold tabular-nums",
                compact ? "ms-2 text-[13px]" : "ms-3 text-[14px]",
                isEarn ? "text-[var(--success)]" : "text-[var(--error)]"
              )}
            >
              {isEarn ? "+" : "\u2212"}
              {Math.abs(tx.amount)}
            </span>
          </div>
        )
      })}
    </StaggerList>
  )
}
