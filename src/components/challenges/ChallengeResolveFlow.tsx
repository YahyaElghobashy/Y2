"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Trophy, Clock, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useChallenges } from "@/lib/hooks/use-challenges"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Challenge } from "@/lib/types/challenges.types"

type ChallengeResolveFlowProps = {
  challenge: Challenge | null
  open: boolean
  onClose: () => void
  onResolved?: (winnerId: string) => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function ChallengeResolveFlow({
  challenge,
  open,
  onClose,
  onResolved,
}: ChallengeResolveFlowProps) {
  const { user, partner } = useAuth()
  const { claimVictory, confirmVictory, disputeChallenge } = useChallenges()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [showDisputeInput, setShowDisputeInput] = useState(false)

  const isClaimed = challenge?.status === "pending_resolution"
  const isDisputed = challenge?.status === "disputed"
  const isClaimant = challenge?.claimed_by === user?.id
  const partnerName = partner?.display_name ?? "Partner"

  // Determine which view to show
  const getView = useCallback((): "claim" | "waiting" | "confirm" | "disputed" => {
    if (!challenge) return "claim"
    if (isDisputed) return "disputed"
    if (isClaimed && isClaimant) return "waiting"
    if (isClaimed && !isClaimant) return "confirm"
    return "claim"
  }, [challenge, isClaimed, isClaimant, isDisputed])

  const view = getView()

  // Realtime subscription for challenge updates
  useEffect(() => {
    if (!open || !challenge?.id) return

    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`resolve_${challenge.id}`)
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "challenges",
          filter: `id=eq.${challenge.id}`,
        },
        (payload: { new: Challenge }) => {
          if (payload.new.status === "resolved" && payload.new.winner_id) {
            toast.success("Challenge resolved!")
            onResolved?.(payload.new.winner_id)
            onClose()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, challenge?.id, onResolved, onClose])

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
      setShowDisputeInput(false)
      setDisputeReason("")
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [open])

  const handleClaimVictory = async () => {
    if (!challenge || isSubmitting) return
    setIsSubmitting(true)
    try {
      await claimVictory(challenge.id)
      toast.success("Win claimed! Waiting for partner to confirm.")
    } catch {
      toast.error("Failed to claim victory")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmVictory = async () => {
    if (!challenge || isSubmitting) return
    setIsSubmitting(true)
    try {
      await confirmVictory(challenge.id)
      toast.success("Challenge resolved!")
      onResolved?.(challenge.claimed_by!)
      onClose()
    } catch {
      toast.error("Failed to confirm victory")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDispute = async () => {
    if (!challenge || isSubmitting) return
    setIsSubmitting(true)
    try {
      await disputeChallenge(challenge.id, disputeReason || undefined)
      toast.success("Challenge disputed")
      setShowDisputeInput(false)
      setDisputeReason("")
    } catch {
      toast.error("Failed to dispute challenge")
    } finally {
      setIsSubmitting(false)
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
            data-testid="resolve-flow-backdrop"
          />

          <motion.div
            className="relative w-[90%] max-w-sm rounded-2xl bg-bg-elevated px-5 pb-6 pt-5 shadow-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            role="dialog"
            aria-label="Resolve challenge"
            data-testid="resolve-flow-dialog"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold font-body text-text-primary">
                {view === "claim" && "Claim Victory"}
                {view === "waiting" && "Waiting for Partner"}
                {view === "confirm" && "Confirm Result"}
                {view === "disputed" && "Challenge Disputed"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="resolve-flow-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
                {view === "waiting" ? (
                  <Clock size={28} strokeWidth={1.5} className="text-accent-primary animate-pulse" />
                ) : view === "disputed" ? (
                  <AlertCircle size={28} strokeWidth={1.5} className="text-[var(--warning)]" />
                ) : (
                  <Trophy size={28} strokeWidth={1.5} className="text-accent-primary" />
                )}
              </div>

              <h3 className="font-body text-[16px] font-semibold text-text-primary text-center">
                {challenge.emoji} {challenge.title}
              </h3>

              <div className="rounded-xl bg-bg-primary px-4 py-2">
                <span className="font-mono text-[16px] font-semibold text-accent-primary" data-testid="resolve-stakes">
                  {challenge.stakes} &#x1FA99;
                </span>
              </div>

              {/* View-specific content */}
              {view === "claim" && (
                <p className="font-body text-[14px] text-text-secondary text-center">
                  Did you win this challenge? Claim your victory and your partner will confirm.
                </p>
              )}

              {view === "waiting" && (
                <p className="font-body text-[14px] text-text-secondary text-center">
                  Your partner needs to confirm your win. You&apos;ll be notified when they respond.
                </p>
              )}

              {view === "confirm" && (
                <p className="font-body text-[14px] text-text-secondary text-center" data-testid="confirm-message">
                  {partnerName} claims they won this challenge. If you confirm, they receive{" "}
                  {challenge.stakes * 2} CoYYns.
                </p>
              )}

              {view === "disputed" && challenge.resolution_note && (
                <div className="w-full rounded-xl bg-[#FFF8E8] p-3">
                  <p className="font-body text-[13px] text-[var(--warning)]" data-testid="dispute-note">
                    &ldquo;{challenge.resolution_note}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-col gap-3">
              {view === "claim" && (
                <button
                  type="button"
                  onClick={handleClaimVictory}
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl bg-accent-primary text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="claim-victory-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    "I Won!"
                  )}
                </button>
              )}

              {view === "confirm" && !showDisputeInput && (
                <>
                  <button
                    type="button"
                    onClick={handleConfirmVictory}
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl bg-accent-primary text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="confirm-victory-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      "Confirm — They Won"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisputeInput(true)}
                    className="h-10 w-full text-[14px] font-medium font-body text-[var(--error)]"
                    data-testid="show-dispute-btn"
                  >
                    Dispute
                  </button>
                </>
              )}

              {(view === "confirm" && showDisputeInput) && (
                <>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Why do you disagree? (optional)"
                    className="w-full rounded-xl border border-border-subtle bg-bg-primary p-3 font-body text-[14px] text-text-primary placeholder:text-text-muted resize-none"
                    rows={3}
                    data-testid="dispute-reason-input"
                  />
                  <button
                    type="button"
                    onClick={handleDispute}
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl bg-[var(--error)] text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="submit-dispute-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Disputing...
                      </>
                    ) : (
                      "Submit Dispute"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisputeInput(false)}
                    className="h-10 w-full text-[14px] font-body text-text-secondary"
                  >
                    Cancel
                  </button>
                </>
              )}

              {view === "disputed" && (
                <p className="font-body text-[13px] text-text-muted text-center">
                  This challenge is under dispute. Discuss with your partner to resolve it.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
