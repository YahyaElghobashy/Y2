"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMarketplace } from "@/lib/hooks/use-marketplace"
import { toast } from "sonner"
import type { MarketplaceItem, Purchase, EffectConfig } from "@/lib/types/marketplace.types"

type PurchaseConfirmModalProps = {
  item: MarketplaceItem | null
  balance: number
  isOpen: boolean
  onClose: () => void
  onConfirmed: (purchase: Purchase) => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

function buildEffectPayload(
  effectType: string,
  input: string
): Record<string, unknown> {
  switch (effectType) {
    case "veto":
      return { movie: input }
    case "wildcard":
      return { wish: input }
    case "task_order":
      return { task: input }
    default:
      return { input }
  }
}

export function PurchaseConfirmModal({
  item,
  balance,
  isOpen,
  onClose,
  onConfirmed,
}: PurchaseConfirmModalProps) {
  const { createPurchase } = useMarketplace()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [balanceFlash, setBalanceFlash] = useState(false)

  const effectConfig = (item?.effect_config ?? {}) as EffectConfig
  const requiresInput = effectConfig.requires_input === true
  const inputPrompt = effectConfig.input_prompt ?? "Enter details"

  const canAfford = item ? balance >= item.price : false
  const afterBalance = item ? balance - item.price : balance

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setIsPurchasing(false)
      setInputValue("")
      setBalanceFlash(false)
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (!item || !canAfford || isPurchasing) return

    if (requiresInput && inputValue.trim() === "") {
      setError("Please fill in the required field")
      return
    }

    setIsPurchasing(true)
    setError(null)

    try {
      const effectPayload = requiresInput
        ? buildEffectPayload(item.effect_type, inputValue.trim())
        : undefined

      const purchase = await createPurchase(item.id, effectPayload)

      // Balance flash animation
      setBalanceFlash(true)
      setTimeout(() => setBalanceFlash(false), 300)

      toast.success(`Purchased ${item.name}!`)
      onConfirmed(purchase)
      setTimeout(() => onClose(), 200)
    } catch {
      setError("Purchase failed. Please try again.")
    } finally {
      setIsPurchasing(false)
    }
  }

  if (typeof window === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {isOpen && item && (
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
            data-testid="purchase-backdrop"
          />

          {/* Bottom sheet */}
          <motion.div
            className="relative w-full max-w-md rounded-t-[20px] bg-bg-elevated px-5 pb-8 pt-5"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            role="dialog"
            aria-label={`Confirm purchase of ${item.name}`}
            data-testid="purchase-dialog"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-semibold font-display text-text-primary">
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
                  {item.name}
                </h3>
                <p className="font-body text-[13px] text-text-secondary line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Balance breakdown */}
            <div
              className="mt-5 rounded-xl bg-bg-primary p-4"
              data-testid="balance-breakdown"
            >
              <div className="flex items-center justify-between py-1">
                <span className="font-body text-[13px] text-text-secondary">Cost</span>
                <span className="font-mono text-[14px] font-medium text-text-primary">
                  {item.price} &#x1FA99;
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-body text-[13px] text-text-secondary">Balance</span>
                <span className="font-mono text-[14px] font-medium text-text-primary">
                  {balance.toLocaleString()} &#x1FA99;
                </span>
              </div>
              <div className="border-t border-border-subtle my-1" />
              <div className="flex items-center justify-between py-1">
                <span className="font-body text-[13px] font-medium text-text-primary">After</span>
                <span
                  className={cn(
                    "font-mono text-[14px] font-semibold transition-colors duration-200",
                    balanceFlash
                      ? "text-[var(--error)]"
                      : canAfford
                        ? "text-accent-primary"
                        : "text-[var(--error)]"
                  )}
                  data-testid="after-balance"
                >
                  {canAfford ? (
                    <>{afterBalance.toLocaleString()} &#x1FA99;</>
                  ) : (
                    "Insufficient"
                  )}
                </span>
              </div>
            </div>

            {/* Input field (when required) */}
            {requiresInput && (
              <div className="mt-4" data-testid="purchase-input-section">
                <label
                  htmlFor="purchase-input"
                  className="font-body text-[13px] font-medium text-text-primary mb-1.5 block"
                >
                  {inputPrompt}
                </label>
                <input
                  id="purchase-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPrompt}
                  className="w-full rounded-[10px] border border-border-subtle bg-bg-primary px-3 py-2.5 font-body text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary/30"
                  data-testid="purchase-input"
                />
              </div>
            )}

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
                ) : canAfford ? (
                  `Confirm Purchase`
                ) : (
                  "Not enough CoYYns"
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
