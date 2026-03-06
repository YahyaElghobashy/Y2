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
        <div className="h-4 w-32 rounded bg-[var(--color-bg-secondary,#F5F0E8)] animate-pulse" />
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className={cn("px-6 py-4", className)} data-testid="azkar-counter-error">
        <h3 className="text-[16px] font-semibold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)] mb-2">
          Azkar
        </h3>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-[var(--color-bg-secondary,#F5F0E8)] p-4">
          <p className="text-[13px] text-[var(--color-text-muted,#B5ADA4)]">
            Could not load azkar data
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-[13px] font-medium text-[var(--color-accent-primary,#C4956A)]"
          >
            Tap to reload
          </button>
        </div>
      </div>
    )
  }

  const count = session?.count ?? 0
  const target = session?.target ?? 33

  return (
    <div className={cn("px-6 py-4", className)} data-testid="azkar-counter">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]">
          Azkar
        </h3>

        {/* Morning / Evening toggle */}
        <div
          className="relative flex rounded-full bg-[var(--color-bg-secondary,#F5F0E8)] p-0.5"
          data-testid="session-toggle"
        >
          {SESSION_OPTIONS.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              className={cn(
                "relative z-10 rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                sessionType === type
                  ? "text-white"
                  : "text-[var(--color-text-secondary,#8C8279)]"
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
            className="absolute top-0.5 bottom-0.5 rounded-full bg-[var(--accent-primary,#C4956A)]"
            layoutId="azkar-toggle-indicator"
            style={{
              width: "50%",
              left: sessionType === "morning" ? "2px" : "50%",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </div>

      {error && (
        <p
          className="text-[12px] text-red-500 mb-3"
          data-testid="azkar-error"
        >
          {error}
        </p>
      )}

      {/* Tap counter area */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <motion.button
            type="button"
            className="flex items-center justify-center w-[120px] h-[120px] rounded-full bg-[var(--color-bg-secondary,#F5F0E8)] border-2 border-[var(--color-border-subtle,rgba(44,40,37,0.08))]"
            whileTap={{ scale: 1.05 }}
            onClick={increment}
            aria-label={`Count: ${count} of ${target}. Tap to increment.`}
            data-testid="tap-area"
          >
            <div className="text-center">
              <span
                className="block text-[32px] font-bold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]"
                data-testid="count-display"
              >
                {count}
              </span>
              <span className="block text-[12px] text-[var(--color-text-secondary,#8C8279)]">
                / {target}
              </span>
            </div>
          </motion.button>

          {/* Completion ripple */}
          <AnimatePresence>
            {justCompleted && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[var(--accent-primary,#C4956A)]"
                data-testid="completion-ripple"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Reset button */}
        <button
          type="button"
          className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary,#8C8279)] hover:text-[var(--color-text-primary,#2C2825)] transition-colors"
          onClick={reset}
          data-testid="reset-button"
          aria-label="Reset counter"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  )
}
