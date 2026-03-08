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

// Event reminder type (manual — not yet in generated database.types.ts)
export type EventReminder = {
  id: string
  event_id: string
  user_id: string
  remind_before: string   // interval string, e.g. "15 minutes", "1 hour", "1 day"
  remind_at: string | null
  is_sent: boolean
  sent_at: string | null
  created_at: string
}

export type EventReminderInsert = {
  event_id: string
  user_id: string
  remind_before: string
}

// Reminder preset options
export const REMINDER_PRESETS = [
  { label: "At time", value: "0 seconds" },
  { label: "15 min", value: "15 minutes" },
  { label: "1 hour", value: "1 hour" },
  { label: "1 day", value: "1 day" },
  { label: "1 week", value: "7 days" },
] as const

export type ReminderPreset = (typeof REMINDER_PRESETS)[number]

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
