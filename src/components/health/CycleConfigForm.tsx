"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCycle } from "@/lib/hooks/use-cycle"
import type { CycleConfig } from "@/lib/types/health.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const cycleConfigSchema = z.object({
  pill_start_date: z.string().min(1, "Start date is required"),
  active_days: z.number().int().min(1, "Min 1").max(100, "Max 100"),
  break_days: z.number().int().min(1, "Min 1").max(30, "Max 30"),
  pms_warning_days: z.number().int().min(0, "Min 0").max(14, "Max 14"),
  notes: z.string().max(500, "Max 500 characters").optional().or(z.literal("")),
})

type CycleConfigFormData = z.infer<typeof cycleConfigSchema>

type CycleConfigFormProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  initialConfig?: CycleConfig
}

export function CycleConfigForm({ open, onClose, onSuccess, initialConfig }: CycleConfigFormProps) {
  const { updateConfig, refreshCycle } = useCycle()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CycleConfigFormData>({
    resolver: zodResolver(cycleConfigSchema),
    mode: "onBlur",
    defaultValues: {
      pill_start_date: initialConfig?.pill_start_date ?? "",
      active_days: initialConfig?.active_days ?? 21,
      break_days: initialConfig?.break_days ?? 7,
      pms_warning_days: initialConfig?.pms_warning_days ?? 3,
      notes: initialConfig?.notes ?? "",
    },
  })

  const notes = watch("notes") ?? ""

  useEffect(() => {
    if (open) {
      reset({
        pill_start_date: initialConfig?.pill_start_date ?? "",
        active_days: initialConfig?.active_days ?? 21,
        break_days: initialConfig?.break_days ?? 7,
        pms_warning_days: initialConfig?.pms_warning_days ?? 3,
        notes: initialConfig?.notes ?? "",
      })
    }
  }, [open, reset, initialConfig])

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

  const onSubmit = async (data: CycleConfigFormData) => {
    try {
      await updateConfig({
        pill_start_date: data.pill_start_date,
        active_days: data.active_days,
        break_days: data.break_days,
        pms_warning_days: data.pms_warning_days,
        notes: data.notes || null,
      })
      await refreshCycle()
      toast.success(initialConfig ? "Cycle config updated!" : "Cycle tracking started!")
      onClose()
      onSuccess?.()
    } catch {
      toast.error("Failed to save. Try again.")
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
            data-testid="cycle-config-backdrop"
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-md rounded-t-[20px] bg-bg-elevated px-5 pb-8 pt-5"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            role="dialog"
            aria-label="Cycle Configuration"
            data-testid="cycle-config-sheet"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-semibold font-[var(--font-display)] text-text-primary">
                {initialConfig ? "Edit Cycle" : "Start Tracking"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="cycle-config-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
              {/* Pill start date */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
                  Pill Start Date
                </label>
                <input
                  type="date"
                  className={cn(
                    "h-11 w-full rounded-[10px] border border-border-subtle bg-bg-elevated px-4 text-[15px] font-[var(--font-body)] text-text-primary outline-none transition-colors focus:border-accent-primary",
                    errors.pill_start_date && "border-[var(--error)]"
                  )}
                  {...register("pill_start_date")}
                  data-testid="cycle-start-date"
                />
                {errors.pill_start_date && (
                  <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]">
                    {errors.pill_start_date.message}
                  </p>
                )}
              </div>

              {/* Active days + Break days row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
                    Active Days
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={cn(
                      "h-11 w-full rounded-[10px] border border-border-subtle bg-bg-elevated px-4 text-[15px] font-[var(--font-body)] text-text-primary outline-none transition-colors focus:border-accent-primary",
                      errors.active_days && "border-[var(--error)]"
                    )}
                    {...register("active_days", { valueAsNumber: true })}
                    data-testid="cycle-active-days"
                  />
                  {errors.active_days && (
                    <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]">
                      {errors.active_days.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
                    Break Days
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={cn(
                      "h-11 w-full rounded-[10px] border border-border-subtle bg-bg-elevated px-4 text-[15px] font-[var(--font-body)] text-text-primary outline-none transition-colors focus:border-accent-primary",
                      errors.break_days && "border-[var(--error)]"
                    )}
                    {...register("break_days", { valueAsNumber: true })}
                    data-testid="cycle-break-days"
                  />
                  {errors.break_days && (
                    <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]">
                      {errors.break_days.message}
                    </p>
                  )}
                </div>
              </div>

              {/* PMS warning days */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
                  PMS Warning Days
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  className={cn(
                    "h-11 w-full rounded-[10px] border border-border-subtle bg-bg-elevated px-4 text-[15px] font-[var(--font-body)] text-text-primary outline-none transition-colors focus:border-accent-primary",
                    errors.pms_warning_days && "border-[var(--error)]"
                  )}
                  {...register("pms_warning_days", { valueAsNumber: true })}
                  data-testid="cycle-pms-days"
                />
                {errors.pms_warning_days && (
                  <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]">
                    {errors.pms_warning_days.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Any notes about the cycle..."
                  className={cn(
                    "w-full resize-none rounded-[10px] border border-border-subtle bg-bg-elevated px-4 py-3 text-[15px] font-[var(--font-body)] text-text-primary outline-none transition-colors focus:border-accent-primary placeholder:text-text-muted",
                    errors.notes && "border-[var(--error)]"
                  )}
                  {...register("notes")}
                  data-testid="cycle-notes"
                />
                <div className="flex items-center justify-between">
                  {errors.notes ? (
                    <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]">
                      {errors.notes.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[12px] text-text-muted font-[var(--font-body)]">
                    {notes.length}/500
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-accent-primary text-[var(--color-bg-elevated)] text-[15px] font-medium font-[var(--font-body)] transition-colors disabled:opacity-50"
                data-testid="cycle-config-submit"
              >
                {isSubmitting ? "Saving..." : initialConfig ? "Update" : "Start Tracking"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
