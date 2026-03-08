import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { EventReminder } from "@/lib/types/calendar.types"

export type UseEventRemindersReturn = {
  reminders: EventReminder[]
  isLoading: boolean
  addReminder: (eventId: string, remindBefore: string) => Promise<void>
  removeReminder: (reminderId: string) => Promise<void>
  hasReminder: (remindBefore: string) => boolean
}

// Helper: event_reminders table not yet in generated database.types.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function remindersTable() {
  return getSupabaseBrowserClient().from("event_reminders" as any) as any
}

export function useEventReminders(eventId: string | undefined): UseEventRemindersReturn {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<EventReminder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch reminders for this event + user
  useEffect(() => {
    if (!user || !eventId) {
      setReminders([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      const { data } = await remindersTable()
        .select("*")
        .eq("event_id", eventId!)
        .eq("user_id", user!.id)

      if (mounted) {
        setReminders((data as EventReminder[]) ?? [])
        setIsLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [user, eventId])

  const addReminder = useCallback(
    async (evtId: string, remindBefore: string) => {
      if (!user) return

      const { data } = await remindersTable()
        .insert({
          event_id: evtId,
          user_id: user.id,
          remind_before: remindBefore,
        })
        .select()
        .single()

      if (data) {
        setReminders((prev) => [...prev, data as EventReminder])
      }
    },
    [user]
  )

  const removeReminder = useCallback(
    async (reminderId: string) => {
      if (!user) return

      await remindersTable()
        .delete()
        .eq("id", reminderId)

      setReminders((prev) => prev.filter((r) => r.id !== reminderId))
    },
    [user]
  )

  const hasReminder = useCallback(
    (remindBefore: string) =>
      reminders.some((r) => r.remind_before === remindBefore),
    [reminders]
  )

  if (!user || !eventId) {
    return {
      reminders: [],
      isLoading: false,
      addReminder: async () => {},
      removeReminder: async () => {},
      hasReminder: () => false,
    }
  }

  return {
    reminders,
    isLoading,
    addReminder,
    removeReminder,
    hasReminder,
  }
}
