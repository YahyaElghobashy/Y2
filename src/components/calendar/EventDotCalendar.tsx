"use client"

import { cn } from "@/lib/utils"
import { useMemo } from "react"

interface CalendarEvent {
  date: number // day of month
  category: string
  color?: string
}

interface EventDotCalendarProps {
  year: number
  month: number // 0-indexed
  events?: CalendarEvent[]
  selectedDate?: number
  onDateSelect?: (day: number) => void
  className?: string
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

const CATEGORY_COLORS: Record<string, string> = {
  milestone: "bg-[var(--gold,#DAA520)]",
  date: "bg-[var(--accent-copper,#B87333)]",
  reminder: "bg-[var(--dusk-blue,#7EC8E3)]",
  birthday: "bg-[var(--rose,#F4A8B8)]",
  health: "bg-[var(--sage,#A8B5A0)]",
}

export function EventDotCalendar({
  year,
  month,
  events = [],
  selectedDate,
  onDateSelect,
  className,
}: EventDotCalendarProps) {
  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month
  const todayDate = isCurrentMonth ? today.getDate() : -1

  const { daysInMonth, startDay } = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    return {
      daysInMonth: lastDay.getDate(),
      startDay: firstDay.getDay(),
    }
  }, [year, month])

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>()
    events.forEach((e) => {
      const existing = map.get(e.date) || []
      existing.push(e)
      map.set(e.date, existing)
    })
    return map
  }, [events])

  const cells = useMemo(() => {
    const result: (number | null)[] = []
    for (let i = 0; i < startDay; i++) result.push(null)
    for (let d = 1; d <= daysInMonth; d++) result.push(d)
    return result
  }, [startDay, daysInMonth])

  return (
    <div className={cn("w-full", className)}>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="text-center text-[11px] font-medium text-[var(--text-muted,#B5ADA4)] font-nav"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const dayEvents = eventsByDay.get(day) || []
          const isToday = day === todayDate
          const isSelected = day === selectedDate

          return (
            <button
              key={day}
              onClick={() => onDateSelect?.(day)}
              className={cn(
                "flex flex-col items-center justify-center w-10 h-10 rounded-full text-[13px] transition-colors",
                isToday &&
                  !isSelected &&
                  "border border-[var(--accent-copper,#B87333)]",
                isSelected &&
                  "bg-[var(--accent-copper,#B87333)] text-white",
                !isToday &&
                  !isSelected &&
                  "text-[var(--text-primary,#2C2825)] hover:bg-[var(--accent-soft,#E8D5C0)]/40"
              )}
            >
              <span>{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((e, j) => (
                    <span
                      key={j}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        CATEGORY_COLORS[e.category] ||
                          "bg-[var(--accent-copper,#B87333)]"
                      )}
                      style={e.color ? { backgroundColor: e.color } : undefined}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
