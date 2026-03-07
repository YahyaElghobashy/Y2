import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

// --- Supabase mock ---
const mockDevices = [
  {
    id: "dev-1",
    user_id: "user-1",
    subscription: { endpoint: "https://fcm.googleapis.com/fcm/send/abc" },
    device_name: "My Phone",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "dev-2",
    user_id: "user-1",
    subscription: { endpoint: "https://updates.push.services.mozilla.com/xyz" },
    device_name: null,
    created_at: "2025-02-01T00:00:00Z",
    updated_at: "2025-02-01T00:00:00Z",
  },
]

function buildQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    delete: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockResolvedValue(resolvedValue)
  chain.delete.mockReturnValue(chain)
  return chain
}

let mockFromResult = buildQueryMock({ data: mockDevices, error: null })

const mockSupabase = {
  from: vi.fn(() => mockFromResult),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

// --- Auth mock ---
const mockUser = { id: "user-1", email: "test@test.com" }

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    profile: null,
    partner: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

// --- Push service mock ---
const mockSubscribeToPush = vi.fn()
const mockUnsubscribeFromPush = vi.fn()

vi.mock("@/lib/services/push-service", () => ({
  isPushSupported: () => true,
  getPushPermission: () => "default" as const,
  subscribeToPush: (...args: unknown[]) => mockSubscribeToPush(...args),
  unsubscribeFromPush: (...args: unknown[]) => mockUnsubscribeFromPush(...args),
}))

// --- Browser API helpers ---
function setupPushMocks(overrides?: {
  permission?: string
  subscription?: PushSubscription | null
}) {
  Object.defineProperty(window, "PushManager", { value: {}, configurable: true })
  const mockPushManager = {
    getSubscription: vi.fn().mockResolvedValue(overrides?.subscription ?? null),
  }
  Object.defineProperty(navigator, "serviceWorker", {
    value: {
      ready: Promise.resolve({ pushManager: mockPushManager }),
    },
    configurable: true,
  })
  Object.defineProperty(window, "Notification", {
    value: {
      permission: overrides?.permission ?? "default",
    },
    configurable: true,
  })
}

function cleanupPushMocks() {
  delete (window as unknown as Record<string, unknown>).PushManager
  Object.defineProperty(window, "Notification", {
    value: undefined,
    configurable: true,
  })
}

import { usePushSettings } from "@/lib/hooks/use-push-settings"

describe("usePushSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFromResult = buildQueryMock({ data: mockDevices, error: null })
    mockSupabase.from.mockReturnValue(mockFromResult)
    setupPushMocks()
  })

  afterEach(() => {
    cleanupPushMocks()
    vi.restoreAllMocks()
  })

  it("loads devices from push_subscriptions table on mount", async () => {
    const { result } = renderHook(() => usePushSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockSupabase.from).toHaveBeenCalledWith("push_subscriptions")
    expect(mockFromResult.select).toHaveBeenCalledWith("*")
    expect(mockFromResult.eq).toHaveBeenCalledWith("user_id", "user-1")
    expect(result.current.devices).toHaveLength(2)
    expect(result.current.devices[0].id).toBe("dev-1")
  })

  it("detects not subscribed when no browser subscription exists", async () => {
    setupPushMocks({ subscription: null })

    const { result } = renderHook(() => usePushSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isSubscribed).toBe(false)
    expect(result.current.currentEndpoint).toBeNull()
  })

  it("detects subscribed when browser subscription exists", async () => {
    const mockSub = { endpoint: "https://fcm.googleapis.com/fcm/send/abc" } as PushSubscription
    setupPushMocks({ subscription: mockSub, permission: "granted" })

    const { result } = renderHook(() => usePushSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isSubscribed).toBe(true)
    expect(result.current.currentEndpoint).toBe("https://fcm.googleapis.com/fcm/send/abc")
  })

  it("togglePush calls subscribeToPush when not subscribed", async () => {
    const mockSub = { endpoint: "https://new-endpoint" } as PushSubscription
    mockSubscribeToPush.mockResolvedValue(mockSub)

    const { result } = renderHook(() => usePushSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.togglePush()
    })

    expect(mockSubscribeToPush).toHaveBeenCalledWith("user-1")
    expect(result.current.isSubscribed).toBe(true)
  })

  it("togglePush calls unsubscribeFromPush when subscribed", async () => {
    const mockSub = { endpoint: "https://fcm.googleapis.com/fcm/send/abc" } as PushSubscription
    setupPushMocks({ subscription: mockSub, permission: "granted" })
    mockUnsubscribeFromPush.mockResolvedValue(true)

    const { result } = renderHook(() => usePushSettings())

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true)
    })

    await act(async () => {
      await result.current.togglePush()
    })

    expect(mockUnsubscribeFromPush).toHaveBeenCalledWith("user-1")
    expect(result.current.isSubscribed).toBe(false)
  })

  it("removeDevice calls Supabase delete with correct ID", async () => {
    const deleteChain = buildQueryMock({ data: null, error: null })
    deleteChain.eq = vi.fn().mockImplementation(() => deleteChain)
    // Override order to resolve for the refresh call
    deleteChain.order = vi.fn().mockResolvedValue({ data: [], error: null })
    deleteChain.delete = vi.fn().mockReturnValue(deleteChain)

    // First call: initial load returns devices. Subsequent calls: empty after removal.
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount <= 1) return mockFromResult
      return deleteChain
    })

    const { result } = renderHook(() => usePushSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.removeDevice("dev-2")
    })

    // Verify delete was called on push_subscriptions
    expect(mockSupabase.from).toHaveBeenCalledWith("push_subscriptions")
  })

  it("sets error when subscribe fails", async () => {
    mockSubscribeToPush.mockResolvedValue(null)

    const { result } = renderHook(() => usePushSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.togglePush()
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.isSubscribed).toBe(false)
  })

  it("handles DB fetch error gracefully", async () => {
    mockFromResult = buildQueryMock({
      data: null,
      error: { message: "Network error", code: "500" },
    })
    mockFromResult.order.mockRejectedValue(new Error("Network error"))
    mockSupabase.from.mockReturnValue(mockFromResult)

    const { result } = renderHook(() => usePushSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("Failed to load push settings")
  })
})
