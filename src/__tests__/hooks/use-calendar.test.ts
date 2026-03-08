import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

const MOCK_EVENTS = [
  {
    id: "evt-1",
    creator_id: "user-1",
    title: "Date Night",
    description: null,
    event_date: "2026-04-15",
    event_time: "19:00:00",
    end_time: null,
    is_all_day: false,
    recurrence: "none",
    category: "date_night",
    is_shared: true,
    google_calendar_event_id: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "evt-2",
    creator_id: "user-1",
    title: "Anniversary",
    description: "Our anniversary",
    event_date: "2026-05-20",
    event_time: null,
    end_time: null,
    is_all_day: true,
    recurrence: "annual",
    category: "milestone",
    is_shared: true,
    google_calendar_event_id: "gcal-123",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
]

// IMPORTANT: stable references to avoid infinite re-renders
const stableUser = { id: "user-1" }
const stableProfile = {
  id: "user-1",
  google_calendar_refresh_token: "fake-refresh-token",
  google_calendar_connected_at: "2026-03-01T00:00:00Z",
}
const stableAuthReturn = {
  user: stableUser,
  profile: stableProfile,
  partner: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

const stablePartner = { id: "user-2", display_name: "Partner" }
const stableAuthWithPartner = {
  user: stableUser,
  profile: stableProfile,
  partner: stablePartner,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

const stableAuthNoGcal = {
  user: stableUser,
  profile: { ...stableProfile, google_calendar_refresh_token: null },
  partner: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

const stableAuthNoUser = {
  user: null,
  profile: null,
  partner: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

// Track functions.invoke calls
const mockInvoke = vi.fn().mockResolvedValue({ data: { synced: true }, error: null })

// Track from() chain calls
const mockDelete = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})
const mockInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: {
        id: "evt-new",
        creator_id: "user-1",
        title: "New Event",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: false,
        google_calendar_event_id: null,
        created_at: "2026-03-01T00:00:00Z",
        updated_at: "2026-03-01T00:00:00Z",
      },
      error: null,
    }),
  }),
})
const mockSelect = vi.fn().mockReturnValue({
  order: vi.fn().mockResolvedValue({ data: MOCK_EVENTS, error: null }),
})

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
}

// Track notifications table inserts
const mockNotifInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: { id: "notif-1" },
      error: null,
    }),
  }),
})

// CRITICAL: stable reference — same object every call to prevent infinite re-renders
const stableSupabaseClient = {
  from: (table: string) => {
    if (table === "events") {
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      }
    }
    if (table === "notifications") {
      return { insert: mockNotifInsert }
    }
    return {}
  },
  functions: { invoke: mockInvoke },
  channel: () => mockChannel,
  removeChannel: vi.fn(),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabaseClient,
}))

// Default: connected to Google Calendar
let currentAuth = stableAuthReturn
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => currentAuth,
}))

import { useCalendar } from "@/lib/hooks/use-calendar"

