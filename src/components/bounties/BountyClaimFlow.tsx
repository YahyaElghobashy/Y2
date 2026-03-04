"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, CheckCircle, XCircle, Gift } from "lucide-react"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useBounties } from "@/lib/hooks/use-bounties"
import { toast } from "sonner"
import type { Bounty, BountyClaim } from "@/lib/types/challenges.types"

type BountyClaimFlowProps = {
  bounty: Bounty | null
  claim: BountyClaim | null
  open: boolean
  onClose: () => void
  onConfirmed?: () => void
  onDenied?: () => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function BountyClaimFlow({
  bounty,
  claim,
  open,
  onClose,
  onConfirmed,
  onDenied,
}: BountyClaimFlowProps) {
  const { user } = useAuth()
  const { confirmClaim, denyClaim } = useBounties()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isCreator = bounty?.creator_id === user?.id
  const isClaimer = claim?.claimer_id === user?.id

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [open])

  const handleConfirm = async () => {
    if (!claim || isSubmitting) return
    setIsSubmitting(true)
    try {
      await confirmClaim(claim.id)
      toast.success("Bounty confirmed — CoYYns awarded!")
      onConfirmed?.()
      onClose()
    } catch {
      toast.error("Failed to confirm claim")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeny = async () => {
    if (!claim || isSubmitting) return
    setIsSubmitting(true)
    try {
      await denyClaim(claim.id)
      toast.success("Claim denied")
      onDenied?.()
      onClose()
    } catch {
      toast.error("Failed to deny claim")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (typeof window === "undefined" || !bounty || !claim) return null

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
            data-testid="claim-flow-backdrop"
          />

          <motion.div
            className="relative w-[90%] max-w-sm rounded-2xl bg-bg-elevated px-5 pb-6 pt-5 shadow-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            role="dialog"
            aria-label="Bounty claim"
            data-testid="claim-flow-dialog"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold font-body text-text-primary">
                {isCreator ? "Review Claim" : "Claim Submitted"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="claim-flow-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
                <Gift size={28} strokeWidth={1.5} className="text-accent-primary" />
              </div>

              <h3
                className="font-body text-[16px] font-semibold text-text-primary text-center"
                data-testid="claim-bounty-title"
              >
                {bounty.title}
              </h3>

              <p className="font-body text-[13px] text-text-secondary text-center">
                {bounty.trigger_description}
              </p>

              <div className="rounded-xl bg-bg-primary px-4 py-2">
                <span
                  className="font-mono text-[16px] font-semibold text-accent-primary"
                  data-testid="claim-reward"
                >
                  {bounty.reward} &#x1FA99;
                </span>
              </div>

              {isCreator && (
                <p
                  className="font-body text-[14px] text-text-secondary text-center"
                  data-testid="claim-review-message"
                >
                  Your partner claims they completed this bounty. Confirm to award them{" "}
                  {bounty.reward} CoYYns.
                </p>
              )}

              {isClaimer && (
                <p
                  className="font-body text-[14px] text-text-secondary text-center"
                  data-testid="claim-waiting-message"
                >
                  Waiting for your partner to review and confirm your claim.
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {isCreator && (
                <>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl bg-accent-primary text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="confirm-claim-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Confirm &amp; Pay
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeny}
                    disabled={isSubmitting}
                    className="h-10 w-full text-[14px] font-medium font-body text-[var(--error)] flex items-center justify-center gap-2"
                    data-testid="deny-claim-btn"
                  >
                    <XCircle size={16} />
                    Deny Claim
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
