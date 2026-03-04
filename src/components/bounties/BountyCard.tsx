"use client"

import { motion } from "framer-motion"
import { Gift, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Bounty, BountyClaim } from "@/lib/types/challenges.types"

type BountyCardProps = {
  bounty: Bounty
  pendingClaim?: BountyClaim | null
  onClaim?: (bountyId: string) => void
}

export function BountyCard({ bounty, pendingClaim, onClaim }: BountyCardProps) {
  const { user } = useAuth()
  const isCreator = bounty.creator_id === user?.id
  const hasPendingClaim = !!pendingClaim

  return (
    <motion.div
      className="rounded-2xl border border-border-subtle bg-bg-elevated p-4"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      data-testid="bounty-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft">
            <Gift size={20} strokeWidth={1.5} className="text-accent-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h3
              className="font-body text-[15px] font-semibold text-text-primary leading-tight"
              data-testid="bounty-title"
            >
              {bounty.title}
            </h3>
            <p
              className="font-body text-[13px] text-text-secondary leading-snug"
              data-testid="bounty-trigger"
            >
              {bounty.trigger_description}
            </p>
          </div>
        </div>

        <div
          className="shrink-0 rounded-full bg-accent-soft px-3 py-1"
          data-testid="bounty-reward"
        >
          <span className="font-mono text-[13px] font-semibold text-accent-primary">
            {bounty.reward} &#x1FA99;
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {bounty.is_recurring && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[var(--info-bg,#E8F4FD)] px-2.5 py-0.5"
            data-testid="recurring-badge"
          >
            <RotateCw size={12} className="text-[var(--info,#3B82F6)]" />
            <span className="font-body text-[11px] font-medium text-[var(--info,#3B82F6)]">
              Recurring
            </span>
          </span>
        )}

        {hasPendingClaim && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E8] px-2.5 py-0.5"
            data-testid="claim-pending-badge"
          >
            <span className="font-body text-[11px] font-medium text-[var(--warning)]">
              Claim Pending
            </span>
          </span>
        )}
      </div>

      {!isCreator && !hasPendingClaim && (
        <button
          type="button"
          onClick={() => onClaim?.(bounty.id)}
          className={cn(
            "mt-3 h-10 w-full rounded-xl text-[14px] font-medium font-body transition-colors",
            "bg-accent-primary text-bg-elevated"
          )}
          data-testid="claim-bounty-btn"
        >
          I did it!
        </button>
      )}
    </motion.div>
  )
}