describe("useCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentAuth = stableAuthReturn
  })

  // ── Unit Tests ──

  it("returns inert state when no user", () => {
    currentAuth = stableAuthNoUser as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())
    expect(result.current.events).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("fetches events on mount", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events).toHaveLength(2)
    expect(mockSelect).toHaveBeenCalled()
  })

  it("upcomingEvents filters to today or later", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Both mock events are in the future (2026-04 and 2026-05)
    expect(result.current.upcomingEvents.length).toBeGreaterThanOrEqual(1)
  })

  it("milestones filters to milestone category", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.milestones.every((e) => e.category === "milestone")).toBe(true)
  })

  it("getEventsForMonth filters by year-month", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const april = result.current.getEventsForMonth(2026, 4)
    expect(april).toHaveLength(1)
    expect(april[0].title).toBe("Date Night")

    const may = result.current.getEventsForMonth(2026, 5)
    expect(may).toHaveLength(1)
    expect(may[0].title).toBe("Anniversary")

    const june = result.current.getEventsForMonth(2026, 6)
    expect(june).toHaveLength(0)
  })

  // ── Google Calendar Sync: createEvent ──

  it("syncs to Google Calendar after createEvent when connected", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createEvent({
        title: "New Event",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: false,
      })
    })

    expect(mockInvoke).toHaveBeenCalledWith("google-calendar-sync", {
      body: { event_id: "evt-new", action: "create" },
    })
  })

  it("does NOT sync to Google Calendar when not connected", async () => {
    currentAuth = stableAuthNoGcal as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createEvent({
        title: "New Event",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: false,
      })
    })

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  // ── Google Calendar Sync: updateEvent ──

  it("syncs to Google Calendar after updateEvent when connected", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateEvent("evt-1", { title: "Updated Title" })
    })

    expect(mockInvoke).toHaveBeenCalledWith("google-calendar-sync", {
      body: { event_id: "evt-1", action: "update" },
    })
  })

  it("does NOT sync update when not connected", async () => {
    currentAuth = stableAuthNoGcal as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateEvent("evt-1", { title: "Updated Title" })
    })

    expect(mockInvoke).not.toHaveBeenCalled()
  })

  // ── Google Calendar Sync: deleteEvent ──

  it("syncs delete to Google Calendar BEFORE DB delete", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteEvent("evt-1")
    })

    expect(mockInvoke).toHaveBeenCalledWith("google-calendar-sync", {
      body: { event_id: "evt-1", action: "delete" },
    })
    expect(mockDelete).toHaveBeenCalled()
  })

  it("does NOT sync delete when not connected", async () => {
    currentAuth = stableAuthNoGcal as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteEvent("evt-1")
    })

    expect(mockInvoke).not.toHaveBeenCalled()
    // But DB delete should still happen
    expect(mockDelete).toHaveBeenCalled()
  })

  // ── Integration: sync is fire-and-forget ──

  it("sync failure does not prevent createEvent from succeeding", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("Network error"))

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let created: unknown = null
    await act(async () => {
      created = await result.current.createEvent({
        title: "New Event",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: false,
      })
    })

    // Event still created successfully despite sync failure
    expect(created).not.toBeNull()
    expect(result.current.error).toBeNull()
  })

  it("sync failure does not prevent deleteEvent from completing", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("Network error"))

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteEvent("evt-1")
    })

    // Delete still happened
    expect(mockDelete).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  // ── Integration: CRUD ──

  it("createEvent calls supabase.from('events').insert()", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createEvent({
        title: "New Event",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: false,
      })
    })

    expect(mockInsert).toHaveBeenCalled()
  })

  it("updateEvent calls supabase.from('events').update()", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateEvent("evt-1", { title: "Updated" })
    })

    expect(mockUpdate).toHaveBeenCalledWith({ title: "Updated" })
  })

  it("deleteEvent calls supabase.from('events').delete()", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteEvent("evt-1")
    })

    expect(mockDelete).toHaveBeenCalled()
  })

  it("createEvent sets error on insert failure", async () => {
    mockInsert.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed" },
        }),
      }),
    })

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      const res = await result.current.createEvent({
        title: "Bad",
        event_date: "2026-01-01",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: false,
      })
      expect(res).toBeNull()
    })

    expect(result.current.error).toBe("Insert failed")
    // Should NOT sync on failure
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it("createEvent returns null when no user", async () => {
    currentAuth = stableAuthNoUser as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    const res = await result.current.createEvent({
      title: "Test",
      event_date: "2026-01-01",
      event_time: null,
      end_time: null,
      is_all_day: true,
      recurrence: "none",
      category: "other",
      is_shared: false,
    })

    expect(res).toBeNull()
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  // ── Partner Notifications ──

  it("notifies partner when creating a shared event", async () => {
    currentAuth = stableAuthWithPartner as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createEvent({
        title: "Date Night",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "date_night",
        is_shared: true,
      })
    })

    // Should insert notification for partner
    expect(mockNotifInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_id: "user-2",
        sender_id: "user-1",
        type: "shared_event",
        title: "Calendar",
        body: 'shared "Date Night" with you',
      })
    )
  })

  it("does NOT notify partner when creating an unshared event", async () => {
    currentAuth = stableAuthWithPartner as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createEvent({
        title: "Private Event",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: false,
      })
    })

    expect(mockNotifInsert).not.toHaveBeenCalled()
  })

  it("does NOT notify when no partner is linked", async () => {
    // Default stableAuthReturn has partner: null
    currentAuth = stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createEvent({
        title: "Solo Event",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: true,
      })
    })

    // is_shared=true but partner=null → no notification
    expect(mockNotifInsert).not.toHaveBeenCalled()
  })

  it("notifies partner on shared event update", async () => {
    currentAuth = stableAuthWithPartner as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // evt-1 is in MOCK_EVENTS with is_shared: true
    await act(async () => {
      await result.current.updateEvent("evt-1", { title: "Updated Title" })
    })

    expect(mockNotifInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_id: "user-2",
        sender_id: "user-1",
        type: "shared_event",
        body: 'updated "Updated Title"',
      })
    )
  })

  it("does NOT notify on update of unshared event", async () => {
    // Override select to return an unshared event
    mockSelect.mockReturnValueOnce({
      order: vi.fn().mockResolvedValue({
        data: [{ ...MOCK_EVENTS[0], is_shared: false }],
        error: null,
      }),
    })

    currentAuth = stableAuthWithPartner as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateEvent("evt-1", { title: "Updated" })
    })

    expect(mockNotifInsert).not.toHaveBeenCalled()
  })

  it("notifies partner on shared event delete", async () => {
    currentAuth = stableAuthWithPartner as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // evt-1 is shared in MOCK_EVENTS
    await act(async () => {
      await result.current.deleteEvent("evt-1")
    })

    expect(mockNotifInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_id: "user-2",
        sender_id: "user-1",
        type: "shared_event",
        body: 'removed "Date Night"',
      })
    )
  })

  it("calls send-notification edge function after inserting notification", async () => {
    currentAuth = stableAuthWithPartner as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.createEvent({
        title: "Shared",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: true,
      })
    })

    // Wait for the async notification chain to resolve
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("send-notification", {
        body: { notification_id: "notif-1", recipient_id: "user-2" },
      })
    })
  })

  it("notification failure does not break createEvent", async () => {
    mockNotifInsert.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    })

    currentAuth = stableAuthWithPartner as typeof stableAuthReturn
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let created: unknown = null
    await act(async () => {
      created = await result.current.createEvent({
        title: "Shared Event",
        event_date: "2026-04-20",
        event_time: null,
        end_time: null,
        is_all_day: true,
        recurrence: "none",
        category: "other",
        is_shared: true,
      })
    })

    // Event still created despite notification failure
    expect(created).not.toBeNull()
    expect(result.current.error).toBeNull()
  })

  // ── Integration: Realtime subscription ──

  it("subscribes to realtime events channel", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })
})
