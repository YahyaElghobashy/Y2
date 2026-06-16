"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { PageTransition } from "@/components/animations"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { PlanView, type PlanData, type PlanEvent } from "@/components/calendar/PlanView"
import { useCalendar } from "@/lib/hooks/use-calendar"
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
  const { upcomingEvents, getEventsForMonth, isLoading, error } = useCalendar()

  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() // 0-indexed

  const data: PlanData = useMemo(() => {
    // getEventsForMonth expects a 1-indexed month.
    const monthEvents = getEventsForMonth(currentYear, currentMonth + 1)

    const events: PlanEvent[] = monthEvents.map((e) => ({
      day: parseInt(e.event_date.split("-")[2], 10),
      cat: mapCategory(e.category),
      title: e.title,
      when: formatWhen(e),
    }))

    const upcoming: PlanEvent[] = upcomingEvents.slice(0, 3).map((e) => ({
      day: parseInt(e.event_date.split("-")[2], 10),
      cat: mapCategory(e.category),
      title: e.title,
      when: formatWhen(e),
    }))

    return {
      monthLabel: `${MONTHS[currentMonth]} ${currentYear}`,
      daysInMonth: new Date(currentYear, currentMonth + 1, 0).getDate(),
      // JS getDay(): 0 = Sunday, matching PlanView's WEEKDAYS starting on "S".
      leadingBlanks: new Date(currentYear, currentMonth, 1).getDay(),
      today: today.getDate(),
      events,
      upcoming,
    }
    // today is a fresh Date each render but its values are stable within a day; deps cover the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getEventsForMonth, upcomingEvents, currentYear, currentMonth])

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
      <PlanView data={data} onAdd={() => router.push("/us/calendar/create")} />
    </PageTransition>
  )
}
