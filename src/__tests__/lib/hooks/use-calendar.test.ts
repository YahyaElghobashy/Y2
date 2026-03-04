import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mock data ---
const MOCK_USER = { id: "user-1" }
const MOCK_PARTNER = {
  id: "user-2",
  display_name: "Yara",
  email: "yara@test.com",
  avatar_url: null,
  partner_id: "user-1",
  role: "user",
  created_at: "",
  updated_at: "",
}

const TODAY = new Date().toISOString().split("T")[0]
const TOMORROW = new Date(Date.now() + 86400000).toISOString().split("T")[0]
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split("T")[0]
const NEXT_WEEK = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]

const MOCK_EVENTS = [
  {
    id: "evt-1",
    creator_id: "user-1",
    title: "Date Night",
    description: null,
    event_date: TOMORROW,
    event_time: "19:00:00",
    end_time: null,
    recurrence: "none",
    category: "date_night",
    color: null,
    google_calendar_event_id: null,
    is_shared: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "evt-2",
    creator_id: "user-1",
    title: "Anniversary",
    description: "Our day",
    event_date: NEXT_WEEK,
    event_time: null,
    end_time: null,
    recurrence: "annual",
    category: "milestone",
    color: null,
    google_calendar_event_id: null,
    is_shared: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "evt-3",
    creator_id: "user-1",
    title: "Past Event",
    description: null,
    event_date: YESTERDAY,
    event_time: "10:00:00",
    end_time: null,
    recurrence: "none",
    category: "reminder",
    color: null,
    google_calendar_event_id: null,
    is_shared: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

// --- Mocks ---
const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()

let realtimeCallback: (() => void) | null = null

const mockChannel = {
  on: vi.fn(function (this: typeof mockChannel, _event: string, _opts: Record<string, unknown>, cb: () => void) {
    realtimeCallback = cb
    return this
  }),
  subscribe: mockSubscribe,
}

const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

function createChain(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockResolvedValue(resolvedValue)
  chain.single = vi.fn().mockResolvedValue(resolvedValue)
  chain.insert = vi.fn((...args: unknown[]) => {
    mockInsert(...args)
    return chain
  })
  chain.update = vi.fn((...args: unknown[]) => {
    mockUpdate(...args)
    return { eq: vi.fn().mockResolvedValue({ error: null }) }
  })
  chain.delete = vi.fn((...args: unknown[]) => {
    mockDelete(...args)
    return { eq: vi.fn().mockResolvedValue({ error: null }) }
  })
  return chain
}

let defaultChain: ReturnType<typeof createChain>

const mockFrom = vi.fn(() => defaultChain)

const mockSupabase = {
  from: mockFrom,
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: mockRemoveChannel,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

let mockAuthReturn = {
  user: MOCK_USER as { id: string } | null,
  partner: MOCK_PARTNER as typeof MOCK_PARTNER | null,
  profile: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuthReturn,
}))

// Import after mocks
import { useCalendar } from "@/lib/hooks/use-calendar"

describe("useCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    realtimeCallback = null
    defaultChain = createChain({ data: MOCK_EVENTS, error: null })
    mockFrom.mockReturnValue(defaultChain)
    mockAuthReturn = {
      user: MOCK_USER as { id: string } | null,
      partner: MOCK_PARTNER as typeof MOCK_PARTNER | null,
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    }
  })

  // ── Unit Tests ──

  it("returns inert state when user is null", () => {
    mockAuthReturn = { ...mockAuthReturn, user: null }
    const { result } = renderHook(() => useCalendar())
    expect(result.current.events).toEqual([])
    expect(result.current.upcomingEvents).toEqual([])
    expect(result.current.milestones).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("no-op functions when user is null", async () => {
    mockAuthReturn = { ...mockAuthReturn, user: null }
    const { result } = renderHook(() => useCalendar())
    const created = await result.current.createEvent({ title: "Test", event_date: TODAY })
    expect(created).toBeNull()
    await result.current.updateEvent("id", { title: "X" })
    await result.current.deleteEvent("id")
    await result.current.refreshEvents()
    expect(result.current.getEventsForMonth(2026, 3)).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it("returns isLoading: true on initial render", () => {
    const { result } = renderHook(() => useCalendar())
    expect(result.current.isLoading).toBe(true)
  })

  it("fetches events and populates state", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.events).toEqual(MOCK_EVENTS)
    expect(mockFrom).toHaveBeenCalledWith("events")
  })

  it("upcomingEvents excludes past events", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const upcoming = result.current.upcomingEvents
    expect(upcoming.every((e) => e.event_date >= TODAY)).toBe(true)
    expect(upcoming.find((e) => e.id === "evt-3")).toBeUndefined() // yesterday's event excluded
  })

  it("upcomingEvents sorted by date then time", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const upcoming = result.current.upcomingEvents
    for (let i = 1; i < upcoming.length; i++) {
      const prev = upcoming[i - 1]
      const curr = upcoming[i]
      const dateCompare = prev.event_date.localeCompare(curr.event_date)
      if (dateCompare === 0) {
        expect((prev.event_time ?? "").localeCompare(curr.event_time ?? "")).toBeLessThanOrEqual(0)
      } else {
        expect(dateCompare).toBeLessThan(0)
      }
    }
  })

  it("milestones only includes milestone category", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.milestones.length).toBe(1)
    expect(result.current.milestones[0].category).toBe("milestone")
    expect(result.current.milestones[0].title).toBe("Anniversary")
  })

  it("getEventsForMonth filters by year and month", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // All mock events are in the current month range
    const now = new Date()
    const monthEvents = result.current.getEventsForMonth(now.getFullYear(), now.getMonth() + 1)
    expect(monthEvents.length).toBeGreaterThan(0)

    // No events in a month far in the future
    const farFuture = result.current.getEventsForMonth(2099, 12)
    expect(farFuture).toEqual([])
  })

  it("sets error on fetch failure", async () => {
    defaultChain = createChain({ data: null, error: { message: "DB error" } })
    mockFrom.mockReturnValue(defaultChain)

    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("DB error")
  })

  // ── Integration Tests ──

  it("calls supabase.from('events').select('*').order() on mount", async () => {
    renderHook(() => useCalendar())

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("events")
    })

    expect(defaultChain.select).toHaveBeenCalledWith("*")
    expect(defaultChain.order).toHaveBeenCalledWith("event_date", { ascending: true })
  })

  it("createEvent inserts with creator_id and refreshes", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const callCountBefore = mockFrom.mock.calls.length

    await act(async () => {
      await result.current.createEvent({
        title: "New Event",
        event_date: TOMORROW,
      })
    })

    // Should have called from("events") again for insert + refresh
    const callCountAfter = mockFrom.mock.calls.length
    expect(callCountAfter).toBeGreaterThan(callCountBefore)
    expect(mockFrom).toHaveBeenCalledWith("events")
  })

  it("sets up realtime subscription with correct channel", async () => {
    renderHook(() => useCalendar())

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith("events_user-1")
    })

    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it("cleans up realtime subscription on unmount", async () => {
    const { unmount } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled()
    })

    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  it("re-fetches events on realtime change", async () => {
    const { result } = renderHook(() => useCalendar())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const fetchCallsBefore = (mockFrom.mock.calls as string[][]).filter((c) => c[0] === "events").length

    // Trigger realtime callback
    act(() => {
      realtimeCallback?.()
    })

    await waitFor(() => {
      const fetchCallsAfter = (mockFrom.mock.calls as string[][]).filter((c) => c[0] === "events").length
      expect(fetchCallsAfter).toBeGreaterThan(fetchCallsBefore)
    })
  })
})
