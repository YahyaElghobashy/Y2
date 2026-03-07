"use client"

import { cn } from "@/lib/utils"

type StrengthLevel = 0 | 1 | 2 | 3 | 4

interface PasswordStrengthDotsProps {
  strength: StrengthLevel
  className?: string
}

const strengthColors: Record<StrengthLevel, string> = {
  0: "bg-[var(--bg-parchment,#E5D9CB)]",
  1: "bg-[var(--error,#C27070)]",
  2: "bg-[var(--gold,#DAA520)]",
  3: "bg-[var(--success,#7CB67C)]",
  4: "bg-[var(--accent-copper,#B87333)]",
}

export function PasswordStrengthDots({
  strength,
  className,
}: PasswordStrengthDotsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {([1, 2, 3, 4] as const).map((level) => (
        <div
          key={level}
          className={cn(
            "h-2 w-2 rounded-full transition-colors duration-200",
            strength >= level
              ? strengthColors[strength]
              : "bg-[var(--bg-parchment,#E5D9CB)]"
          )}
        />
      ))}
    </div>
  )
}

/** Calculate password strength (0-4) */
export function calculatePasswordStrength(password: string): StrengthLevel {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score as StrengthLevel
}
