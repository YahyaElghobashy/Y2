"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Check, Clock, ShoppingBag, Volume2, Star, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { ActivePurchaseWithItem } from "@/lib/hooks/use-active-purchases"

type ActivePurchaseCardProps = {
  purchase: ActivePurchaseWithItem
  onAcknowledge: (id: string) => void
  onComplete: (id: string) => void
  onDecline: (id: string) => void
  className?: string
}

const EFFECT_ICONS: Record<string, typeof ShoppingBag> = {
  extra_ping: Volume2,
  veto: Star,
  task_order: Check,
  dnd_timer: Timer,
  wildcard: ShoppingBag,
}

function getTimeRemaining(createdAt: string, durationMinutes: number): { minutes: number; seconds: number; expired: boolean } {
  const endTime = new Date(createdAt).getTime() + durationMinutes * 60 * 1000
  const now = Date.now()
  const remaining = Math.max(0, endTime - now)
  return {
    minutes: Math.floor(remaining / 60000),
    seconds: Math.floor((remaining % 60000) / 1000),
    expired: remaining <= 0,
  }
}

function DNDCountdown({ createdAt, durationMinutes }: { createdAt: string; durationMinutes: number }) {
  const [time, setTime] = useState(() => getTimeRemaining(createdAt, durationMinutes))

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(createdAt, durationMinutes)
      setTime(remaining)
      if (remaining.expired) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [createdAt, durationMinutes])

  const totalSeconds = durationMinutes * 60
  const elapsed = totalSeconds - (time.minutes * 60 + time.seconds)
  const progress = Math.min(1, elapsed / totalSeconds)
  const circumference = 2 * Math.PI * 52
  const offset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-2" data-testid="dnd-countdown">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60" cy="60" r="52"
          fill="none"
          stroke="var(--color-border-subtle, rgba(44,40,37,0.08))"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx="60" cy="60" r="52"
          fill={time.expired ? "var(--accent-primary, #C4956A)" : "none"}
          fillOpacity={time.expired ? 0.1 : 0}
          stroke="var(--accent-primary, #C4956A)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        {/* Timer text */}
        <text
          x="60" y="60"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[var(--color-text-primary,#2C2825)]"
          style={{ fontSize: "20px", fontFamily: "var(--font-mono)" }}
        >
          {time.expired ? "Done!" : `${String(time.minutes).padStart(2, "0")}:${String(time.seconds).padStart(2, "0")}`}
        </text>
      </svg>
      {time.expired && (
        <p className="text-[13px] text-[var(--color-text-secondary,#8C8279)]">
          Time&apos;s up!
        </p>
      )}
    </div>
  )
}

