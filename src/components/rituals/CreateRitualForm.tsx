"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Cadence } from "@/lib/types/rituals.types"

type CreateRitualFormProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    description?: string
    icon: string
    cadence: Cadence
    is_shared: boolean
    coyyns_reward: number
  }) => void
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const EMOJI_PICKS = ["✨", "🚶", "📖", "🧘", "💪", "🙏", "🎨", "✍️", "🌅", "💤"]

const CADENCES: { value: Cadence; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

export function CreateRitualForm({ open, onClose, onSubmit }: CreateRitualFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("✨")
  const [cadence, setCadence] = useState<Cadence>("daily")
  const [isShared, setIsShared] = useState(false)
  const [coyynsReward, setCoyynsReward] = useState(0)

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit({
      title: trimmed,
      description: description.trim() || undefined,
      icon,
      cadence,
      is_shared: isShared,
      coyyns_reward: coyynsReward,
    })
    // Reset
    setTitle("")
    setDescription("")
    setIcon("✨")
    setCadence("daily")
    setIsShared(false)
    setCoyynsReward(0)
    onClose()
  }

  if (typeof window === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            data-testid="ritual-form-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40"
          />

          {/* Sheet */}
          <motion.div
            data-testid="ritual-form"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[var(--bg-primary)] p-5"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-[18px] font-semibold text-[var(--text-primary)]">
                New Ritual
              </h2>
              <button
                data-testid="ritual-form-close"
                onClick={onClose}
                className="text-[var(--text-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Emoji picker */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                Icon
              </label>
              <div data-testid="emoji-picker" className="flex gap-2 overflow-x-auto">
                {EMOJI_PICKS.map((e) => (
                  <button
                    key={e}
                    data-testid={`emoji-${e}`}
                    onClick={() => setIcon(e)}
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[18px]",
                      icon === e
                        ? "bg-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]"
                        : "bg-[var(--bg-secondary)]"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-3">
              <input
                data-testid="ritual-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ritual name"
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px] outline-none"
              />
            </div>

            {/* Description */}
            <div className="mb-3">
              <textarea
                data-testid="ritual-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px] outline-none resize-none"
              />
            </div>

            {/* Cadence pills */}
            <div className="mb-3">
              <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">
                Frequency
              </label>
              <div data-testid="cadence-selector" className="flex gap-2">
                {CADENCES.map((c) => (
                  <button
                    key={c.value}
                    data-testid={`cadence-${c.value}`}
                    onClick={() => setCadence(c.value)}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors",
                      cadence === c.value
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shared toggle */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] text-[var(--text-secondary)]">
                Shared with partner
              </span>
              <button
                data-testid="shared-toggle"
                onClick={() => setIsShared((prev) => !prev)}
                className={cn(
                  "h-6 w-11 rounded-full transition-colors",
                  isShared ? "bg-[var(--accent-primary)]" : "bg-[var(--bg-secondary)]"
                )}
                role="switch"
                aria-checked={isShared}
              >
                <motion.div
                  animate={{ x: isShared ? 20 : 2 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="h-5 w-5 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>

            {/* CoYYns reward */}
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[13px] text-[var(--text-secondary)]">
                CoYYns reward
              </span>
              <input
                data-testid="coyyns-reward-input"
                type="number"
                min={0}
                value={coyynsReward}
                onChange={(e) => setCoyynsReward(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-center text-[14px] outline-none"
              />
            </div>

            {/* Submit */}
            <motion.button
              data-testid="create-ritual-submit"
              onClick={handleSubmit}
              disabled={!title.trim()}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="w-full rounded-xl bg-[var(--accent-primary)] py-3 text-[14px] font-semibold text-white disabled:opacity-50"
            >
              Create Ritual
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
