"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Minus, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useBounties } from "@/lib/hooks/use-bounties"
import { toast } from "sonner"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const bountySchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  trigger_description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long"),
  reward: z.number().min(1, "Min reward is 1").max(1000, "Max reward is 1000"),
  is_recurring: z.boolean(),
})

type BountyFormValues = z.infer<typeof bountySchema>

type CreateBountyFormProps = {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function CreateBountyForm({
  open,
  onClose,
  onCreated,
}: CreateBountyFormProps) {
  const { createBounty } = useBounties()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BountyFormValues>({
    resolver: zodResolver(bountySchema),
    defaultValues: {
      title: "",
      trigger_description: "",
      reward: 10,
      is_recurring: false,
    },
  })

  const reward = watch("reward")
  const isRecurring = watch("is_recurring")

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
      reset()
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [open, reset])

  const adjustReward = (delta: number) => {
    const next = Math.max(1, Math.min(1000, reward + delta))
    setValue("reward", next, { shouldValidate: true })
  }

  const onSubmit = async (data: BountyFormValues) => {
    setIsSubmitting(true)
    try {
      await createBounty(data)
      toast.success("Bounty created!")
      onCreated?.()
      onClose()
    } catch {
      toast.error("Failed to create bounty")
    } finally {
      setIsSubmitting(false)
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
          <div
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
            data-testid="bounty-form-backdrop"
          />

          <motion.div
            className="relative w-full max-w-lg rounded-t-2xl bg-bg-elevated px-5 pb-8 pt-5 shadow-lg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            role="dialog"
            aria-label="Create bounty"
            data-testid="bounty-form-sheet"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold font-body text-text-primary">
                Create Bounty
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="bounty-form-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 flex flex-col gap-4"
              data-testid="bounty-form"
            >
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="font-body text-[13px] font-medium text-text-primary">
                  Title <span className="text-[var(--error)]">*</span>
                </label>
                <input
                  {...register("title")}
                  placeholder="e.g. Cook dinner"
                  className="h-11 rounded-xl border border-border-subtle bg-bg-primary px-3 font-body text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  data-testid="bounty-title-input"
                />
                {errors.title && (
                  <span className="font-body text-[12px] text-[var(--error)]" data-testid="title-error">
                    {errors.title.message}
                  </span>
                )}
              </div>

              {/* Trigger description */}
              <div className="flex flex-col gap-1">
                <label className="font-body text-[13px] font-medium text-text-primary">
                  How to earn it <span className="text-[var(--error)]">*</span>
                </label>
                <textarea
                  {...register("trigger_description")}
                  placeholder="Describe what needs to be done"
                  rows={3}
                  className="rounded-xl border border-border-subtle bg-bg-primary p-3 font-body text-[14px] text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  data-testid="bounty-description-input"
                />
                {errors.trigger_description && (
                  <span className="font-body text-[12px] text-[var(--error)]" data-testid="description-error">
                    {errors.trigger_description.message}
                  </span>
                )}
              </div>

              {/* Reward stepper */}
              <div className="flex flex-col gap-1">
                <label className="font-body text-[13px] font-medium text-text-primary">
                  Reward
                </label>
                <div className="flex items-center gap-3" data-testid="reward-stepper">
                  <button
                    type="button"
                    onClick={() => adjustReward(-5)}
                    disabled={reward <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-primary text-text-secondary disabled:opacity-30"
                    data-testid="reward-minus"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="flex-1 text-center">
                    <span
                      className="font-mono text-[20px] font-semibold text-accent-primary"
                      data-testid="reward-value"
                    >
                      {reward}
                    </span>
                    <span className="ms-1 text-[14px]">&#x1FA99;</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustReward(5)}
                    disabled={reward >= 1000}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-primary text-text-secondary disabled:opacity-30"
                    data-testid="reward-plus"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {errors.reward && (
                  <span className="font-body text-[12px] text-[var(--error)]" data-testid="reward-error">
                    {errors.reward.message}
                  </span>
                )}
              </div>

              {/* Recurring toggle */}
              <div className="flex items-center justify-between">
                <label className="font-body text-[14px] text-text-primary">
                  Recurring bounty
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isRecurring}
                  onClick={() => setValue("is_recurring", !isRecurring)}
                  className={`relative h-7 w-12 rounded-full transition-colors ${
                    isRecurring ? "bg-accent-primary" : "bg-border-subtle"
                  }`}
                  data-testid="recurring-toggle"
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      isRecurring ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl bg-accent-primary text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="submit-bounty-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Bounty"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
