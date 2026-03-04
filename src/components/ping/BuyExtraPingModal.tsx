"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { BellPlus, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { useNotifications } from "@/lib/hooks/use-notifications"

const PING_COST = 10
const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type BuyExtraPingModalProps = {
  open: boolean
  onClose: () => void
  onPurchased: () => void
}

export function BuyExtraPingModal({
  open,
  onClose,
  onPurchased,
}: BuyExtraPingModalProps) {
  const { wallet, spendCoyyns } = useCoyyns()
  const { purchaseBonusSend } = useNotifications()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const balance = wallet?.balance ?? 0
  const canAfford = balance >= PING_COST

  useEffect(() => {
    if (open) {
      setError(null)
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [open])

  const handleBuy = async () => {
    if (!canAfford || isPurchasing) return
    setIsPurchasing(true)
    setError(null)

    try {
      await spendCoyyns(PING_COST, "Extra ping", "notification_purchase")
      await purchaseBonusSend()
      onPurchased()
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
            data-testid="buy-ping-backdrop"
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-md rounded-t-[20px] bg-bg-elevated px-5 pb-8 pt-5"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            role="dialog"
            aria-label="Buy extra ping"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-semibold font-[var(--font-display)] text-text-primary">
                Buy Extra Ping
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="buy-ping-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {/* Content */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                <BellPlus
                  size={28}
                  strokeWidth={1.5}
                  className="text-[var(--accent-primary)]"
                />
              </div>

              <p className="text-center text-[15px] font-[var(--font-body)] text-text-secondary">
                Send one more ping today
              </p>

              {/* Price */}
              <div className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2">
                <span className="font-[var(--font-mono)] text-[18px] font-semibold text-[var(--accent-primary)]">
                  {PING_COST}
                </span>
                <span className="text-[13px] font-[var(--font-body)] text-text-secondary">
                  CoYYns
                </span>
              </div>

              {/* Balance */}
              <p
                className={cn(
                  "text-[13px] font-[var(--font-body)]",
                  canAfford ? "text-text-muted" : "text-[var(--error)]"
                )}
                data-testid="buy-ping-balance"
              >
                {canAfford
                  ? `Your balance: ${balance.toLocaleString()} CoYYns`
                  : `Need ${PING_COST - balance} more CoYYns`}
              </p>

              {/* Error */}
              {error && (
                <p
                  className="text-[var(--error)] text-[13px] text-center font-[var(--font-body)]"
                  data-testid="buy-ping-error"
                >
                  {error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleBuy}
                disabled={!canAfford || isPurchasing}
                className="h-12 w-full rounded-xl bg-accent-primary text-[var(--color-bg-elevated)] text-[15px] font-medium font-[var(--font-body)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="buy-ping-confirm"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Purchasing...
                  </>
                ) : (
                  "Buy Extra Ping"
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-10 w-full text-[14px] font-[var(--font-body)] text-text-secondary"
                data-testid="buy-ping-cancel"
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
