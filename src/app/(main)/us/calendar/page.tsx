"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, Plus, CalendarPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EventDotCalendar } from "@/components/calendar/EventDotCalendar"
import { EventCard } from "@/components/calendar/EventCard"
import { EventCategoryBadge } from "@/components/calendar/EventCategoryBadge"
import { useCalendar } from "@/lib/hooks/use-calendar"
import { getCategoryLabel } from "@/lib/calendar-constants"
import type { CalendarEvent, EventCategory } from "@/lib/types/calendar.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/** Maps DB category to EventDotCalendar's dot color keys */
const CATEGORY_DOT_MAP: Record<string, string> = {
  date_night: "date",
  milestone: "milestone",
  reminder: "reminder",
  other: "reminder", // grey dot for "other"
}

/** Maps DB category to EventCard badge variant */
function categoryToBadge(category: string): "milestone" | "copper" | "reminder" | "birthday" | undefined {
  switch (category) {
    case "date_night": return "copper"
    case "milestone": return "milestone"
    case "reminder": return "reminder"
    default: return undefined
  }
}

export default function CalendarTabPage() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<number | undefined>(
    today.getDate()
  )

  const {
    upcomingEvents,
    isLoading,
    error,
    refreshEvents,
    getEventsForMonth,
  } = useCalendar()

  // Get events for the displayed month (getEventsForMonth uses 1-indexed months via date prefix)
  const monthEvents = useMemo(
    () => getEventsForMonth(currentYear, currentMonth + 1),
    [getEventsForMonth, currentYear, currentMonth]
  )

  // Map CalendarEvent[] → EventDotCalendar's expected format {date: number, category: string}
  const calendarDotEvents = useMemo(
    () =>
      monthEvents.map((e) => ({
        date: parseInt(e.event_date.split("-")[2], 10),
        category: CATEGORY_DOT_MAP[e.category] ?? "reminder",
      })),
    [monthEvents]
  )

  // Events for the selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return []
    const dayStr = String(selectedDate).padStart(2, "0")
    const monthStr = String(currentMonth + 1).padStart(2, "0")
    const datePrefix = `${currentYear}-${monthStr}-${dayStr}`
    return monthEvents.filter((e) => e.event_date === datePrefix)
  }, [selectedDate, monthEvents, currentYear, currentMonth])

  // Upcoming events (next 3)
  const comingUpEvents = useMemo(
    () => upcomingEvents.slice(0, 3),
    [upcomingEvents]
  )

  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
    setSelectedDate(undefined)
  }, [currentMonth])

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
    setSelectedDate(undefined)
  }, [currentMonth])

  /** Build the create URL with the currently selected or today's date */
  const createUrl = useMemo(() => {
    if (selectedDate) {
      const monthStr = String(currentMonth + 1).padStart(2, "0")
      const dayStr = String(selectedDate).padStart(2, "0")
      return `/us/calendar/create?date=${currentYear}-${monthStr}-${dayStr}`
    }
    return "/us/calendar/create"
  }, [selectedDate, currentYear, currentMonth])

  const formatEventDate = useCallback((event: CalendarEvent) => {
    const d = new Date(event.event_date + "T00:00:00")
    const dateStr = format(d, "MMM d")
    if (event.event_time) {
      const timeStr = format(new Date(`2000-01-01T${event.event_time}`), "h:mm a")
      return `${dateStr} · ${timeStr}`
    }
    return dateStr
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Our Calendar" backHref="/us" />
        <div className="flex flex-col gap-5 px-5 pb-24" data-testid="calendar-loading">
          <LoadingSkeleton variant="header" />
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="list-item" count={3} />
        </div>
      </PageTransition>
    )
  }

  // Error state
  if (error) {
    return (
      <PageTransition>
        <PageHeader title="Our Calendar" backHref="/us" />
        <div className="flex flex-col items-center gap-4 px-5 pt-12" data-testid="calendar-error">
          <div className="w-12 h-12 rounded-full bg-[var(--functional-error,#E74C3C)]/10 flex items-center justify-center">
            <Calendar size={24} className="text-[var(--functional-error,#E74C3C)]" />
          </div>
          <p className="text-[14px] text-[var(--text-secondary,#6B6560)] text-center">
            Something went wrong loading your calendar.
          </p>
          <button
            onClick={() => refreshEvents()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-[var(--accent-copper,#B87333)] bg-[var(--accent-copper,#B87333)]/10"
            data-testid="calendar-retry"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageHeader title="Our Calendar" backHref="/us" />

      <div className="flex flex-col gap-5 px-5 pb-24">
        {/* Month/year navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-secondary)]"
            aria-label="Previous month"
            data-testid="prev-month"
          >
            <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
          </button>

          <h2
            className="font-display text-[18px] font-semibold text-[var(--text-primary)]"
            data-testid="month-header"
          >
            {MONTHS[currentMonth]} {currentYear}
          </h2>

          <button
            onClick={goToNextMonth}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-secondary)]"
            aria-label="Next month"
            data-testid="next-month"
          >
            <ChevronRight size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Calendar grid */}
        <EventDotCalendar
          year={currentYear}
          month={currentMonth}
          events={calendarDotEvents}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Selected day events */}
        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              key={`day-${currentYear}-${currentMonth}-${selectedDate}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="flex flex-col gap-2"
              data-testid="selected-day-events"
            >
              <h3 className="font-nav text-[11px] font-medium uppercase tracking-widest text-[var(--text-secondary)]">
                {MONTHS[currentMonth]} {selectedDate}
              </h3>

              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    title={event.title}
                    date={formatEventDate(event)}
                    badge={categoryToBadge(event.category)}
                    onClick={() => {
                      // TC05 will add edit navigation here
                    }}
                  />
                ))
              ) : (
                <Link
                  href={createUrl}
                  className="rounded-xl border border-dashed border-[var(--border-subtle)] px-4 py-6 text-center block"
                  data-testid="empty-day"
                >
                  <CalendarPlus size={20} className="mx-auto mb-1.5 text-[var(--accent-copper,#B87333)]" />
                  <p className="text-[13px] text-[var(--text-muted,#B5ADA4)]">
                    No events — tap to add one
                  </p>
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coming Up section */}
        <div className="flex flex-col gap-3">
          <h3 className="font-nav text-[11px] font-medium uppercase tracking-widest text-[var(--text-secondary)]">
            Coming Up
          </h3>

          {comingUpEvents.length > 0 ? (
            <div className="flex flex-col gap-2">
              {comingUpEvents.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  date={formatEventDate(event)}
                  badge={categoryToBadge(event.category)}
                  onClick={() => {
                    // TC05 will add edit navigation here
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar size={48} strokeWidth={1.25} />}
              title="Nothing coming up"
              subtitle="Your week is clear — plan something special!"
              className="min-h-[120px]"
            />
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link
        href={createUrl}
        className="fixed bottom-20 end-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-copper,#B87333)] text-white shadow-[0_4px_14px_rgba(184,115,51,0.35)] active:scale-95 transition-transform"
        aria-label="Create event"
        data-testid="fab-create"
      >
        <Plus size={24} />
      </Link>
    </PageTransition>
  )
}