export function ActivePurchaseCard({
  purchase,
  onAcknowledge,
  onComplete,
  onDecline,
  className,
}: ActivePurchaseCardProps) {
  const { user } = useAuth()
  const item = purchase.marketplace_items
  const effectType = item.effect_type
  const payload = purchase.effect_payload as Record<string, unknown> | null
  const isTarget = user?.id === purchase.target_id
  const Icon = EFFECT_ICONS[effectType] ?? ShoppingBag

  const effectConfig = useMemo(
    () => (item.effect_config ?? {}) as Record<string, unknown>,
    [item.effect_config]
  )

  return (
    <motion.div
      className={cn(
        "rounded-xl border border-[var(--color-border-subtle,rgba(44,40,37,0.08))] bg-[var(--color-bg-elevated,#FFFFFF)] p-4",
        className
      )}
      data-testid="active-purchase-card"
      data-effect-type={effectType}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft,#E8D5C0)]">
          <Icon className="h-5 w-5 text-[var(--accent-primary,#C4956A)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-semibold text-[var(--color-text-primary,#2C2825)] truncate">
            {item.name}
          </h4>
          <p className="text-[12px] text-[var(--color-text-secondary,#8C8279)]">
            {isTarget ? "From your partner" : "You sent this"}
          </p>
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-medium",
          purchase.status === "pending"
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-100 text-emerald-700"
        )}>
          {purchase.status === "pending" ? "New" : "Active"}
        </span>
      </div>

      {/* Effect-specific content */}
      {effectType === "dnd_timer" && (
        <DNDCountdown
          createdAt={purchase.created_at}
          durationMinutes={(effectConfig.duration_minutes as number) ?? 60}
        />
      )}

      {effectType === "veto" && payload && (
        <div className="mb-3 rounded-lg bg-[var(--color-bg-secondary,#F5F0E8)] p-3">
          <p className="text-[14px] text-[var(--color-text-primary,#2C2825)]">
            {String(payload.movie ?? payload.input ?? "Partner's choice")}
          </p>
        </div>
      )}

      {effectType === "task_order" && (
        <div className="mb-3">
          <p className="text-[14px] text-[var(--color-text-primary,#2C2825)] mb-1">
            {String(effectConfig.task_description ?? item.description ?? "Complete the task")}
          </p>
          {Boolean(effectConfig.deadline_hours) && (
            <div className="flex items-center gap-1 text-[12px] text-[var(--color-text-secondary,#8C8279)]">
              <Clock className="h-3 w-3" />
              <span>{String(effectConfig.deadline_hours)}h deadline</span>
            </div>
          )}
        </div>
      )}

      {effectType === "wildcard" && payload && (
        <div className="mb-3 rounded-lg bg-[var(--color-bg-secondary,#F5F0E8)] p-3">
          <p className="text-[14px] text-[var(--color-text-primary,#2C2825)]">
            {String(payload.input ?? payload.request ?? "Open-ended favor")}
          </p>
        </div>
      )}

      {effectType === "extra_ping" && (
        <p className="text-[13px] text-[var(--color-text-secondary,#8C8279)] mb-3">
          Bonus pings activated for today!
        </p>
      )}

      {/* Action buttons — only for target user */}
      {isTarget && purchase.status === "pending" && effectType !== "dnd_timer" && effectType !== "extra_ping" && (
        <div className="flex gap-2 mt-2">
          {effectType === "wildcard" ? (
            <>
              <button
                className="flex-1 rounded-lg bg-[var(--accent-primary,#C4956A)] px-3 py-2 text-[13px] font-semibold text-white"
                data-testid="accept-btn"
                onClick={() => onAcknowledge(purchase.id)}
              >
                Accept
              </button>
              <button
                className="flex-1 rounded-lg border border-[var(--color-border-subtle,rgba(44,40,37,0.08))] px-3 py-2 text-[13px] font-medium text-[var(--color-text-secondary,#8C8279)]"
                data-testid="decline-btn"
                onClick={() => onDecline(purchase.id)}
              >
                Decline
              </button>
            </>
          ) : (
            <button
              className="w-full rounded-lg bg-[var(--accent-primary,#C4956A)] px-3 py-2 text-[13px] font-semibold text-white"
              data-testid="acknowledge-btn"
              onClick={() => onAcknowledge(purchase.id)}
            >
              {effectType === "veto" ? "Got it" : "Acknowledge"}
            </button>
          )}
        </div>
      )}

      {/* Complete button for active tasks */}
      {isTarget && purchase.status === "active" && effectType === "task_order" && (
        <button
          className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-[13px] font-semibold text-white mt-2"
          data-testid="complete-btn"
          onClick={() => onComplete(purchase.id)}
        >
          Mark Complete
        </button>
      )}

      {/* Dismiss for DND and extra_ping when target */}
      {isTarget && purchase.status === "pending" && (effectType === "dnd_timer" || effectType === "extra_ping") && (
        <button
          className="w-full rounded-lg border border-[var(--color-border-subtle,rgba(44,40,37,0.08))] px-3 py-2 text-[13px] font-medium text-[var(--color-text-secondary,#8C8279)] mt-2"
          data-testid="dismiss-btn"
          onClick={() => onAcknowledge(purchase.id)}
        >
          Got it
        </button>
      )}
    </motion.div>
  )
}
