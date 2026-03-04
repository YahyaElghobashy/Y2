import type { Database } from "./database.types"

// Row types (what you read from Supabase)
export type CalendarEvent = Database["public"]["Tables"]["events"]["Row"]

// Insert types (what you write to Supabase)
export type CalendarEventInsert = Database["public"]["Tables"]["events"]["Insert"]

// Update types
export type CalendarEventUpdate = Database["public"]["Tables"]["events"]["Update"]

// Domain constants
export const EVENT_CATEGORIES = ["date_night", "milestone", "reminder", "other"] as const
export type EventCategory = (typeof EVENT_CATEGORIES)[number]

export const EVENT_RECURRENCES = ["none", "weekly", "monthly", "annual"] as const
export type EventRecurrence = (typeof EVENT_RECURRENCES)[number]

// Hook return type
export type UseCalendarReturn = {
  events: CalendarEvent[]
  upcomingEvents: CalendarEvent[]
  milestones: CalendarEvent[]
  isLoading: boolean
  error: string | null
  createEvent: (data: Omit<CalendarEventInsert, "creator_id">) => Promise<CalendarEvent | null>
  updateEvent: (id: string, data: CalendarEventUpdate) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  refreshEvents: () => Promise<void>
  getEventsForMonth: (year: number, month: number) => CalendarEvent[]
}
