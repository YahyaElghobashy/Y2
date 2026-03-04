"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useNotifications } from "@/lib/hooks/use-notifications"
import { SendLimitIndicator } from "@/components/relationship/SendLimitIndicator"

const PRESET_EMOJIS = ["❤️", "😘", "🥰", "💕", "✨", "🌹", "💫", "🤗", "😊", "💖", "🦋", "🌙"]

const notificationSchema = z.object({
  emoji: z.string().optional(),
  title: z.string().min(1, "Title is required").max(50, "Max 50 characters"),
  body: z.string().min(1, "Message is required").max(200, "Max 200 characters"),
})

type NotificationFormData = z.infer<typeof notificationSchema>

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type NotificationBuilderProps = {
  className?: string
  onBuyMore?: () => void
}

export function NotificationBuilder({ className, onBuyMore }: NotificationBuilderProps) {
  const { partner } = useAuth()
  const { sendNotification, canSend, remainingSends } = useNotifications()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    mode: "onBlur",
    defaultValues: { emoji: "", title: "", body: "" },
  })

  const selectedEmoji = watch("emoji")
  const title = watch("title") ?? ""
  const body = watch("body") ?? ""

  const onSubmit = async (data: NotificationFormData) => {
    try {
      await sendNotification(data.title, data.body, data.emoji || undefined)
      setSent(true)
      setTimeout(() => {
        setSent(false)
        reset()
      }, 2000)
    } catch {
      // Error is handled by useNotifications hook
    }
  }

  const partnerName = partner?.display_name ?? "Partner"

  return (
    <div className={cn("flex flex-col gap-5", className)} data-testid="notification-builder">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="flex flex-col items-center gap-3 py-12"
            data-testid="notification-sent"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success)]/10">
              <Check size={28} className="text-[var(--success)]" />
            </div>
            <p className="text-[16px] font-medium font-[var(--font-body)] text-text-primary">
              Sent!
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {/* Emoji picker */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
                Emoji (optional)
              </label>
              <div className="grid grid-cols-6 gap-2" data-testid="emoji-picker">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() =>
                      setValue("emoji", selectedEmoji === emoji ? "" : emoji, { shouldValidate: true })
                    }
                    className={cn(
                      "flex h-10 w-full items-center justify-center rounded-lg text-[20px] transition-colors",
                      selectedEmoji === emoji
                        ? "bg-accent-soft ring-1 ring-accent-primary"
                        : "bg-bg-secondary"
                    )}
                    data-testid={`emoji-${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
                Title
              </label>
              <input
                type="text"
                placeholder="Hey beautiful..."
                className={cn(
                  "h-11 w-full rounded-[10px] border border-border-subtle bg-bg-elevated px-4 text-[15px] font-[var(--font-body)] text-text-primary outline-none transition-colors focus:border-accent-primary placeholder:text-text-muted",
                  errors.title && "border-[var(--error)]"
                )}
                {...register("title")}
                data-testid="notification-title-input"
              />
              <div className="flex items-center justify-between">
                {errors.title ? (
                  <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]">
                    {errors.title.message}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-[12px] text-text-muted font-[var(--font-body)]">
                  {title.length}/50
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
                Message
              </label>
              <textarea
                rows={3}
                placeholder="I just wanted you to know..."
                className={cn(
                  "w-full resize-none rounded-[10px] border border-border-subtle bg-bg-elevated px-4 py-3 text-[15px] font-[var(--font-body)] text-text-primary outline-none transition-colors focus:border-accent-primary placeholder:text-text-muted",
                  errors.body && "border-[var(--error)]"
                )}
                {...register("body")}
                data-testid="notification-body-input"
              />
              <div className="flex items-center justify-between">
                {errors.body ? (
                  <p className="text-[var(--error)] text-[12px] font-[var(--font-body)]">
                    {errors.body.message}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-[12px] text-text-muted font-[var(--font-body)]">
                  {body.length}/200
                </span>
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium font-[var(--font-body)] text-text-secondary">
                Preview
              </label>
              <div
                className="rounded-2xl border border-border-subtle bg-bg-elevated p-4"
                data-testid="notification-preview"
              >
                <div className="flex items-start gap-3">
                  {selectedEmoji && (
                    <span className="text-[24px] leading-none">{selectedEmoji}</span>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-semibold font-[var(--font-body)] text-text-primary">
                      {title || "Title"}
                    </p>
                    <p className="text-[13px] font-[var(--font-body)] text-text-secondary line-clamp-2">
                      {body || "Your message here..."}
                    </p>
                    <p className="mt-1 text-[11px] font-[var(--font-body)] text-text-muted">
                      To {partnerName} &middot; now
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit + limit */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={!canSend || isSubmitting}
                className="h-12 w-full rounded-xl bg-accent-primary text-[var(--color-bg-elevated)] text-[15px] font-medium font-[var(--font-body)] transition-colors disabled:opacity-50"
                data-testid="notification-send-button"
              >
                {isSubmitting ? "Sending..." : "Send Notification"}
              </button>
              <SendLimitIndicator remainingSends={remainingSends} onBuyMore={onBuyMore} />
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
