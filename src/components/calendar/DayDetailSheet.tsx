"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { X, Plus, CalendarPlus } from "lucide-react"
import { format } from "date-fns"
import { EventCard } from "@/components/calendar/EventCard"
import type { CalendarEvent } from "@/lib/types/calendar.types"

type BadgeVariant = "milestone" | "copper" | "reminder" | "birthday"

function categoryToBadge(category: string): BadgeVariant | undefined {
  switch (category) {
    case "date_night": return "copper"
    case "milestone": return "milestone"
    case "reminder": return "reminder"
    default: return undefined
  }
}

function formatEventTime(event: CalendarEvent): string {
  if (!event.event_time) return "All day"
  const timeStr = format(new Date(`2000-01-01T${event.event_time}`), "h:mm a")
  if (event.end_time) {
    const endStr = format(new Date(`2000-01-01T${event.end_time}`), "h:mm a")
    return `${timeStr} – ${endStr}`
  }
  return timeStr
}

interface DayDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  events: CalendarEvent[]
  userId?: string
}

const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const SHEET_VARIANTS = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
}

export function DayDetailSheet({ isOpen, onClose, date, events, userId }: DayDetailSheetProps) {
  const router = useRouter()

  const dateStr = format(date, "yyyy-MM-dd")
  const formattedDate = format(date, "EEEE, MMMM d")

  const handleAddEvent = useCallback(() => {
    router.push(`/us/calendar/create?date=${dateStr}`)
    onClose()
  }, [router, dateStr, onClose])

  const handleEventTap = useCallback(
    (event: CalendarEvent) => {
      if (event.creator_id === userId) {
        router.push(`/us/calendar/edit/${event.id}`)
      }
      // Partner events: no navigation (read-only in list)
    },
    [router, userId]
  )

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Dismiss if dragged down more than 80px or velocity > 500
      if (info.offset.y > 80 || info.velocity.y > 500) {
        onClose()
      }
    },
    [onClose]
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="day-sheet-backdrop"
            variants={BACKDROP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
            data-testid="day-sheet-backdrop"
          />

          {/* Sheet */}
          <motion.div
            key="day-sheet"
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-2xl bg-[var(--bg-primary,#FAF8F5)] shadow-warm-lg"
            data-testid="day-detail-sheet"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[var(--border-subtle,#E8E4DF)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h2
                className="font-display text-[18px] font-semibold text-[var(--text-primary,#2C2825)]"
                data-testid="day-sheet-title"
              >
                {formattedDate}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddEvent}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-copper,#B87333)]/10 text-[var(--accent-copper,#B87333)]"
                  aria-label="Add event"
                  data-testid="day-sheet-add"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-secondary,#F0ECE6)] text-[var(--text-secondary,#6B6560)]"
                  aria-label="Close"
                  data-testid="day-sheet-close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Event list */}
            <div className="overflow-y-auto px-5 pb-8 max-h-[calc(80vh-80px)]">
              {events.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      title={event.title}
                      date={formatEventTime(event)}
                      badge={categoryToBadge(event.category)}
                      onClick={() => handleEventTap(event)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center gap-2 py-8"
                  data-testid="day-sheet-empty"
                >
                  <CalendarPlus
                    size={32}
                    strokeWidth={1.25}
                    className="text-[var(--accent-copper,#B87333)]/50"
                  />
                  <p className="text-[13px] text-[var(--text-muted,#B5ADA4)]">
                    No events this day
                  </p>
                  <button
                    onClick={handleAddEvent}
                    className="mt-1 rounded-full bg-[var(--accent-copper,#B87333)] px-5 py-2 text-[13px] font-medium text-white"
                    data-testid="day-sheet-add-cta"
                  >
                    Add Event
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
