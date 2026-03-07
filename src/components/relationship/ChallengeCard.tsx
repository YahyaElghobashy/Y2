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
      className={cn("rounded-xl bg-white p-5", className)}
      style={{
        border: "2px dashed var(--accent-copper, #B87333)",
        boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      {/* Header: icon + title + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(184,115,51,0.1)" }}
          >
            <Trophy
              className="h-[18px] w-[18px]"
              style={{ color: "var(--accent-copper, #B87333)" }}
              strokeWidth={1.75}
            />
          </div>
          <h3 className="pt-1.5 font-display text-[15px] font-bold text-[var(--text-primary)]">
            {title}
          </h3>
        </div>

        <span
          className="shrink-0 rounded-full px-2.5 py-1 font-body text-[11px] font-bold uppercase tracking-tight"
          style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
          data-testid="status-badge"
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Stakes */}
      <div
        className="mt-3 rounded-lg px-3 py-2"
        style={{ backgroundColor: "rgba(184,115,51,0.05)" }}
      >
        <p
          className="font-body text-[13px] font-medium"
          style={{ color: "var(--accent-copper, #B87333)" }}
        >
          🎯 {stakes}
        </p>
      </div>

      {/* Participants */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {participants.map((participant) => (
            <div
              key={participant.name}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white font-body text-[11px] font-semibold text-white"
              style={{ backgroundColor: "var(--accent-copper, #B87333)" }}
              title={participant.name}
            >
              {participant.initial}
            </div>
          ))}
        </div>
        <span className="font-body text-[12px] text-[var(--text-muted)]">
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
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 font-body text-[14px] font-medium text-white"
            style={{
              backgroundColor: "var(--accent-copper, #B87333)",
              boxShadow: "0 2px 8px rgba(184,115,51,0.2)",
            }}
          >
            <Check className="h-4 w-4" strokeWidth={2} />
            Accept
          </motion.button>
          <motion.button
            onClick={onDecline}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 font-body text-[14px] font-medium text-[var(--text-secondary)]"
            style={{
              border: "1px solid rgba(44,40,37,0.1)",
              backgroundColor: "var(--bg-warm-white, #FFFDF9)",
            }}
          >
            <X className="h-4 w-4" strokeWidth={2} />
            Decline
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
