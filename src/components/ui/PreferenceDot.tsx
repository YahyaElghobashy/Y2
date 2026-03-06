"use client"

import { cn } from "@/lib/utils"

type Preference = "me" | "partner" | "similar"

interface PreferenceDotProps {
  preference: Preference
  size?: number
  className?: string
}

export function PreferenceDot({
  preference,
  size = 10,
  className,
}: PreferenceDotProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full shrink-0",
        preference === "me" && "bg-[var(--preference-me)]",
        preference === "partner" && "bg-[var(--preference-partner)]",
        preference === "similar" && "animate-preference-pulse",
        className
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        preference === "me"
          ? "You rated higher"
          : preference === "partner"
          ? "Partner rated higher"
          : "You both agree"
      }
    />
  )
}
