"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCalendar } from "@/lib/hooks/use-calendar"
import { format } from "date-fns"

export function HomeCountdownWidget({ className }: { className?: string }) {
  const { milestones, isLoading } = useCalendar()

  if (isLoading || milestones.length === 0) return null

  const next = milestones[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(next.event_date + "T00:00:00")
  const diffMs = eventDate.getTime() - today.getTime()
  const daysUntil = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))

  const formattedDate = format(eventDate, "MMMM d, yyyy")

  return (
    <Link href={`/us/calendar?date=${next.event_date}`} className="block">
      <motion.div
        className={cn(
          "bg-[var(--color-bg-elevated)] rounded-2xl shadow-soft overflow-hidden px-4 py-4",
          "border border-[#DAA520]/30",
          className
        )}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.1 }}
        data-testid="home-countdown-widget"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(218, 165, 32, 0.12)" }}
            >
              <Star size={18} className="text-[#DAA520]" />
            </div>
            <div>
              <p
                className="text-[14px] font-medium font-[family-name:var(--font-body)] text-[var(--color-text-primary)]"
                data-testid="countdown-title"
              >
                {next.title}
              </p>
              <p
                className="text-[12px] font-[family-name:var(--font-body)] text-[var(--color-text-muted)]"
                data-testid="countdown-date"
              >
                {formattedDate}
              </p>
            </div>
          </div>

          <div className="text-end" data-testid="countdown-days">
            {daysUntil === 0 ? (
              <span className="text-[16px] font-bold text-[#DAA520]">
                Today!
              </span>
            ) : (
              <>
                <span className="text-[20px] font-bold text-[#DAA520] font-[family-name:var(--font-mono)]">
                  {daysUntil}
                </span>
                <span className="text-[12px] text-[var(--color-text-secondary)] ms-1">
                  {daysUntil === 1 ? "day" : "days"}
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
