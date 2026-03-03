"use client"

import { format } from "date-fns"
import { useAuth } from "@/lib/providers/AuthProvider"
import { cn } from "@/lib/utils"

type HomeGreetingProps = {
  className?: string
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning"
  if (hour >= 12 && hour < 17) return "Good afternoon"
  if (hour >= 17 && hour < 21) return "Good evening"
  return "Good night"
}

export function HomeGreeting({ className }: HomeGreetingProps) {
  const { profile } = useAuth()
  const name = profile?.display_name ?? "there"
  const now = new Date()
  const greeting = getGreeting(now.getHours())
  const dateString = format(now, "EEEE, MMMM d")

  return (
    <div className={cn("px-5 pt-4 pb-4", className)}>
      <h1 className="font-[family-name:var(--font-display)] text-[28px] font-bold leading-[1.2] text-[var(--color-text-primary)]">
        {greeting}, {name}
      </h1>
      <p className="mt-1 font-[family-name:var(--font-body)] text-[14px] text-[var(--color-text-secondary)]">
        {dateString}
      </p>
    </div>
  )
}
