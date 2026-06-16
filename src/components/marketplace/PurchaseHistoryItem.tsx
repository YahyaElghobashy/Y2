"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { PurchaseHistoryEntry } from "@/lib/hooks/use-purchase-history"

type PurchaseHistoryItemProps = {
  purchase: PurchaseHistoryEntry
  className?: string
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  declined: "Declined",
  expired: "Expired",
  active: "Active",
  pending: "New",
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-accent-soft text-accent-primary",
  declined: "bg-bg-secondary text-text-secondary",
  expired: "bg-bg-secondary text-text-muted",
  active: "bg-accent-soft text-accent-primary",
  pending: "bg-accent-soft text-accent-primary",
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function PurchaseHistoryItem({ purchase, className }: PurchaseHistoryItemProps) {
  const { user } = useAuth()
  const item = purchase.marketplace_items
  const isBuyer = user?.id === purchase.buyer_id
  const status = purchase.status
  const dateLabel = formatDate(purchase.completed_at ?? purchase.created_at)

  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-3",
        className
      )}
      data-testid="purchase-history-item"
      data-status={status}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-[22px] leading-none" aria-hidden>
        {item?.icon ?? "🪙"}
      </span>

      <div className="flex-1 min-w-0">
        <p className="truncate text-[14px] font-medium text-text-primary font-body">
          {item?.name ?? "Purchase"}
        </p>
        <p className="text-[12px] text-text-secondary font-body">
          {isBuyer ? "You sent" : "From your partner"}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </p>
      </div>

      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-medium font-body",
          STATUS_STYLES[status] ?? "bg-bg-secondary text-text-secondary"
        )}
        data-testid="history-status-badge"
      >
        {STATUS_LABELS[status] ?? status}
      </span>
    </motion.div>
  )
}
