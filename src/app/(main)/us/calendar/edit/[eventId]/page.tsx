"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCalendar } from "@/lib/hooks/use-calendar"
import { CreateEventForm } from "@/components/calendar/CreateEventForm"
import type { CalendarEvent } from "@/lib/types/calendar.types"

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = use(params)
  const router = useRouter()
  const { events, isLoading } = useCalendar()
  const [event, setEvent] = useState<CalendarEvent | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (isLoading) return

    const found = events.find((e) => e.id === eventId)
    if (found) {
      setEvent(found)
    } else {
      setNotFound(true)
    }
  }, [events, eventId, isLoading])

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-[var(--bg-primary,#FBF8F4)]"
        data-testid="edit-loading"
      >
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent-copper,#B87333)] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary,#FBF8F4)] gap-3 px-5"
        data-testid="edit-not-found"
      >
        <p className="text-[15px] font-body text-[var(--text-secondary,#6B6560)]">
          Event not found
        </p>
        <button
          onClick={() => router.back()}
          className="text-[14px] font-medium text-[var(--accent-copper,#B87333)]"
          data-testid="not-found-back"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (!event) return null

  return <CreateEventForm initialEvent={event} mode="edit" />
}
