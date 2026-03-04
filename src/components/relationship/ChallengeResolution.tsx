"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Trophy, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { toast } from "sonner"

type Challenge = {
  id: string
  creator_id: string
  title: string
  description?: string | null
  emoji?: string | null
  stakes: number
  status: string
  claimed_by?: string | null
  winner_id?: string | null
  deadline?: string | null
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

// ── ClaimWinDialog ─────────────────────────────────────────
// Shown to a participant who wants to claim they won the challenge.
// Changes status to pending_resolution, sets claimed_by.

type ClaimWinDialogProps = {
  open: boolean
  onClose: () => void
  challenge: Challenge
  onClaimed?: () => void
}

export function ClaimWinDialog({
  open,
  onClose,
  challenge,
  onClaimed,
}: ClaimWinDialogProps) {
  const { user } = useAuth()
  const [isClaiming, setIsClaiming] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)

  // Check if current user already claimed
  const alreadyClaimed = challenge.claimed_by === user?.id
  const isPendingResolution = challenge.status === "pending_resolution"

  useEffect(() => {
    if (open && alreadyClaimed && isPendingResolution) {
      setIsWaiting(true)
    } else {
      setIsWaiting(false)
    }
  }, [open, alreadyClaimed, isPendingResolution])

  // Realtime subscription for challenge updates
  useEffect(() => {
    if (!open || !challenge.id) return

    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel(`challenge_${challenge.id}`)
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "challenges",
          filter: `id=eq.${challenge.id}`,
        },
        (payload: { new: Challenge }) => {
          if (payload.new.status === "completed") {
            toast.success("Challenge resolved!")
            onClaimed?.()
            onClose()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, challenge.id, onClaimed, onClose])

  const handleClaim = async () => {
    if (!user || isClaiming) return
    setIsClaiming(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from("challenges")
        .update({
          status: "pending_resolution",
          claimed_by: user.id,
        })
        .eq("id", challenge.id)

      if (error) throw error

      setIsWaiting(true)
      toast.success("Win claimed! Waiting for partner to confirm.")
      onClaimed?.()
    } catch {
      toast.error("Failed to claim win")
    } finally {
      setIsClaiming(false)
    }
  }

  const handleCancel = async () => {
    if (!user) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from("challenges")
        .update({
          status: "active",
          claimed_by: null,
        })
        .eq("id", challenge.id)

      if (error) throw error

      setIsWaiting(false)
      toast.success("Claim cancelled")
    } catch {
      toast.error("Failed to cancel claim")
    }
  }

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

  if (typeof window === "undefined") return null

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
            data-testid="claim-win-backdrop"
          />

          <motion.div
            className="relative w-[90%] max-w-sm rounded-2xl bg-bg-elevated px-5 pb-6 pt-5 shadow-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            role="dialog"
            aria-label="Claim win"
            data-testid="claim-win-dialog"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold font-body text-text-primary">
                {isWaiting ? "Waiting for Partner" : "Claim Win"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="claim-win-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
                {isWaiting ? (
                  <Clock size={28} strokeWidth={1.5} className="text-accent-primary" />
                ) : (
                  <Trophy size={28} strokeWidth={1.5} className="text-accent-primary" />
                )}
              </div>

              <h3 className="font-body text-[16px] font-semibold text-text-primary text-center">
                {challenge.emoji} {challenge.title}
              </h3>

              <p className="font-body text-[14px] text-text-secondary text-center">
                {isWaiting
                  ? "Your partner needs to confirm your win. You'll be notified when they respond."
                  : `Are you sure you won this challenge? ${challenge.stakes} CoYYns are at stake.`}
              </p>

              <div className="rounded-xl bg-bg-primary px-4 py-2 mt-1">
                <span className="font-mono text-[16px] font-semibold text-accent-primary" data-testid="stakes-display">
                  {challenge.stakes} &#x1FA99;
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {isWaiting ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-12 w-full rounded-xl border border-border-subtle bg-bg-elevated text-[15px] font-medium font-body text-text-secondary flex items-center justify-center gap-2"
                  data-testid="cancel-claim-btn"
                >
                  Cancel Claim
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="h-12 w-full rounded-xl bg-accent-primary text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="claim-win-confirm"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      "I Won!"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 w-full text-[14px] font-body text-text-secondary"
                    data-testid="claim-win-cancel"
                  >
                    Cancel
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

// ── ConfirmResultDialog ────────────────────────────────────
// Shown to the non-claimant to confirm/dispute the result.

type ConfirmResultDialogProps = {
  open: boolean
  onClose: () => void
  challenge: Challenge
  claimantName?: string
  onConfirmed?: () => void
}

export function ConfirmResultDialog({
  open,
  onClose,
  challenge,
  claimantName = "Your partner",
  onConfirmed,
}: ConfirmResultDialogProps) {
  const { user } = useAuth()
  const { wallet, spendCoyyns } = useCoyyns()
  const [isConfirming, setIsConfirming] = useState(false)

  const balance = wallet?.balance ?? 0
  const actualTransfer = Math.min(challenge.stakes, balance)
  const afterBalance = balance - actualTransfer

  const handleConfirm = useCallback(async () => {
    if (!user || isConfirming) return
    setIsConfirming(true)

    try {
      const supabase = getSupabaseBrowserClient()

      // Transfer CoYYns if stakes > 0
      if (actualTransfer > 0) {
        await spendCoyyns(actualTransfer, `Challenge: ${challenge.title}`, "challenge_loss")
      }

      const { error } = await supabase
        .from("challenges")
        .update({
          status: "completed",
          winner_id: challenge.claimed_by,
          actual_transfer: actualTransfer,
        })
        .eq("id", challenge.id)

      if (error) throw error

      toast.success("Challenge resolved!")
      onConfirmed?.()
      onClose()
    } catch {
      toast.error("Failed to confirm result")
    } finally {
      setIsConfirming(false)
    }
  }, [user, isConfirming, actualTransfer, challenge, spendCoyyns, onConfirmed, onClose])

  const handleDispute = async () => {
    if (!user) return

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from("challenges")
        .update({
          status: "active",
          claimed_by: null,
        })
        .eq("id", challenge.id)

      if (error) throw error

      toast.success("Claim disputed — challenge is active again")
      onClose()
    } catch {
      toast.error("Failed to dispute claim")
    }
  }

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

  if (typeof window === "undefined") return null

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
            data-testid="confirm-result-backdrop"
          />

          <motion.div
            className="relative w-[90%] max-w-sm rounded-2xl bg-bg-elevated px-5 pb-6 pt-5 shadow-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            role="dialog"
            aria-label="Confirm challenge result"
            data-testid="confirm-result-dialog"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold font-body text-text-primary">
                Confirm Result
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="confirm-result-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-4">
              <p className="font-body text-[15px] text-text-primary text-center" data-testid="claimant-message">
                {claimantName} claims they won{" "}
                <span className="font-semibold">
                  {challenge.emoji} {challenge.title}
                </span>
              </p>

              {/* Balance breakdown */}
              <div
                className="mt-4 rounded-xl bg-bg-primary p-4"
                data-testid="result-balance-breakdown"
              >
                <div className="flex items-center justify-between py-1">
                  <span className="font-body text-[13px] text-text-secondary">
                    Stakes
                  </span>
                  <span className="font-mono text-[14px] font-medium text-text-primary">
                    {challenge.stakes} &#x1FA99;
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-body text-[13px] text-text-secondary">
                    Your Balance
                  </span>
                  <span className="font-mono text-[14px] font-medium text-text-primary">
                    {balance.toLocaleString()} &#x1FA99;
                  </span>
                </div>
                {actualTransfer < challenge.stakes && (
                  <div className="flex items-center justify-between py-1">
                    <span className="font-body text-[13px] text-[var(--warning)]">
                      Partial transfer
                    </span>
                    <span className="font-mono text-[14px] font-medium text-[var(--warning)]" data-testid="partial-transfer">
                      {actualTransfer} &#x1FA99;
                    </span>
                  </div>
                )}
                <div className="border-t border-border-subtle my-1" />
                <div className="flex items-center justify-between py-1">
                  <span className="font-body text-[13px] font-medium text-text-primary">
                    After
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[14px] font-semibold",
                      afterBalance >= 0 ? "text-accent-primary" : "text-[var(--error)]"
                    )}
                    data-testid="result-after-balance"
                  >
                    {afterBalance.toLocaleString()} &#x1FA99;
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming}
                className="h-12 w-full rounded-xl bg-accent-primary text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="confirm-result-btn"
              >
                {isConfirming ? (
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
                onClick={handleDispute}
                className="h-10 w-full text-[14px] font-medium font-body text-[var(--error)]"
                data-testid="dispute-result-btn"
              >
                Dispute
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
