"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { toast } from "sonner"

type PurchaseItem = {
  icon: string
  title: string
  description: string
  price: number
  category?: string
}

type PurchaseConfirmModalProps = {
  open: boolean
  onClose: () => void
  item: PurchaseItem
  onSuccess?: () => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function PurchaseConfirmModal({
  open,
  onClose,
  item,
  onSuccess,
}: PurchaseConfirmModalProps) {
  const { wallet, spendCoyyns } = useCoyyns()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const balance = wallet?.balance ?? 0
  const canAfford = balance >= item.price
  const afterBalance = balance - item.price

  useEffect(() => {
    if (open) {
      setError(null)
      setIsPurchasing(false)
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [open])

  const handleConfirm = async () => {
    if (!canAfford || isPurchasing) return
    setIsPurchasing(true)
    setError(null)

    try {
      await spendCoyyns(item.price, item.title, item.category ?? "marketplace")
      toast.success(`Purchased ${item.title}!`)
      onSuccess?.()
      onClose()
    } catch {
      setError("Purchase failed. Please try again.")
    } finally {
      setIsPurchasing(false)
    }
  }

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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
            data-testid="purchase-backdrop"
          />

          {/* Dialog */}
          <motion.div
            className="relative w-[90%] max-w-sm rounded-2xl bg-bg-elevated px-5 pb-6 pt-5 shadow-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            role="dialog"
            aria-label={`Confirm purchase of ${item.title}`}
            data-testid="purchase-dialog"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold font-body text-text-primary">
                Confirm Purchase
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="purchase-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {/* Item preview */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                <span className="text-[24px]" role="img" aria-hidden="true">
                  {item.icon}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-body text-[15px] font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="font-body text-[13px] text-text-secondary line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Balance breakdown table */}
            <div
              className="mt-5 rounded-xl bg-bg-primary p-4"
              data-testid="balance-breakdown"
            >
              <div className="flex items-center justify-between py-1">
                <span className="font-body text-[13px] text-text-secondary">
                  Cost
                </span>
                <span className="font-mono text-[14px] font-medium text-text-primary">
                  {item.price} &#x1FA99;
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-body text-[13px] text-text-secondary">
                  Balance
                </span>
                <span className="font-mono text-[14px] font-medium text-text-primary">
                  {balance.toLocaleString()} &#x1FA99;
                </span>
              </div>
              <div className="border-t border-border-subtle my-1" />
              <div className="flex items-center justify-between py-1">
                <span className="font-body text-[13px] font-medium text-text-primary">
                  After
                </span>
                <span
                  className={cn(
                    "font-mono text-[14px] font-semibold",
                    canAfford ? "text-accent-primary" : "text-[var(--error)]"
                  )}
                  data-testid="after-balance"
                >
                  {canAfford ? afterBalance.toLocaleString() : "Insufficient"}{" "}
                  {canAfford && <>&#x1FA99;</>}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                className="mt-3 text-[var(--error)] text-[13px] text-center font-body"
                data-testid="purchase-error"
              >
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canAfford || isPurchasing}
                className="h-12 w-full rounded-xl bg-accent-primary text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="purchase-confirm"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Purchasing...
                  </>
                ) : (
                  `Buy for ${item.price} CoYYns`
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-10 w-full text-[14px] font-body text-text-secondary"
                data-testid="purchase-cancel"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
