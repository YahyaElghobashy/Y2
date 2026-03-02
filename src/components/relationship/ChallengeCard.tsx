"use client"

import { motion } from "framer-motion"
import { Trophy, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ChallengeStatus = "pending" | "active" | "completed" | "declined"

type Participant = {
  name: string
  initial: string
}

type ChallengeCardProps = {
  title: string
  stakes: string
  status: ChallengeStatus
  participants: Participant[]
  onAccept?: () => void
  onDecline?: () => void
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "#FFF8E8", text: "#D4A04A" },
  active: { label: "Active", bg: "#E8F0F8", text: "#6B9EC4" },
  completed: { label: "Completed", bg: "#E8F5E8", text: "#7CB67C" },
  declined: { label: "Declined", bg: "#FDE8E8", text: "#C27070" },
} as const

export function ChallengeCard({
  title,
  stakes,
  status,
  participants,
  onAccept,
  onDecline,
  className,
}: ChallengeCardProps) {
  const statusConfig = STATUS_CONFIG[status]
  const isPending = status === "pending"

  return (
    <motion.div
      className={cn(
        "rounded-2xl bg-[var(--color-bg-elevated)] p-5 border border-[var(--color-border-subtle)] shadow-[0_2px_12px_rgba(44,40,37,0.06)]",
        className
      )}
      whileHover={{ scale: 1.02, boxShadow: "0 4px 24px rgba(44,40,37,0.10)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      {/* Header: icon + title + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
            <Trophy
              className="h-[18px] w-[18px] text-[var(--color-accent-primary)]"
              strokeWidth={1.75}
            />
          </div>
          <h3 className="pt-1.5 font-[family-name:var(--font-body)] text-[15px] font-semibold text-[var(--color-text-primary)]">
            {title}
          </h3>
        </div>

        <span
          className="shrink-0 rounded-lg px-2.5 py-1 font-[family-name:var(--font-body)] text-[12px] font-medium"
          style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
          data-testid="status-badge"
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Stakes */}
      <p className="mt-3 font-[family-name:var(--font-body)] text-[14px] text-[var(--color-text-secondary)]">
        {stakes}
      </p>

      {/* Participants */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {participants.map((participant) => (
            <div
              key={participant.name}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--color-bg-elevated)] bg-[var(--color-accent-soft)] font-[family-name:var(--font-body)] text-[11px] font-semibold text-[var(--color-accent-primary)]"
              title={participant.name}
            >
              {participant.initial}
            </div>
          ))}
        </div>
        <span className="font-[family-name:var(--font-body)] text-[12px] text-[var(--color-text-muted)]">
          {participants.map((p) => p.name).join(" & ")}
        </span>
      </div>

      {/* Accept / Decline buttons */}
      {isPending && (
        <div className="mt-4 flex items-center gap-3">
          <motion.button
            onClick={onAccept}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent-primary)] px-4 py-2.5 font-[family-name:var(--font-body)] text-[14px] font-medium text-white"
          >
            <Check className="h-4 w-4" strokeWidth={2} />
            Accept
          </motion.button>
          <motion.button
            onClick={onDecline}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-2.5 font-[family-name:var(--font-body)] text-[14px] font-medium text-[var(--color-text-secondary)]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
            Decline
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
