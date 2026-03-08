"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronLeft, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useCalendar } from "@/lib/hooks/use-calendar"
import { useAuth } from "@/lib/providers/AuthProvider"
import { EVENT_CATEGORY_CONFIG, getCategoryColor } from "@/lib/calendar-constants"
import {
  EVENT_CATEGORIES,
  EVENT_RECURRENCES,
  type EventCategory,
  type EventRecurrence,
} from "@/lib/types/calendar.types"
import type { CalendarEvent } from "@/lib/types/calendar.types"
import { useEventReminders } from "@/lib/hooks/use-event-reminders"
import { ReminderPicker } from "@/components/calendar/ReminderPicker"

type CreateEventFormProps = {
  initialEvent?: CalendarEvent
  mode?: "create" | "edit"
  defaultDate?: string // YYYY-MM-DD
}

const RECURRENCE_LABELS: Record<EventRecurrence, string> = {
  none: "One-time",
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Yearly",
}

export function CreateEventForm({
  initialEvent,
  mode = "create",
  defaultDate,
}: CreateEventFormProps) {
  const router = useRouter()
  const { profile } = useAuth()
  const { createEvent, updateEvent, deleteEvent } = useCalendar()

  // Form state
  const [title, setTitle] = useState(initialEvent?.title ?? "")
  const [date, setDate] = useState(
    initialEvent?.event_date ?? defaultDate ?? new Date().toISOString().split("T")[0]
  )
  const [allDay, setAllDay] = useState(!initialEvent?.event_time)
  const [startTime, setStartTime] = useState(
    initialEvent?.event_time?.slice(0, 5) ?? "19:00"
  )
  const [endTime, setEndTime] = useState(
    initialEvent?.end_time?.slice(0, 5) ?? ""
  )
  const [description, setDescription] = useState(initialEvent?.description ?? "")
  const [recurrence, setRecurrence] = useState<EventRecurrence>(
    (initialEvent?.recurrence as EventRecurrence) ?? "none"
  )
  const [category, setCategory] = useState<EventCategory>(
    (initialEvent?.category as EventCategory) ?? "other"
  )
  const [isShared, setIsShared] = useState(initialEvent?.is_shared ?? true)
  const [selectedReminders, setSelectedReminders] = useState<string[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Reminders hook (for edit mode — pre-selects existing reminders)
  const { reminders: existingReminders, addReminder, removeReminder } =
    useEventReminders(mode === "edit" ? initialEvent?.id : undefined)

  // Pre-fill selected reminders from existing data in edit mode
  useEffect(() => {
    if (existingReminders.length > 0 && selectedReminders.length === 0) {
      setSelectedReminders(existingReminders.map((r) => r.remind_before))
    }
  }, [existingReminders]) // eslint-disable-line react-hooks/exhaustive-deps

  const markChanged = useCallback(() => {
    if (!hasChanges) setHasChanges(true)
  }, [hasChanges])

  const handleReminderToggle = useCallback(
    (value: string) => {
      setSelectedReminders((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      )
      markChanged()
    },
    [markChanged]
  )

  const isValid = title.trim().length > 0 && date.length > 0

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)

    const eventData = {
      title: title.trim(),
      event_date: date,
      event_time: allDay ? null : `${startTime}:00`,
      end_time: allDay || !endTime ? null : `${endTime}:00`,
      description: description.trim() || null,
      recurrence,
      category,
      is_shared: isShared,
    }

    try {
      let eventId: string | undefined

      if (mode === "edit" && initialEvent) {
        await updateEvent(initialEvent.id, eventData)
        eventId = initialEvent.id
      } else {
        const created = await createEvent(eventData)
        eventId = created?.id
      }

      // Sync reminders (fire-and-forget)
      if (eventId && selectedReminders.length > 0) {
        const existingValues = existingReminders.map((r) => r.remind_before)
        // Add new reminders
        for (const val of selectedReminders) {
          if (!existingValues.includes(val)) {
            addReminder(eventId, val).catch(() => {})
          }
        }
        // Remove deselected reminders
        for (const existing of existingReminders) {
          if (!selectedReminders.includes(existing.remind_before)) {
            removeReminder(existing.id).catch(() => {})
          }
        }
      }

      router.back()
    } catch {
      // error is set on the hook
    } finally {
      setIsSubmitting(false)
    }
  }, [
    isValid, isSubmitting, title, date, allDay, startTime, endTime,
    description, recurrence, category, isShared, mode, initialEvent,
    createEvent, updateEvent, router, selectedReminders,
    existingReminders, addReminder, removeReminder,
  ])

  const handleDelete = useCallback(async () => {
    if (!initialEvent) return
    setIsSubmitting(true)
    try {
      await deleteEvent(initialEvent.id)
      router.back()
    } catch {
      // error handled by hook
    } finally {
      setIsSubmitting(false)
    }
  }, [initialEvent, deleteEvent, router])

  const handleBack = useCallback(() => {
    if (hasChanges && mode === "create") {
      if (window.confirm("You have unsaved changes. Discard?")) {
        router.back()
      }
    } else {
      router.back()
    }
  }, [hasChanges, mode, router])

  const isOwner = !initialEvent || initialEvent.creator_id === profile?.id
  const readOnly = mode === "edit" && !isOwner

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary,#FBF8F4)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--bg-secondary)]"
          aria-label="Go back"
          data-testid="back-button"
        >
          <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
        <h1
          className="font-display text-[18px] font-semibold text-[var(--text-primary)]"
          data-testid="form-title"
        >
          {mode === "edit" ? (readOnly ? "Event Details" : "Edit Event") : "New Event"}
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pb-28">
        <div className="flex flex-col gap-5">
          {/* Title */}
          <div>
            <label
              className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block"
              htmlFor="event-title"
            >
              Title
            </label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markChanged() }}
              placeholder="What's happening?"
              maxLength={100}
              readOnly={readOnly}
              className="h-11 rounded-[10px] text-[15px] border-[var(--border-subtle)]"
              data-testid="title-input"
            />
          </div>

          {/* Date */}
          <div>
            <label
              className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block"
              htmlFor="event-date"
            >
              Date
            </label>
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); markChanged() }}
              readOnly={readOnly}
              className="h-11 rounded-[10px] text-[15px] border-[var(--border-subtle)]"
              data-testid="date-input"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[var(--text-primary)]">
              All Day
            </span>
            <Switch
              checked={allDay}
              onCheckedChange={(v) => { setAllDay(v); markChanged() }}
              disabled={readOnly}
              data-testid="allday-toggle"
            />
          </div>

          {/* Start/End Time (conditional) */}
          {!allDay && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-3"
              data-testid="time-pickers"
            >
              <div className="flex-1">
                <label
                  className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block"
                  htmlFor="start-time"
                >
                  Start
                </label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => { setStartTime(e.target.value); markChanged() }}
                  readOnly={readOnly}
                  className="h-11 rounded-[10px] text-[15px] border-[var(--border-subtle)]"
                  data-testid="start-time-input"
                />
              </div>
              <div className="flex-1">
                <label
                  className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block"
                  htmlFor="end-time"
                >
                  End (optional)
                </label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value); markChanged() }}
                  readOnly={readOnly}
                  className="h-11 rounded-[10px] text-[15px] border-[var(--border-subtle)]"
                  data-testid="end-time-input"
                />
              </div>
            </motion.div>
          )}

          {/* Description */}
          <div>
            <label
              className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block"
              htmlFor="event-description"
            >
              Description
            </label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setDescription(e.target.value)
                  markChanged()
                }
              }}
              placeholder="Add details..."
              readOnly={readOnly}
              rows={3}
              className={cn(
                "w-full rounded-[10px] border border-[var(--border-subtle)] bg-transparent px-3 py-2.5 text-[15px] placeholder:text-[var(--text-muted)] outline-none resize-none",
                "focus:border-[var(--accent-copper)] focus:ring-1 focus:ring-[var(--accent-copper)]/30"
              )}
              data-testid="description-input"
            />
            <p className="text-[11px] text-[var(--text-muted)] text-end mt-1">
              {description.length}/500
            </p>
          </div>

          {/* Recurrence */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
              Repeat
            </label>
            <div className="flex gap-2" data-testid="recurrence-pills">
              {EVENT_RECURRENCES.map((r) => (
                <button
                  key={r}
                  onClick={() => { if (!readOnly) { setRecurrence(r); markChanged() } }}
                  disabled={readOnly}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                    recurrence === r
                      ? "bg-[var(--accent-copper,#B87333)] text-white"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
                  )}
                  data-testid={`recurrence-${r}`}
                >
                  {RECURRENCE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2" data-testid="category-cards">
              {EVENT_CATEGORIES.map((cat) => {
                const config = EVENT_CATEGORY_CONFIG[cat]
                const Icon = config.icon
                const color = getCategoryColor(cat)
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => { if (!readOnly) { setCategory(cat); markChanged() } }}
                    disabled={readOnly}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors",
                      isActive
                        ? "border-current shadow-sm"
                        : "border-[var(--border-subtle)] hover:border-current/30"
                    )}
                    style={{
                      color: isActive ? color : undefined,
                      backgroundColor: isActive ? `${color}1A` : undefined,
                    }}
                    data-testid={`category-${cat}`}
                  >
                    <Icon size={16} />
                    <span className={cn(
                      "text-[13px] font-medium",
                      !isActive && "text-[var(--text-primary)]"
                    )}>
                      {config.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reminders */}
          {!readOnly && (
            <ReminderPicker
              selected={selectedReminders}
              onToggle={handleReminderToggle}
              allDay={allDay}
              disabled={readOnly}
            />
          )}

          {/* Share with Partner */}
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[var(--text-primary)]">
              Share with Partner
            </span>
            <Switch
              checked={isShared}
              onCheckedChange={(v) => { setIsShared(v); markChanged() }}
              disabled={readOnly}
              data-testid="share-toggle"
            />
          </div>

          {/* Delete section (edit mode only) */}
          {mode === "edit" && isOwner && (
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              {showDeleteConfirm ? (
                <div className="flex flex-col gap-3" data-testid="delete-confirm">
                  <p className="text-[14px] text-[var(--text-secondary)] text-center">
                    Delete this event? This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                      data-testid="delete-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      data-testid="delete-confirm-btn"
                    >
                      {isSubmitting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-[14px] text-red-500 font-medium"
                  data-testid="delete-button"
                >
                  <Trash2 size={16} />
                  Delete Event
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky submit button */}
      {!readOnly && (
        <div className="fixed bottom-0 inset-x-0 px-5 py-4 bg-[var(--bg-primary,#FBF8F4)] border-t border-[var(--border-subtle)]">
          <Button
            variant="copper"
            size="pill"
            className="w-full"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            data-testid="submit-button"
          >
            {isSubmitting
              ? (mode === "edit" ? "Saving..." : "Creating...")
              : (mode === "edit" ? "Save Changes" : "Create Event")}
          </Button>
        </div>
      )}
    </div>
  )
}
