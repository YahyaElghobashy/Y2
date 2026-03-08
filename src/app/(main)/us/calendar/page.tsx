"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, Plus } from "lucide-react"
import { motion, type PanInfo, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EventDotCalendar } from "@/components/calendar/EventDotCalendar"
import { EventCard } from "@/components/calendar/EventCard"
import { DayDetailSheet } from "@/components/calendar/DayDetailSheet"
import { useCalendar } from "@/lib/hooks/use-calendar"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { CalendarEvent } from "@/lib/types/calendar.types"

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
  const router = useRouter()
  const { user } = useAuth()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<number | undefined>(
    today.getDate()
  )
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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

  const isCurrentMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth()

  const goToToday = useCallback(() => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    setSelectedDate(today.getDate())
  }, [today])

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

  const handleSwipeEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Check angle — only trigger for mostly-horizontal swipes
      const absX = Math.abs(info.offset.x)
      const absY = Math.abs(info.offset.y)
      if (absX < 50 || absY > absX) return // too short or too vertical

      if (info.offset.x < -50) {
        goToNextMonth()
      } else if (info.offset.x > 50) {
        goToPrevMonth()
      }
    },
    [goToNextMonth, goToPrevMonth]
  )

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

        {/* Calendar grid with swipe gestures */}
        <motion.div
          key={`${currentYear}-${currentMonth}`}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={handleSwipeEnd}
          style={{ touchAction: "pan-y" }}
          data-testid="calendar-swipe-area"
        >
          <EventDotCalendar
            year={currentYear}
            month={currentMonth}
            events={calendarDotEvents}
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date)
              setIsSheetOpen(true)
            }}
          />
        </motion.div>

        {/* Today button — visible when not on current month */}
        <AnimatePresence>
          {!isCurrentMonth && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-center"
            >
              <button
                onClick={goToToday}
                className="rounded-full bg-[var(--accent-copper,#B87333)] px-4 py-1.5 text-[12px] font-medium text-white shadow-sm"
                data-testid="today-button"
              >
                Today
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day detail bottom sheet */}
        <DayDetailSheet
          isOpen={isSheetOpen && selectedDate !== undefined}
          onClose={() => setIsSheetOpen(false)}
          date={new Date(currentYear, currentMonth, selectedDate ?? 1)}
          events={selectedDayEvents}
          userId={user?.id}
        />

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
