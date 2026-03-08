import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

const MOCK_REMINDERS = [
  {
    id: "rem-1", event_id: "evt-1", user_id: "user-1",
    remind_before: "1 hour", remind_at: "2026-04-15T18:00:00Z",
    is_sent: false, sent_at: null, created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "rem-2", event_id: "evt-1", user_id: "user-1",
    remind_before: "1 day", remind_at: "2026-04-14T19:00:00Z",
    is_sent: false, sent_at: null, created_at: "2026-03-01T00:00:00Z",
  },
]

// IMPORTANT: stable references to avoid infinite re-renders
const stableUser = { id: "user-1" }
const stableAuthReturn = { user: stableUser }

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: MOCK_REMINDERS, error: null }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "rem-new", event_id: "evt-1", user_id: "user-1", remind_before: "15 minutes", remind_at: null, is_sent: false, sent_at: null, created_at: "2026-03-01T00:00:00Z" },
            error: null,
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => stableAuthReturn,
}))

import { useEventReminders } from "@/lib/hooks/use-event-reminders"
import { REMINDER_PRESETS } from "@/lib/types/calendar.types"
import type { EventReminder } from "@/lib/types/calendar.types"

describe("useEventReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──

  it("REMINDER_PRESETS has 5 options with correct values", () => {
    expect(REMINDER_PRESETS).toHaveLength(5)
    expect(REMINDER_PRESETS.map((p) => p.value)).toEqual(["0 seconds", "15 minutes", "1 hour", "1 day", "7 days"])
  })

  it("REMINDER_PRESETS labels are user-friendly", () => {
    expect(REMINDER_PRESETS.map((p) => p.label)).toEqual(["At time", "15 min", "1 hour", "1 day", "1 week"])
  })

  it("EventReminder has correct shape", () => {
    const rem: EventReminder = MOCK_REMINDERS[0]
    expect(rem).toHaveProperty("id")
    expect(rem).toHaveProperty("event_id")
    expect(rem).toHaveProperty("remind_before")
    expect(typeof rem.is_sent).toBe("boolean")
  })

  it("useEventReminders is a function", () => {
    expect(typeof useEventReminders).toBe("function")
  })

  // ── Hook behavior ──

  it("returns inert state when no eventId", () => {
    const { result } = renderHook(() => useEventReminders(undefined))
    expect(result.current.reminders).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasReminder("1 hour")).toBe(false)
  })

  it("starts loading for valid eventId", () => {
    const { result } = renderHook(() => useEventReminders("evt-1"))
    expect(result.current.isLoading).toBe(true)
  })

  it("fetches and resolves reminders", async () => {
    const { result } = renderHook(() => useEventReminders("evt-1"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.reminders).toHaveLength(2)
    expect(result.current.hasReminder("1 hour")).toBe(true)
    expect(result.current.hasReminder("1 day")).toBe(true)
    expect(result.current.hasReminder("15 minutes")).toBe(false)
  })

  // ── Integration Tests ──

  it("addReminder updates local state", async () => {
    const { result } = renderHook(() => useEventReminders("evt-1"))

    await waitFor(() => {
      expect(result.current.reminders.length).toBe(2)
    })

    await act(async () => {
      await result.current.addReminder("evt-1", "15 minutes")
    })

    expect(result.current.reminders.length).toBe(3)
    expect(result.current.hasReminder("15 minutes")).toBe(true)
  })

  it("removeReminder updates local state", async () => {
    const { result } = renderHook(() => useEventReminders("evt-1"))

    await waitFor(() => {
      expect(result.current.reminders.length).toBe(2)
    })

    await act(async () => {
      await result.current.removeReminder("rem-1")
    })

    expect(result.current.reminders.length).toBe(1)
    expect(result.current.hasReminder("1 hour")).toBe(false)
    expect(result.current.hasReminder("1 day")).toBe(true)
  })
})
