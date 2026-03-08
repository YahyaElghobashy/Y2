"use client"

import { useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  className?: string
  autoFocus?: boolean
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  className,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? "")

  const focusInput = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1))
      inputRefs.current[clamped]?.focus()
    },
    [length]
  )

  const handleChange = useCallback(
    (index: number, digit: string) => {
      // Only accept single numeric digit
      const cleaned = digit.replace(/\D/g, "").slice(0, 1)
      if (!cleaned && digit !== "") return

      const arr = Array.from({ length }, (_, i) => value[i] ?? "")
      arr[index] = cleaned
      onChange(arr.join(""))

      // Auto-advance to next input
      if (cleaned && index < length - 1) {
        focusInput(index + 1)
      }
    },
    [value, length, onChange, focusInput]
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault()
        const arr = Array.from({ length }, (_, i) => value[i] ?? "")
        if (arr[index]) {
          // Clear current digit
          arr[index] = ""
          onChange(arr.join(""))
        } else if (index > 0) {
          // Move back and clear previous
          arr[index - 1] = ""
          onChange(arr.join(""))
          focusInput(index - 1)
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault()
        focusInput(index - 1)
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault()
        focusInput(index + 1)
      }
    },
    [value, length, onChange, focusInput]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
      if (!pasted) return
      onChange(pasted)
      // Focus last filled input or the next empty one
      focusInput(Math.min(pasted.length, length - 1))
    },
    [length, onChange, focusInput]
  )

  return (
    <div
      role="group"
      aria-label="Enter verification code"
      className={cn("flex items-center justify-center gap-3", className)}
    >
      {Array.from({ length }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.25 }}
        >
          <input
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && i === 0}
            disabled={disabled}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={error}
            value={digits[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={cn(
              "w-12 h-14 rounded-[10px] border text-center font-mono text-[24px] outline-none transition-all duration-200",
              "bg-[var(--bg-elevated,#FFFFFF)] text-[var(--text-primary,#2C2825)]",
              "focus:border-[var(--accent-copper,#B87333)] focus:ring-2 focus:ring-[var(--accent-copper,#B87333)]/20",
              error
                ? "border-[var(--error,#C27070)] animate-shake"
                : digits[i]
                  ? "border-[var(--accent-copper,#B87333)]/50"
                  : "border-[var(--border-medium,#D9CDBF)]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </motion.div>
      ))}
    </div>
  )
}
