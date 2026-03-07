"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { EventDotCalendar } from "@/components/calendar/EventDotCalendar"
import { EventCard } from "@/components/calendar/EventCard"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

// Sample events for demo — replace with Supabase data later
const SAMPLE_EVENTS = [
  { date: 7, category: "date", title: "Date Night", emoji: "🍷", badge: "copper" as const },
  { date: 14, category: "milestone", title: "6 Month Anniversary", emoji: "💫", badge: "milestone" as const },
  { date: 20, category: "birthday", title: "Yara's Birthday", emoji: "🎂", badge: "birthday" as const },
  { date: 25, category: "reminder", title: "Dentist Appointment", emoji: "🦷", badge: "reminder" as const },
]

export default function CalendarTabPage() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<number | undefined>(
    today.getDate()
  )

  const calendarEvents = useMemo(
    () =>
      SAMPLE_EVENTS.map((e) => ({
        date: e.date,
        category: e.category,
      })),
    []
  )

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return []
    return SAMPLE_EVENTS.filter((e) => e.date === selectedDate)
  }, [selectedDate])

  // Upcoming events (next 7 days from today)
  const upcomingEvents = useMemo(() => {
    const todayDate = today.getDate()
    return SAMPLE_EVENTS.filter(
      (e) => e.date >= todayDate && e.date <= todayDate + 7
    ).sort((a, b) => a.date - b.date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
    setSelectedDate(undefined)
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
    setSelectedDate(undefined)
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
          >
            <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
          </button>

          <h2 className="font-display text-[18px] font-semibold text-[var(--text-primary)]">
            {MONTHS[currentMonth]} {currentYear}
          </h2>

          <button
            onClick={goToNextMonth}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-[var(--bg-secondary)]"
          >
            <ChevronRight size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Calendar grid */}
        <EventDotCalendar
          year={currentYear}
          month={currentMonth}
          events={calendarEvents}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Selected day events */}
        {selectedDate && selectedDayEvents.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="flex flex-col gap-2"
            >
              <h3 className="font-nav text-[11px] font-medium uppercase tracking-widest text-[var(--text-secondary)]">
                {MONTHS[currentMonth]} {selectedDate}
              </h3>
              {selectedDayEvents.map((event, i) => (
                <EventCard
                  key={i}
                  title={event.title}
                  date={`${MONTHS[currentMonth]} ${event.date}`}
                  badge={event.badge}
                  emoji={event.emoji}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Coming Up section */}
        <div className="flex flex-col gap-3">
          <h3 className="font-nav text-[11px] font-medium uppercase tracking-widest text-[var(--text-secondary)]">
            Coming Up
          </h3>

          {upcomingEvents.length > 0 ? (
            <div className="flex flex-col gap-2">
              {upcomingEvents.map((event, i) => (
                <EventCard
                  key={i}
                  title={event.title}
                  date={`${MONTHS[currentMonth]} ${event.date}`}
                  badge={event.badge}
                  emoji={event.emoji}
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
    </PageTransition>
  )
}
