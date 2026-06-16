"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * RatingSheet — bottom sheet for rating a watched title (docs/DESIGN_BLUEPRINT.md §4.4).
 * 1–10 score picker + optional short reaction → confirm. Mirrors MarketplaceView's
 * confirm-sheet style (scrim + spring-up rounded sheet, warm tokens). Presentational:
 * the container page wires the real submitRating mutation through onSubmit.
 */
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function RatingSheet({
  open,
  title,
  initialScore,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  /** Pre-select a score (e.g. the user's existing rating). Falls back to 8. */
  initialScore?: number
  onClose: () => void
  onSubmit: (score: number, reaction?: string) => void | Promise<void>
}) {
  const [score, setScore] = useState(initialScore ?? 8)
  const [reaction, setReaction] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Re-seed the picker each time the sheet opens for a (possibly new) title.
  useEffect(() => {
    if (open) {
      setScore(initialScore ?? 8)
      setReaction("")
      setSubmitting(false)
    }
  }, [open, initialScore, title])

  const confirm = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onSubmit(score, reaction.trim() || undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && onClose()}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[100] mx-auto max-w-[430px] rounded-t-[28px] p-6 pb-10"
            style={{ background: "var(--card)", boxShadow: "var(--shadow-warm-xl)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            role="dialog"
            aria-modal="true"
          >
            <span className="mx-auto mb-4 block h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />

            <p className="text-center text-[12px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-nav)", color: "var(--color-terracotta)" }}>
              How was it?
            </p>
            <p className="mt-2 text-center text-[22px] font-extrabold leading-snug" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
              {title}
            </p>

            {/* Selected score read-out */}
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <Star size={20} fill="var(--color-amber)" stroke="none" />
              <span className="text-[28px] font-extrabold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                {score}
              </span>
              <span className="text-[15px] font-bold" style={{ color: "var(--color-ink-soft)" }}>/ 10</span>
            </div>

            {/* 1–10 picker */}
            <div className="mt-4 grid grid-cols-10 gap-1.5">
              {SCORES.map((n) => {
                const active = n === score
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    aria-pressed={active}
                    aria-label={`Rate ${n} out of 10`}
                    className={cn(
                      "grid aspect-square place-items-center rounded-xl text-[13px] font-bold transition-colors"
                    )}
                    style={{
                      background: active ? "var(--color-amber)" : "var(--color-sand)",
                      color: active ? "#2A2018" : "var(--color-ink-soft)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {n}
                  </button>
                )
              })}
            </div>

            {/* Optional reaction */}
            <input
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              maxLength={120}
              placeholder="A word about it… (optional)"
              className="mt-4 w-full rounded-xl px-3.5 py-3 text-[14px] outline-none"
              style={{
                background: "var(--color-sand)",
                color: "var(--foreground)",
                fontFamily: "var(--font-body)",
                border: "1px solid var(--border)",
              }}
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full py-3 text-[14px] font-bold disabled:opacity-45"
                style={{ background: "var(--color-sand)", color: "var(--foreground)", fontFamily: "var(--font-body)" }}
              >
                Not yet
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={submitting}
                className="rounded-full py-3 text-[14px] font-bold disabled:opacity-45"
                style={{ background: "var(--color-coral)", color: "#FFF7EF", fontFamily: "var(--font-body)" }}
              >
                {submitting ? "Saving…" : "Save rating ✦"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
