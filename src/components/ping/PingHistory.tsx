"use client"

import { useMemo } from "react"
import { Bell, Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import {
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  format,
} from "date-fns"
import type { Notification } from "@/lib/types/notification.types"

type DateGroup = {
  label: string
  pings: Notification[]
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "MMM d")
}

function groupByDate(notifications: Notification[]): DateGroup[] {
  const groups: Map<string, Notification[]> = new Map()

  for (const n of notifications) {
    const label = getDateLabel(n.created_at)
    const existing = groups.get(label) ?? []
    existing.push(n)
    groups.set(label, existing)
  }

  return Array.from(groups.entries()).map(([label, pings]) => ({
    label,
    pings,
  }))
}

function StatusIcon({ status }: { status: string }) {
  if (status === "delivered") {
    return <CheckCheck size={12} className="text-[var(--info)]" data-testid="status-delivered" />
  }
  return <Check size={12} className="text-text-muted" data-testid="status-sent" />
}

function RelativeTime({ dateStr }: { dateStr: string }) {
  const label = formatDistanceToNowStrict(new Date(dateStr), {
    addSuffix: true,
  })
  return (
    <span className="text-[11px] font-[var(--font-body)] text-text-muted">
      {label}
    </span>
  )
}

export function PingHistory({ className }: { className?: string }) {
  const { user } = useAuth()
  const { notifications, isLoading } = useNotifications()

  const groups = useMemo(() => groupByDate(notifications), [notifications])

  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-3", className)} data-testid="ping-history-loading">
        <LoadingSkeleton variant="list-item" count={3} />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={48} strokeWidth={1.25} />}
        title="No pings yet"
        subtitle="Send one to get the conversation going!"
        className={className}
      />
    )
  }

  return (
    <div className={cn("flex flex-col gap-4", className)} data-testid="ping-history">
      {groups.map((group) => (
        <div key={group.label}>
          {/* Date header */}
          <div className="flex justify-center mb-3">
            <span
              className="text-[11px] font-[var(--font-body)] text-text-muted bg-[var(--bg-secondary)] rounded-full px-3 py-0.5"
              data-testid="date-header"
            >
              {group.label}
            </span>
          </div>

          {/* Pings */}
          <div className="flex flex-col gap-2">
            {group.pings.map((ping) => {
              const isSent = ping.sender_id === user?.id

              return (
                <div
                  key={ping.id}
                  className={cn(
                    "flex",
                    isSent ? "justify-end" : "justify-start"
                  )}
                  data-testid={isSent ? "ping-sent" : "ping-received"}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5",
                      isSent
                        ? "rounded-br-sm bg-[var(--accent-soft)]"
                        : "rounded-bl-sm bg-[var(--bg-elevated)]"
                    )}
                  >
                    {ping.title && ping.title !== "Ping" && (
                      <p className="text-[13px] font-semibold font-[var(--font-body)] text-text-primary mb-0.5">
                        {ping.emoji ? `${ping.emoji} ` : ""}{ping.title}
                      </p>
                    )}
                    <p className="text-[14px] font-[var(--font-body)] text-text-primary">
                      {ping.body}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <RelativeTime dateStr={ping.created_at} />
                      {isSent && <StatusIcon status={ping.status} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
