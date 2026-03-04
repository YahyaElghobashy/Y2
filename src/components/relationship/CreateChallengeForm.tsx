"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { toast } from "sonner"

const EMOJI_OPTIONS = ["⚡", "🏆", "💪", "🎯", "🔥", "✨", "🎮", "📚", "🏃‍♂️", "🧘"]

const challengeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  stakes: z
    .number({ error: "Stakes must be a number" })
    .int("Stakes must be a whole number")
    .min(1, "Minimum stake is 1 CoYYn")
    .max(1000, "Maximum stake is 1,000 CoYYns"),
  deadline: z.string().optional(),
})

type ChallengeFormData = z.infer<typeof challengeSchema>

type CreateChallengeFormProps = {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function CreateChallengeForm({
  open,
  onClose,
  onCreated,
}: CreateChallengeFormProps) {
  const { user } = useAuth()
  const [selectedEmoji, setSelectedEmoji] = useState("⚡")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: "",
      description: "",
      stakes: 50,
      deadline: "",
    },
  })

  useEffect(() => {
    if (open) {
      reset()
      setSelectedEmoji("⚡")
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [open, reset])

  const onSubmit = async (data: ChallengeFormData) => {
    if (!user || isSubmitting) return
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("challenges").insert({
        creator_id: user.id,
        title: data.title,
        emoji: selectedEmoji,
        stakes: data.stakes,
        status: "active",
        description: data.description || null,
        deadline: data.deadline && new Date(data.deadline) > new Date()
          ? new Date(data.deadline).toISOString()
          : null,
      })

      if (error) throw error

      toast.success("Challenge created!")
      onCreated?.()
      onClose()
    } catch {
      toast.error("Failed to create challenge")
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
            data-testid="challenge-form-backdrop"
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-md rounded-t-[20px] bg-bg-elevated px-5 pb-8 pt-5 max-h-[85vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            role="dialog"
            aria-label="Create challenge"
            data-testid="challenge-form-dialog"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-semibold font-body text-text-primary">
                Create Challenge
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary"
                aria-label="Close"
                data-testid="challenge-form-close"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {/* Emoji picker */}
            <div className="mt-5" data-testid="emoji-picker">
              <label className="font-body text-[13px] font-medium text-text-secondary block mb-2">
                Emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={cn(
                      "h-10 w-10 rounded-xl text-[20px] flex items-center justify-center transition-all",
                      selectedEmoji === emoji
                        ? "bg-accent-soft ring-2 ring-accent-primary"
                        : "bg-bg-primary"
                    )}
                    data-testid={`emoji-${emoji}`}
                    aria-label={`Select ${emoji}`}
                    aria-pressed={selectedEmoji === emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-5 flex flex-col gap-4"
              data-testid="challenge-form"
            >
              {/* Title */}
              <div>
                <label
                  htmlFor="challenge-title"
                  className="font-body text-[13px] font-medium text-text-secondary block mb-1"
                >
                  Title *
                </label>
                <input
                  id="challenge-title"
                  type="text"
                  {...register("title")}
                  placeholder="e.g. No Screen Sunday"
                  className="w-full h-11 rounded-xl border border-border-subtle bg-bg-primary px-3 font-body text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  data-testid="challenge-title-input"
                />
                {errors.title && (
                  <p className="mt-1 text-[12px] font-body text-[var(--error)]" data-testid="title-error">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="challenge-description"
                  className="font-body text-[13px] font-medium text-text-secondary block mb-1"
                >
                  Description
                </label>
                <textarea
                  id="challenge-description"
                  {...register("description")}
                  placeholder="What's the challenge about?"
                  rows={3}
                  className="w-full rounded-xl border border-border-subtle bg-bg-primary px-3 py-2 font-body text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                  data-testid="challenge-description-input"
                />
                {errors.description && (
                  <p className="mt-1 text-[12px] font-body text-[var(--error)]" data-testid="description-error">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Stakes */}
              <div>
                <label
                  htmlFor="challenge-stakes"
                  className="font-body text-[13px] font-medium text-text-secondary block mb-1"
                >
                  Stakes (CoYYns)
                </label>
                <input
                  id="challenge-stakes"
                  type="number"
                  {...register("stakes", { valueAsNumber: true })}
                  min={1}
                  max={1000}
                  className="w-full h-11 rounded-xl border border-border-subtle bg-bg-primary px-3 font-mono text-[15px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  data-testid="challenge-stakes-input"
                />
                {errors.stakes && (
                  <p className="mt-1 text-[12px] font-body text-[var(--error)]" data-testid="stakes-error">
                    {errors.stakes.message}
                  </p>
                )}
              </div>

              {/* Deadline */}
              <div>
                <label
                  htmlFor="challenge-deadline"
                  className="font-body text-[13px] font-medium text-text-secondary block mb-1"
                >
                  Deadline (optional)
                </label>
                <input
                  id="challenge-deadline"
                  type="datetime-local"
                  {...register("deadline")}
                  className="w-full h-11 rounded-xl border border-border-subtle bg-bg-primary px-3 font-body text-[15px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  data-testid="challenge-deadline-input"
                />
                {errors.deadline && (
                  <p className="mt-1 text-[12px] font-body text-[var(--error)]" data-testid="deadline-error">
                    {errors.deadline.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-12 w-full rounded-xl bg-accent-primary text-bg-elevated text-[15px] font-medium font-body transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="challenge-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Challenge"
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
