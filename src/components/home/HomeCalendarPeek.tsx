"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CalendarPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCalendar } from "@/lib/hooks/use-calendar"
import { getCategoryColor } from "@/lib/calendar-constants"
import { format } from "date-fns"

export function HomeCalendarPeek({ className }: { className?: string }) {
  const { upcomingEvents, isLoading } = useCalendar()

  if (isLoading) return null

  const preview = upcomingEvents.slice(0, 3)

  if (preview.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl overflow-hidden px-4 py-4",
          className
        )}
        style={{
          backgroundColor: "white",
          border: "1px solid rgba(184,115,51,0.06)",
          boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
        }}
        data-testid="home-calendar-peek"
      >
        <p
          className="text-[13px] font-body text-center mb-3"
          style={{ color: "var(--text-secondary, #6B6560)" }}
          data-testid="empty-message"
        >
          No upcoming events. Plan something together?
        </p>
        <Link
          href="/us/calendar?action=create"
          className="flex items-center justify-center gap-1.5 text-[13px] font-medium"
          style={{ color: "var(--accent-copper, #B87333)" }}
          data-testid="add-event-cta"
        >
          <CalendarPlus size={14} />
          Add Event
        </Link>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden px-4 py-4",
        className
      )}
      style={{
        backgroundColor: "white",
        border: "1px solid rgba(184,115,51,0.06)",
        boxShadow: "var(--shadow-warm-sm, 0 1px 3px rgba(44,40,37,0.06))",
      }}
      data-testid="home-calendar-peek"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[15px] font-bold font-display italic"
          style={{ color: "var(--text-primary, #2C2825)" }}
          data-testid="peek-header"
        >
          Coming Up
        </span>
        <Link
          href="/us/calendar"
          className="text-[13px] font-medium font-body"
          style={{ color: "var(--accent-copper, #B87333)" }}
          data-testid="see-all-link"
        >
          See All
        </Link>
      </div>

      {/* Event rows */}
      <div className="flex flex-col gap-2.5">
        {preview.map((event) => {
          const color = getCategoryColor(event.category)
          const dayNum = format(new Date(event.event_date + "T00:00:00"), "d")
          const monthAbbr = format(new Date(event.event_date + "T00:00:00"), "MMM")

          return (
            <Link
              key={event.id}
              href={`/us/calendar?date=${event.event_date}`}
              className="block"
            >
              <motion.div
                className="flex items-center gap-3"
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                data-testid="event-row"
              >
                {/* Date badge */}
                <div
                  className="w-9 h-9 rounded-full flex flex-col items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}1A` }}
                  data-testid="date-badge"
                  data-color={color}
                >
                  <span
                    className="text-[12px] font-bold leading-none font-display"
                    style={{ color }}
                  >
                    {dayNum}
                  </span>
                  <span
                    className="text-[8px] uppercase leading-none mt-px font-body"
                    style={{ color }}
                  >
                    {monthAbbr}
                  </span>
                </div>

                {/* Title + time */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px] font-medium font-body truncate"
                    style={{ color: "var(--text-primary, #2C2825)" }}
                    data-testid="event-title"
                  >
                    {event.title}
                  </p>
                  {event.event_time && (
                    <p
                      className="text-[11px] font-body"
                      style={{ color: "var(--text-muted, #B5ADA4)" }}
                      data-testid="event-time"
                    >
                      {format(
                        new Date(`2000-01-01T${event.event_time}`),
                        "h:mm a"
                      )}
                    </p>
                  )}
                </div>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
