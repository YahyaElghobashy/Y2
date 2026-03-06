"use client"

import { RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAzkar } from "@/lib/hooks/use-azkar"
import { cn } from "@/lib/utils"
import type { AzkarSessionType } from "@/lib/types/spiritual.types"

type AzkarCounterProps = {
  className?: string
}

const SESSION_OPTIONS: { type: AzkarSessionType; label: string }[] = [
  { type: "morning", label: "Morning" },
  { type: "evening", label: "Evening" },
]

const DHIKR_LABEL = "SubhanAllah"

export function AzkarCounter({ className }: AzkarCounterProps) {
  const {
    session,
    sessionType,
    increment,
    reset,
    switchType,
    isLoading,
    error,
    justCompleted,
  } = useAzkar()

  if (isLoading) {
    return (
      <div
        className={cn("px-6 py-4", className)}
        data-testid="azkar-counter-loading"
      >
        <div className="h-4 w-32 rounded bg-[var(--bg-soft-cream,#F5EDE3)] animate-skeleton-warm" />
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className={cn("px-6 py-4", className)} data-testid="azkar-counter-error">
        <h3
          className="text-sm uppercase tracking-[0.2em] font-bold mb-2"
          style={{ color: "var(--sage, #A8B5A0)" }}
        >
          Tasbih
        </h3>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/40 p-4">
          <p className="text-[13px] text-[var(--text-muted)]">
            Could not load azkar data
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-[13px] font-medium"
            style={{ color: "var(--sage, #A8B5A0)" }}
          >
            Tap to reload
          </button>
        </div>
      </div>
    )
  }

  const count = session?.count ?? 0
  const target = session?.target ?? 33
  const isComplete = count >= target

  return (
    <div className={cn("px-6 py-4", className)} data-testid="azkar-counter">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm uppercase tracking-[0.2em] font-bold"
          style={{ color: "var(--sage, #A8B5A0)" }}
        >
          Tasbih
        </h3>

        {/* Morning / Evening toggle */}
        <div
          className="relative flex rounded-full p-1"
          style={{
            backgroundColor: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(168,181,160,0.1)",
          }}
          data-testid="session-toggle"
        >
          {SESSION_OPTIONS.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              className={cn(
                "relative z-10 rounded-full px-4 py-1 text-[10px] font-bold uppercase transition-colors",
                sessionType === type
                  ? "text-white"
                  : "text-[var(--text-muted)]"
              )}
              data-testid={`toggle-${type}`}
              data-active={sessionType === type}
              onClick={() => switchType(type)}
              aria-pressed={sessionType === type}
            >
              {label}
            </button>
          ))}
          {/* Sliding indicator */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-full"
            style={{ backgroundColor: "var(--sage, #A8B5A0)" }}
            layoutId="azkar-toggle-indicator"
            initial={false}
            animate={{
              width: "50%",
              left: sessionType === "morning" ? "4px" : "50%",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </div>

      {error && (
        <p className="text-[12px] text-red-500 mb-3" data-testid="azkar-error">
          {error}
        </p>
      )}

      {/* Enlarged tap counter */}
      <div className="flex flex-col items-center py-4">
        <div className="relative">
          <motion.button
            type="button"
            className="flex flex-col items-center justify-center w-[140px] h-[140px] rounded-full bg-white shadow-lg"
            style={{
              border: isComplete
                ? "8px solid var(--accent-copper, #B87333)"
                : "8px solid rgba(168,181,160,0.08)",
              boxShadow: isComplete
                ? "0 0 15px rgba(184,115,51,0.2)"
                : "0 4px 12px rgba(0,0,0,0.05)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={increment}
            aria-label={`Count: ${count} of ${target}. Tap to increment.`}
            data-testid="tap-area"
          >
            <span
              className="text-4xl font-bold text-[var(--text-primary)]"
              data-testid="count-display"
            >
              {count}
            </span>
            <span
              className="text-xs font-medium mt-1"
              style={{ color: "var(--sage, #A8B5A0)" }}
            >
              {DHIKR_LABEL}
            </span>
          </motion.button>

          {/* Completion ripple */}
          <AnimatePresence>
            {justCompleted && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: "2px solid var(--accent-copper, #B87333)" }}
                data-testid="completion-ripple"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>

          {/* Reset button — positioned to the right */}
          <button
            type="button"
            className="absolute -end-14 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm transition-colors"
            style={{ border: "1px solid rgba(168,181,160,0.1)" }}
            onClick={reset}
            data-testid="reset-button"
            aria-label="Reset counter"
          >
            <RotateCcw size={16} style={{ color: "var(--sage, #A8B5A0)" }} />
          </button>
        </div>

        {/* Target display */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">
            Target
          </p>
          <p className="text-lg font-semibold text-[var(--text-secondary)]">
            {count} / {target}
          </p>
        </div>
      </div>
    </div>
  )
}
