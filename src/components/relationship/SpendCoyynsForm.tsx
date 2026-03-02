"use client"

import { useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCoyyns } from "@/lib/hooks/use-coyyns"

type SpendCoyynsFormData = {
  amount: number
  description: string
  category: string
}

type SpendCoyynsFormProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  prefilledAmount?: number
  prefilledDescription?: string
  prefilledCategory?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function SpendCoyynsForm({
  open,
  onClose,
  onSuccess,
  prefilledAmount,
  prefilledDescription,
  prefilledCategory,
}: SpendCoyynsFormProps) {
  const { wallet, spendCoyyns } = useCoyyns()
  const balance = wallet?.balance ?? 0

  const schema = useMemo(
    () =>
      z.object({
        amount: z
          .number({ message: "Enter an amount" })
          .int("Must be a whole number")
          .min(1, "Min 1")
          .max(balance || 1, balance === 0 ? "No CoYYns available" : `Max ${balance.toLocaleString()}`),
        description: z.string().min(1, "Description is required").max(200, "Max 200 characters"),
        category: z.string().min(1),
      }),
    [balance]
  )

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SpendCoyynsFormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  })

  const watchedAmount = watch("amount")
  const description = watch("description") ?? ""
  const isInsufficient = typeof watchedAmount === "number" && !isNaN(watchedAmount) && watchedAmount > balance
  const isEmpty = isNaN(watchedAmount) || watchedAmount === 0
  const isDisabled = isSubmitting || isInsufficient || isEmpty || description.length === 0

  useEffect(() => {
    if (open) {
      reset({
        amount: prefilledAmount ?? (undefined as unknown as number),
        description: prefilledDescription ?? "",
        category: prefilledCategory ?? "manual",
      })
    }
  }, [open, reset, prefilledAmount, prefilledDescription, prefilledCategory])

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

  const onSubmit = async (data: SpendCoyynsFormData) => {
    try {
      await spendCoyyns(data.amount, data.description, data.category)
      reset()
      toast.success(`-${data.amount} CoYYns spent`)
      onClose()
      onSuccess?.()
    } catch {
      setError("root", { message: "Failed to spend CoYYns. Try again." })
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
            data-testid="spend-form-backdrop"
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-md rounded-t-[20px] bg-bg-elevated px-5 pb-8 pt-5"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            role="dialog"
            aria-label="Spend CoYYns"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-semibold font-[var(--font-display)] text-text-primary">
                Spend CoYYns
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="spend-form-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {/* Balance display */}
            <p className="mt-2 text-[13px] font-[var(--font-body)] text-text-secondary">
              Balance:{" "}
              <span className="text-accent-primary font-[var(--font-mono)]" data-testid="spend-balance">
                {balance.toLocaleString()}
              </span>
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4">
              {/* Amount */}
              <div className="flex flex-col items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  className={cn(
                    "w-full bg-transparent text-center font-[var(--font-mono)] text-[48px] leading-none text-text-primary outline-none border-b-2 border-transparent pb-2 transition-colors focus:border-accent-primary placeholder:text-text-muted",
                    (errors.amount || isInsufficient) && "border-[var(--error)]"
                  )}
                  {...register("amount", { valueAsNumber: true })}
                  data-testid="spend-amount-input"
                />
                {isInsufficient && (
                  <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]" data-testid="insufficient-warning">
                    Insufficient CoYYns
                  </p>
                )}
                {errors.amount && !isInsufficient && (
                  <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <textarea
                  rows={3}
                  placeholder="What are you spending on?"
                  className={cn(
                    "w-full resize-none rounded-[10px] border border-border-subtle bg-bg-elevated px-4 py-3 text-[15px] font-[var(--font-body)] text-text-primary outline-none transition-colors focus:border-accent-primary placeholder:text-text-muted",
                    errors.description && "border-[var(--error)]"
                  )}
                  {...register("description")}
                  data-testid="spend-description-input"
                />
                <div className="flex items-center justify-between">
                  {errors.description ? (
                    <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]">
                      {errors.description.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[12px] text-text-muted font-[var(--font-body)]">
                    {description.length}/200
                  </span>
                </div>
              </div>

              {/* Hidden category field */}
              <input type="hidden" {...register("category")} />

              {/* Root error */}
              {errors.root && (
                <p className="text-[var(--error)] text-[13px] text-center font-[var(--font-body)]" data-testid="spend-form-error">
                  {errors.root.message}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isDisabled}
                className="h-12 w-full rounded-xl bg-accent-primary text-[var(--color-bg-elevated)] text-[15px] font-medium font-[var(--font-body)] transition-colors disabled:opacity-50"
                data-testid="spend-submit-button"
              >
                {isSubmitting ? "Spending..." : "Spend CoYYns"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
