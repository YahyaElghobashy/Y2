"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCoupons } from "@/lib/hooks/use-coupons"
import type { Coupon } from "@/lib/types/relationship.types"

type RedeemConfirmModalProps = {
  open: boolean
  coupon: Coupon | null
  mode: "redeem" | "approve" | "deny"
  onClose: () => void
  onConfirm?: () => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function RedeemConfirmModal({
  open,
  coupon,
  mode,
  onClose,
  onConfirm,
}: RedeemConfirmModalProps) {
  const { redeemCoupon, approveCoupon, rejectCoupon } = useCoupons()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [denyReason, setDenyReason] = useState("")

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden")
      setDenyReason("")
      setIsSubmitting(false)
    } else {
      document.body.classList.remove("overflow-hidden")
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [open])

  const handleRedeem = async () => {
    if (!coupon) return
    setIsSubmitting(true)
    try {
      await redeemCoupon(coupon.id)
      toast.success("Redemption requested!")
      onClose()
      onConfirm?.()
    } catch {
      toast.error("Failed to redeem coupon")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!coupon) return
    setIsSubmitting(true)
    try {
      await approveCoupon(coupon.id)
      toast.success("Coupon approved!")
      onClose()
      onConfirm?.()
    } catch {
      toast.error("Failed to approve coupon")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeny = async () => {
    if (!coupon) return
    setIsSubmitting(true)
    try {
      await rejectCoupon(coupon.id, denyReason || undefined)
      toast.success("Coupon denied")
      onClose()
      onConfirm?.()
    } catch {
      toast.error("Failed to deny coupon")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (typeof window === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && coupon && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
            data-testid="modal-backdrop"
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-md rounded-t-[20px] bg-[var(--bg-elevated)] px-5 pb-8 pt-5"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            role="dialog"
            aria-label={
              mode === "redeem"
                ? "Redeem coupon"
                : mode === "approve"
                  ? "Approve coupon"
                  : "Deny coupon"
            }
            data-testid="redeem-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-semibold font-display text-[var(--text-primary)]">
                {mode === "redeem" && "Redeem Coupon"}
                {mode === "approve" && "Approve Redemption"}
                {mode === "deny" && "Deny Coupon"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)]"
                aria-label="Close"
                data-testid="modal-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {/* Coupon preview */}
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] p-3">
              {coupon.emoji && <span className="text-[32px]">{coupon.emoji}</span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold font-body text-[var(--text-primary)]">
                  {coupon.title}
                </p>
                {coupon.description && (
                  <p className="truncate text-[13px] font-body text-[var(--text-secondary)]">
                    {coupon.description}
                  </p>
                )}
              </div>
            </div>

            {/* Mode-specific content */}
            <div className="mt-5">
              {mode === "redeem" && (
                <>
                  <p className="text-[14px] font-body text-[var(--text-secondary)]" data-testid="modal-message">
                    Are you sure you want to redeem this coupon? Your partner will need to approve it.
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleRedeem}
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl bg-[var(--accent-primary)] text-[15px] font-medium font-body text-white transition-colors disabled:opacity-50"
                      data-testid="modal-confirm"
                    >
                      {isSubmitting ? "Requesting..." : "Redeem"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 w-full text-[14px] font-medium font-body text-[var(--text-secondary)]"
                      data-testid="modal-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {mode === "approve" && (
                <>
                  <p className="text-[14px] font-body text-[var(--text-secondary)]" data-testid="modal-message">
                    Your partner wants to redeem this coupon. Do you approve?
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="h-12 flex-1 rounded-xl bg-[var(--accent-primary)] text-[15px] font-medium font-body text-white transition-colors disabled:opacity-50"
                      data-testid="modal-confirm"
                    >
                      {isSubmitting ? "Approving..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-12 flex-1 rounded-xl border border-[var(--border-subtle)] text-[15px] font-medium font-body text-[var(--text-secondary)] transition-colors"
                      data-testid="modal-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {mode === "deny" && (
                <>
                  <p className="text-[14px] font-body text-[var(--text-secondary)]" data-testid="modal-message">
                    Add a reason for denying this coupon (optional).
                  </p>
                  <textarea
                    rows={3}
                    maxLength={200}
                    placeholder="Reason (optional)"
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                    className="mt-3 w-full resize-none rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-[15px] font-body text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-primary)] placeholder:text-[var(--text-muted)]"
                    data-testid="deny-reason"
                  />
                  <div className="mt-1 text-end text-[12px] text-[var(--text-muted)]">
                    {denyReason.length}/200
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleDeny}
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl bg-[var(--error)] text-[15px] font-medium font-body text-white transition-colors disabled:opacity-50"
                      data-testid="modal-confirm"
                    >
                      {isSubmitting ? "Denying..." : "Deny Coupon"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 w-full text-[14px] font-medium font-body text-[var(--text-secondary)]"
                      data-testid="modal-cancel"
                    >
                      Cancel
                    </button>
                  </div>
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
