"use client"

import { useMemo } from "react"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { ChatBubble } from "@/components/ping/ChatBubble"
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
          <div className="mb-3 flex justify-center">
            <span
              className="rounded-full bg-[var(--bg-secondary)] px-3 py-0.5 font-nav text-[11px] text-[var(--text-muted)]"
              data-testid="date-header"
            >
              {group.label}
            </span>
          </div>

          {/* Pings as ChatBubbles */}
          <div className="flex flex-col gap-2">
            {group.pings.map((ping) => {
              const isSent = ping.sender_id === user?.id
              const displayMessage =
                ping.title && ping.title !== "Ping"
                  ? `${ping.title}\n${ping.body}`
                  : ping.body

              return (
                <ChatBubble
                  key={ping.id}
                  message={displayMessage}
                  timestamp={formatDistanceToNowStrict(
                    new Date(ping.created_at),
                    { addSuffix: true }
                  )}
                  direction={isSent ? "sent" : "received"}
                  emoji={ping.emoji || undefined}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
