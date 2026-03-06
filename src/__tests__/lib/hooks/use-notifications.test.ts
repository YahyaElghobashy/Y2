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

const MOCK_NOTIFICATIONS = [
  {
    id: "notif-1",
    sender_id: "user-1",
    recipient_id: "user-2",
    title: "Hello",
    body: "Miss you",
    emoji: null,
    status: "delivered",
    type: "custom",
    metadata: {},
    created_at: "2026-01-02T00:00:00Z",
  },
]

const MOCK_DAILY_LIMIT = {
  id: "limit-1",
  user_id: "user-1",
  date: new Date().toISOString().split("T")[0],
  free_sends_used: 1,
  bonus_sends_used: 0,
  bonus_sends_available: 1,
}

// --- Supabase mock ---
const mockInsertChain = {
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: {
      id: "notif-new",
      sender_id: "user-1",
      recipient_id: "user-2",
      title: "Test",
      body: "Body",
      emoji: null,
      status: "sent",
      type: "custom",
      metadata: {},
      created_at: new Date().toISOString(),
    },
    error: null,
  }),
}
const mockInsert = vi.fn().mockReturnValue(mockInsertChain)
const mockFunctionsInvoke = vi.fn().mockResolvedValue({ data: null, error: null })

let notifQueryResult: { data: unknown; error: unknown } = {
  data: MOCK_NOTIFICATIONS,
  error: null,
}
let limitQueryResult: { data: unknown; error: { code: string; message: string } | null } = {
  data: MOCK_DAILY_LIMIT,
  error: null,
}

const mockFrom = vi.fn((table: string) => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.or = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockResolvedValue(
    table === "notifications" ? notifQueryResult : limitQueryResult
  )
  chain.single = vi.fn().mockResolvedValue(
    table === "daily_send_limits" ? limitQueryResult : notifQueryResult
  )
  chain.insert = mockInsert

  return chain
})

const mockSubscribe = vi.fn()
const mockOn = vi.fn().mockReturnThis()
const mockChannel = { on: mockOn, subscribe: mockSubscribe }
const mockChannelFn = vi.fn().mockReturnValue(mockChannel)
const mockRemoveChannel = vi.fn()

const mockSupabase = {
  from: mockFrom,
  functions: { invoke: mockFunctionsInvoke },
  channel: mockChannelFn,
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

import { useNotifications } from "@/lib/hooks/use-notifications"

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notifQueryResult = { data: MOCK_NOTIFICATIONS, error: null }
    limitQueryResult = { data: MOCK_DAILY_LIMIT, error: null }
    mockInsertChain.single.mockResolvedValue({
      data: {
        id: "notif-new",
        sender_id: "user-1",
        recipient_id: "user-2",
        title: "Test",
        body: "Body",
        emoji: null,
        status: "sent",
        type: "custom",
        metadata: {},
        created_at: new Date().toISOString(),
      },
      error: null,
    })
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

  it("isLoading is true on mount, false after data loads", async () => {
    const { result } = renderHook(() => useNotifications())
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it("notifications are populated from the mocked Supabase response", async () => {
    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.notifications).toEqual(MOCK_NOTIFICATIONS)
  })

  it("canSend is true when remainingSends > 0", async () => {
    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // free_sends_used = 1, so 1 free remaining + 1 bonus available - 0 used = 2
    expect(result.current.canSend).toBe(true)
    expect(result.current.remainingSends).toBe(2)
  })

  it("canSend is false when both free and bonus sends are exhausted", async () => {
    limitQueryResult = {
      data: {
        ...MOCK_DAILY_LIMIT,
        free_sends_used: 2,
        bonus_sends_used: 1,
        bonus_sends_available: 1,
      },
      error: null,
    }

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canSend).toBe(false)
    expect(result.current.remainingSends).toBe(0)
  })

  it("remainingSends equals (FREE_SENDS_PER_DAY - free_used) + (bonus_available - bonus_used)", async () => {
    limitQueryResult = {
      data: {
        ...MOCK_DAILY_LIMIT,
        free_sends_used: 1,
        bonus_sends_used: 0,
        bonus_sends_available: 3,
      },
      error: null,
    }

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // (2 - 1) + (3 - 0) = 4
    expect(result.current.remainingSends).toBe(4)
  })

  it("sendNotification calls supabase insert then functions.invoke", async () => {
    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.sendNotification("Test", "Body")
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        sender_id: "user-1",
        recipient_id: "user-2",
        title: "Test",
        body: "Body",
      })
    )
    expect(mockFunctionsInvoke).toHaveBeenCalledWith("send-notification", {
      body: { notification_id: "notif-new", recipient_id: "user-2" },
    })
  })

  it("sendNotification sets error and returns early when canSend is false", async () => {
    limitQueryResult = {
      data: {
        ...MOCK_DAILY_LIMIT,
        free_sends_used: 2,
        bonus_sends_used: 1,
        bonus_sends_available: 1,
      },
      error: null,
    }

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.sendNotification("Test", "Body")
    })

    expect(result.current.error).toBe("Daily send limit reached")
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("sendNotification removes optimistic row when insert fails", async () => {
    mockInsertChain.single.mockResolvedValue({
      data: null,
      error: { message: "Insert failed", code: "23505" },
    })

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const countBefore = result.current.notifications.length

    await act(async () => {
      await result.current.sendNotification("Test", "Body")
    })

    expect(result.current.error).toBe("Failed to send notification")
    expect(result.current.notifications.length).toBe(countBefore)
  })

  it("sendNotification sets error when partner is null", async () => {
    mockAuthReturn.partner = null

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.sendNotification("Test", "Body")
    })

    expect(result.current.error).toBe("Partner not connected")
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it("refreshLimits re-fetches only the daily_send_limits row", async () => {
    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFrom.mockClear()

    await act(async () => {
      await result.current.refreshLimits()
    })

    const calledTables = mockFrom.mock.calls.map((call) => call[0])
    expect(calledTables).toContain("daily_send_limits")
    expect(calledTables).not.toContain("notifications")
  })

  it("subscribes to realtime notifications channel on mount", async () => {
    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockChannelFn).toHaveBeenCalledWith(`notifications_${MOCK_USER.id}`)
    expect(mockOn).toHaveBeenCalled()
    expect(mockSubscribe).toHaveBeenCalled()
  })

  it("cleans up realtime channel on unmount", async () => {
    const { result, unmount } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
  })

  it("does not subscribe to realtime when user is null", async () => {
    mockAuthReturn.user = null

    mockChannelFn.mockClear()

    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockChannelFn).not.toHaveBeenCalled()
  })
})
