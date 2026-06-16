"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { PageTransition } from "@/components/animations"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { PlanView, type PlanData, type PlanEvent } from "@/components/calendar/PlanView"
import { DayDetailSheet } from "@/components/calendar/DayDetailSheet"
import { useCalendar } from "@/lib/hooks/use-calendar"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { CalendarEvent } from "@/lib/types/calendar.types"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/** Maps a DB event category onto PlanView's four dot-color keys (every key is valid for CAT_COLOR). */
function mapCategory(category: string): PlanEvent["cat"] {
  switch (category) {
    case "date_night":
      return "date"
    case "milestone":
      return "milestone"
    // TODO(wire): PlanView has no "reminder"/"other" dot color → fold both onto "family" (teal).
    default:
      return "family"
  }
}

/** "MMM d · h:mm a" when a time exists, else "MMM d". */
function formatWhen(event: CalendarEvent): string {
  const d = new Date(event.event_date + "T00:00:00")
  const dateStr = format(d, "MMM d")
  if (event.event_time) {
    const timeStr = format(new Date(`2000-01-01T${event.event_time}`), "h:mm a")
    return `${dateStr} · ${timeStr}`
  }
  return dateStr
}

export default function CalendarTabPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { upcomingEvents, getEventsForMonth, isLoading, error } = useCalendar()

  const today = new Date()
  const realYear = today.getFullYear()
  const realMonth = today.getMonth() // 0-indexed

  // Displayed month/year — lifted into state so prev/next chevrons can navigate.
  const [view, setView] = useState({ year: realYear, month: realMonth }) // month 0-indexed
  const { year: viewYear, month: viewMonth } = view

  // Highlight "today" only when the displayed month is the real current month.
  const isCurrentMonth = viewYear === realYear && viewMonth === realMonth

  // Selected day (1-indexed) for the day-detail sheet; null when closed.
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const goPrevMonth = useCallback(() => {
    setView(({ year, month }) => (month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }))
    setSelectedDay(null)
  }, [])

  const goNextMonth = useCallback(() => {
    setView(({ year, month }) => (month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }))
    setSelectedDay(null)
  }, [])

  // Raw DB events for the displayed month (1-indexed for the hook); reused by the grid + day sheet.
  const monthEvents: CalendarEvent[] = useMemo(
    () => getEventsForMonth(viewYear, viewMonth + 1),
    [getEventsForMonth, viewYear, viewMonth]
  )

  const data: PlanData = useMemo(() => {
    const events: PlanEvent[] = monthEvents.map((e) => ({
      id: e.id,
      day: parseInt(e.event_date.split("-")[2], 10),
      cat: mapCategory(e.category),
      title: e.title,
      when: formatWhen(e),
    }))

    const upcoming: PlanEvent[] = upcomingEvents.slice(0, 3).map((e) => ({
      id: e.id,
      day: parseInt(e.event_date.split("-")[2], 10),
      cat: mapCategory(e.category),
      title: e.title,
      when: formatWhen(e),
    }))

    return {
      monthLabel: `${MONTHS[viewMonth]} ${viewYear}`,
      daysInMonth: new Date(viewYear, viewMonth + 1, 0).getDate(),
      // JS getDay(): 0 = Sunday, matching PlanView's WEEKDAYS starting on "S".
      leadingBlanks: new Date(viewYear, viewMonth, 1).getDay(),
      // 0 = no highlight; only set the real day-of-month when viewing the current month.
      today: isCurrentMonth ? today.getDate() : 0,
      events,
      upcoming,
    }
    // today is a fresh Date each render but its values are stable within a day; deps cover the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthEvents, upcomingEvents, viewYear, viewMonth, isCurrentMonth])

  // Events on the currently-selected day (filtered from the displayed month's events).
  const selectedDayEvents: CalendarEvent[] = useMemo(() => {
    if (selectedDay === null) return []
    const dd = String(selectedDay).padStart(2, "0")
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${dd}`
    return monthEvents.filter((e) => e.event_date === prefix)
  }, [selectedDay, monthEvents, viewYear, viewMonth])

  const selectedDate = useMemo(
    () => (selectedDay === null ? null : new Date(viewYear, viewMonth, selectedDay)),
    [selectedDay, viewYear, viewMonth]
  )

  if (isLoading) {
    return (
      <PageTransition>
        <div data-testid="calendar-loading" className="py-2">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <p data-testid="calendar-error" className="px-1 py-6 text-center text-[14px]" style={{ color: "var(--color-error)" }}>
          Something went wrong loading your calendar.
        </p>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      {/* FAB routes to the existing create sub-route; create/edit stay at their own routes. */}
      <PlanView
        data={data}
        onAdd={() => router.push("/us/calendar/create")}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
        onSelectDay={(day) => setSelectedDay(day)}
        onEditEvent={(id) => router.push(`/us/calendar/edit/${id}`)}
      />

      {/* Day detail — opens for the tapped day; reuses the shared sheet (its own taps route to edit). */}
      {selectedDate && (
        <DayDetailSheet
          isOpen={selectedDay !== null}
          onClose={() => setSelectedDay(null)}
          date={selectedDate}
          events={selectedDayEvents}
          userId={user?.id}
        />
      )}
    </PageTransition>
  )
}
