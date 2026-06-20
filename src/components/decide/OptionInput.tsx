"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Minus, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DecideOption } from "./contract"
import { makeOption } from "./shared/random"

/** A named set of starter options. */
export type OptionPreset = { label: string; options: string[] }

export const DEFAULT_PRESETS: OptionPreset[] = [
  { label: "Yes / No", options: ["Yes", "No"] },
  { label: "Dinner", options: ["Pizza", "Shawarma", "Koshari", "Sushi", "Cook at home"] },
  { label: "Tonight", options: ["Movie", "Walk", "Game night", "Early sleep"] },
  { label: "Who picks", options: ["Me", "You"] },
]

type OptionInputProps = {
  options: DecideOption[]
  onChange: (options: DecideOption[]) => void
  /** Show a 1–5 weight stepper per row (for weighing tools). */
  showWeights?: boolean
  presets?: OptionPreset[]
  min?: number
  max?: number
  className?: string
}

const WEIGHT_MIN = 1
const WEIGHT_MAX = 5

export function OptionInput({
  options,
  onChange,
  showWeights = false,
  presets = DEFAULT_PRESETS,
  min = 2,
  max = 12,
  className,
}: OptionInputProps) {
  const canRemove = options.length > min
  const canAdd = options.length < max

  function update(id: string, patch: Partial<DecideOption>) {
    onChange(options.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }
  function remove(id: string) {
    if (options.length > min) onChange(options.filter((o) => o.id !== id))
  }
  function add() {
    if (canAdd) onChange([...options, makeOption("")])
  }
  function applyPreset(p: OptionPreset) {
    onChange(p.options.slice(0, max).map((label) => makeOption(label)))
  }
  function bumpWeight(o: DecideOption, delta: number) {
    const next = Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, (o.weight ?? 1) + delta))
    update(o.id, { weight: next })
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="rounded-full border px-3 py-1 text-[12px] font-semibold"
            style={{
              borderColor: "var(--border)",
              background: "var(--color-sand)",
              color: "var(--color-ink-soft)",
              fontFamily: "var(--font-nav)",
            }}
            data-testid={`preset-${p.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Option rows */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {options.map((o, i) => (
            <motion.div
              key={o.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={o.label}
                onChange={(e) => update(o.id, { label: e.target.value })}
                placeholder={`Option ${i + 1}`}
                aria-label={`Option ${i + 1}`}
                className="min-w-0 flex-1 rounded-[10px] border px-3 py-2 text-[15px] outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-body)",
                }}
                data-testid={`option-input-${i}`}
              />

              {showWeights && (
                <div
                  className="flex items-center gap-1 rounded-[10px] border px-1"
                  style={{ borderColor: "var(--border)" }}
                >
                  <button
                    type="button"
                    onClick={() => bumpWeight(o, -1)}
                    aria-label={`Lower weight of option ${i + 1}`}
                    className="grid h-7 w-7 place-items-center rounded-md disabled:opacity-30"
                    disabled={(o.weight ?? 1) <= WEIGHT_MIN}
                    style={{ color: "var(--color-ink-soft)" }}
                  >
                    <Minus size={14} strokeWidth={2} />
                  </button>
                  <span
                    className="w-4 text-center text-[13px] font-bold tabular-nums"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
                    data-testid={`weight-${i}`}
                  >
                    {o.weight ?? 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => bumpWeight(o, 1)}
                    aria-label={`Raise weight of option ${i + 1}`}
                    className="grid h-7 w-7 place-items-center rounded-md disabled:opacity-30"
                    disabled={(o.weight ?? 1) >= WEIGHT_MAX}
                    style={{ color: "var(--color-ink-soft)" }}
                  >
                    <Plus size={14} strokeWidth={2} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => remove(o.id)}
                disabled={!canRemove}
                aria-label={`Remove option ${i + 1}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full disabled:opacity-30"
                style={{ color: "var(--color-ink-soft)" }}
                data-testid={`remove-option-${i}`}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add */}
      <button
        type="button"
        onClick={add}
        disabled={!canAdd}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-[14px] font-semibold disabled:opacity-40"
        style={{ borderColor: "var(--border)", color: "var(--color-terracotta)", fontFamily: "var(--font-nav)" }}
        data-testid="add-option"
      >
        <Plus size={16} strokeWidth={2.25} />
        Add option
      </button>
    </div>
  )
}
