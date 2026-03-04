"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Swords, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { useChallenges } from "@/lib/hooks/use-challenges"
import { toast } from "sonner"
import type { Challenge } from "@/lib/types/challenges.types"

type ChallengeAcceptFlowProps = {
  challenge: Challenge | null
  open: boolean
  onClose: () => void
  onAccepted?: () => void
  onDeclined?: () => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function ChallengeAcceptFlow({
  challenge,
  open,
  onClose,
  onAccepted,
  onDeclined,
}: ChallengeAcceptFlowProps) {
  const { wallet } = useCoyyns()
  const { acceptChallenge, declineChallenge } = useChallenges()
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)

  const balance = wallet?.balance ?? 0
  const stakes = challenge?.stakes ?? 0
  const canAfford = balance >= stakes
  const afterBalance = balance - stakes

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
      setShowDeclineConfirm(false)
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [open])

  const handleAccept = async () => {
    if (!challenge || isAccepting || !canAfford) return
    setIsAccepting(true)

    try {
      await acceptChallenge(challenge.id)
      toast.success("Challenge accepted!")
      onAccepted?.()
      onClose()
    } catch {
      toast.error("Failed to accept challenge")
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = async () => {
    if (!challenge || isDeclining) return
    setIsDeclining(true)

    try {
      await declineChallenge(challenge.id)
      toast.success("Challenge declined — creator refunded")
      onDeclined?.()
      onClose()
    } catch {
      toast.error("Failed to decline challenge")
    } finally {
      setIsDeclining(false)
    }
  }

  if (typeof window === "undefined" || !challenge) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
            data-testid="accept-flow-backdrop"
          />

          <motion.div
            className="relative w-[90%] max-w-sm rounded-2xl bg-bg-elevated px-5 pb-6 pt-5 shadow-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            role="dialog"
            aria-label="Accept challenge"
            data-testid="accept-flow-dialog"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold font-body text-text-primary">
                {showDeclineConfirm ? "Decline Challenge?" : "Accept Challenge?"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="accept-flow-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {showDeclineConfirm ? (
              <div className="mt-4 flex flex-col items-center gap-3">
                <p className="font-body text-[14px] text-text-secondary text-center">
                  Are you sure? The creator will be refunded their {stakes} CoYYns stake.
                </p>
                <div className="mt-3 flex w-full flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={isDeclining}
                    className="h-12 w-full rounded-xl bg-[var(--error)] text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="confirm-decline-btn"
                  >
                    {isDeclining ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Declining...
                      </>
                    ) : (
                      "Yes, Decline"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeclineConfirm(false)}
                    className="h-10 w-full text-[14px] font-body text-text-secondary"
                    data-testid="cancel-decline-btn"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
                    <Swords size={28} strokeWidth={1.5} className="text-accent-primary" />
                  </div>

                  <h3 className="font-body text-[16px] font-semibold text-text-primary text-center">
                    {challenge.emoji} {challenge.title}
                  </h3>

                  {challenge.description && (
                    <p className="font-body text-[13px] text-text-secondary text-center">
                      {challenge.description}
                    </p>
                  )}

                  <p className="font-body text-[14px] text-text-secondary text-center">
                    This challenge requires {stakes} CoYYns from each player.
                  </p>
                </div>

                {/* Balance breakdown */}
                <div
                  className="mt-4 rounded-xl bg-bg-primary p-4"
                  data-testid="accept-balance-breakdown"
                >
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body text-[13px] text-text-secondary">Stake</span>
                    <span className="font-mono text-[14px] font-medium text-text-primary">
                      {stakes} &#x1FA99;
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body text-[13px] text-text-secondary">Your Balance</span>
                    <span className="font-mono text-[14px] font-medium text-text-primary">
                      {balance.toLocaleString()} &#x1FA99;
                    </span>
                  </div>
                  <div className="border-t border-border-subtle my-1" />
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body text-[13px] font-medium text-text-primary">After</span>
                    <span
                      className={cn(
                        "font-mono text-[14px] font-semibold",
                        canAfford ? "text-accent-primary" : "text-[var(--error)]"
                      )}
                      data-testid="accept-after-balance"
                    >
                      {afterBalance.toLocaleString()} &#x1FA99;
                    </span>
                  </div>
                </div>

                {!canAfford && (
                  <div
                    className="mt-3 flex items-center gap-2 rounded-xl bg-[#FFF8E8] p-3"
                    data-testid="insufficient-funds-warning"
                  >
                    <AlertTriangle size={16} className="text-[var(--warning)] shrink-0" />
                    <span className="font-body text-[13px] text-[var(--warning)]">
                      Insufficient CoYYns to accept this challenge
                    </span>
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={isAccepting || !canAfford}
                    className="h-12 w-full rounded-xl bg-accent-primary text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="accept-challenge-btn"
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      "Accept Challenge"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeclineConfirm(true)}
                    className="h-10 w-full text-[14px] font-medium font-body text-[var(--error)]"
                    data-testid="decline-challenge-btn"
                  >
                    Decline
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
