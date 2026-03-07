"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CouponCategory } from "@/lib/types/relationship.types"

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  romantic: { bg: "bg-pink-100", text: "text-pink-700" },
  practical: { bg: "bg-blue-100", text: "text-blue-700" },
  fun: { bg: "bg-yellow-100", text: "text-yellow-700" },
  food: { bg: "bg-green-100", text: "text-green-700" },
  general: { bg: "bg-gray-100", text: "text-gray-600" },
}

export type CouponFormData = {
  title: string
  description?: string
  emoji: string
  category: CouponCategory
  hasExpiry: boolean
  expiryDate?: string
  isSurprise: boolean
  imageFile?: File
  imagePreview?: string
}

type CreateCouponStep4Props = {
  data: CouponFormData
  onSend: () => Promise<void>
  onBack: () => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function CreateCouponStep4({ data, onSend, onBack }: CreateCouponStep4Props) {
  const [isSending, setIsSending] = useState(false)
  const [flyAway, setFlyAway] = useState(false)

  const categoryStyle = CATEGORY_COLORS[data.category] ?? CATEGORY_COLORS.general

  const handleSend = useCallback(async () => {
    setIsSending(true)
    setFlyAway(true)
    // Wait for animation start, then actually send
    setTimeout(async () => {
      try {
        await onSend()
      } catch {
        setIsSending(false)
        setFlyAway(false)
      }
    }, 300)
  }, [onSend])

  return (
    <div className="flex flex-col gap-6" data-testid="step4-form">
      <h2 className="text-[20px] font-bold font-display text-[var(--text-primary)]">
        Looking good!
      </h2>

      {/* Preview card */}
      <AnimatePresence>
        {!flyAway ? (
          <motion.div
            className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 shadow-[0_2px_12px_rgba(44,40,37,0.06)]"
            exit={{
              scale: 0.8,
              y: -300,
              x: 80,
              opacity: 0,
              transition: { duration: 0.6, ease: EASE_OUT },
            }}
            data-testid="preview-card"
          >
            {/* Photo preview */}
            {data.imagePreview && (
              <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl">
                <img src={data.imagePreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}

            {/* Emoji + Title */}
            <div className="flex items-start gap-3">
              {data.emoji && <span className="text-[40px] leading-none">{data.emoji}</span>}
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold font-body text-[var(--text-primary)]">
                  {data.title}
                </h3>
                {data.description && (
                  <p className="mt-1 text-[13px] font-body text-[var(--text-secondary)] line-clamp-2">
                    {data.description}
                  </p>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium font-body",
                  categoryStyle.bg,
                  categoryStyle.text
                )}
              >
                {data.category}
              </span>
              {data.isSurprise && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium font-body text-purple-700" data-testid="surprise-badge">
                  Surprise
                </span>
              )}
              {data.hasExpiry && data.expiryDate && (
                <span className="text-[11px] font-body text-[var(--text-muted)]">
                  Expires {data.expiryDate}
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          /* Particles effect during fly-away */
          <div className="relative h-32" data-testid="send-animation">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * Math.PI * 2) / 6) * (100 + Math.random() * 80),
                  y: Math.sin((i * Math.PI * 2) / 6) * (60 + Math.random() * 60) - 40,
                  opacity: 0,
                }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: EASE_OUT }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] text-[15px] font-medium font-body text-white transition-colors disabled:opacity-50"
          data-testid="send-button"
        >
          {isSending ? (
            "Sending..."
          ) : (
            <>
              <Send size={16} />
              Send
            </>
          )}
        </button>
        {!isSending && (
          <button
            type="button"
            onClick={onBack}
            className="h-10 w-full text-[14px] font-medium font-body text-[var(--text-secondary)]"
            data-testid="back-button"
          >
            Back
          </button>
        )}
      </div>
    </div>
  )
}
