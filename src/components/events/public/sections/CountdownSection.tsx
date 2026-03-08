"use client"

import { useState, useEffect } from "react"
import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calcTimeLeft(target: string): TimeLeft | null {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-3xl font-bold tabular-nums sm:text-5xl"
        style={{
          fontFamily: "var(--portal-font-heading)",
          color: "var(--portal-text)",
        }}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span
        className="mt-1 text-xs uppercase tracking-wider"
        style={{ color: "var(--portal-text-muted)" }}
      >
        {label}
      </span>
    </div>
  )
}

export function CountdownSection({ section }: Props) {
  const targetDate = (section.content.target_date as string) ?? ""
  const heading = (section.content.heading as string) ?? ""
  const showDays = (section.content.show_days as boolean) ?? true
  const showHours = (section.content.show_hours as boolean) ?? true
  const showMinutes = (section.content.show_minutes as boolean) ?? true
  const showSeconds = (section.content.show_seconds as boolean) ?? true
  const completedText = (section.content.completed_text as string) || "The day has arrived!"

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    targetDate ? calcTimeLeft(targetDate) : null
  )

  useEffect(() => {
    if (!targetDate) return

    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  if (!targetDate) return null

  return (
    <div className="mx-auto max-w-2xl px-4 text-center" data-testid="countdown-section">
      {heading && (
        <h2
          className="mb-6 text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}

      {timeLeft ? (
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {showDays && <TimeUnit value={timeLeft.days} label="Days" />}
          {showHours && <TimeUnit value={timeLeft.hours} label="Hours" />}
          {showMinutes && <TimeUnit value={timeLeft.minutes} label="Min" />}
          {showSeconds && <TimeUnit value={timeLeft.seconds} label="Sec" />}
        </div>
      ) : (
        <p
          className="text-xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-primary)",
          }}
          data-testid="countdown-completed"
        >
          {completedText}
        </p>
      )}
    </div>
  )
}
