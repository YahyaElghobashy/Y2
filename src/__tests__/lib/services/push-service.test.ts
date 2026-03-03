import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// --- Supabase mock ---
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockDeleteChain = {
  eq: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis() }),
}
mockDeleteChain.delete.mockReturnValue(mockDeleteChain)

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === "push_subscriptions") {
      return {
        upsert: mockUpsert,
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }
    }
    return {}
  }),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/services/push-service"

describe("push-service", () => {
  const originalWindow = { ...window }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore any window property overrides
    vi.restoreAllMocks()
  })

  describe("isPushSupported", () => {
    it("returns false in jsdom (no PushManager)", () => {
      // jsdom doesn't have PushManager by default
      expect(isPushSupported()).toBe(false)
    })
  })

  describe("getPushPermission", () => {
    it("returns 'unsupported' when isPushSupported() is false", () => {
      expect(getPushPermission()).toBe("unsupported")
    })

    it("returns 'default' when Notification.permission is 'default'", () => {
      // Temporarily mock the supports
      Object.defineProperty(window, "PushManager", { value: {}, configurable: true })
      Object.defineProperty(navigator, "serviceWorker", {
        value: { ready: Promise.resolve({}) },
        configurable: true,
      })
      Object.defineProperty(window, "Notification", {
        value: { permission: "default", requestPermission: vi.fn() },
        configurable: true,
      })

      expect(getPushPermission()).toBe("default")

      // Cleanup
      delete (window as Record<string, unknown>).PushManager
    })
  })

  describe("subscribeToPush", () => {
    it("returns null when push is not supported", async () => {
      const result = await subscribeToPush("user-1")
      expect(result).toBeNull()
    })

    it("returns null when permission is denied", async () => {
      // Mock push support
      Object.defineProperty(window, "PushManager", { value: {}, configurable: true })
      Object.defineProperty(navigator, "serviceWorker", {
        value: { ready: Promise.resolve({}) },
        configurable: true,
      })

      const mockRequestPermission = vi.fn().mockResolvedValue("denied")
      Object.defineProperty(window, "Notification", {
        value: { permission: "default", requestPermission: mockRequestPermission },
        configurable: true,
      })

      const result = await subscribeToPush("user-1")
      expect(result).toBeNull()

      // Cleanup
      delete (window as Record<string, unknown>).PushManager
    })

    it("upserts to Supabase when permission is granted", async () => {
      const mockSubscription = {
        toJSON: () => ({
          endpoint: "https://push.example.com/sub-1",
          keys: { p256dh: "key1", auth: "key2" },
        }),
      }

      const mockPushManager = {
        subscribe: vi.fn().mockResolvedValue(mockSubscription),
      }

      Object.defineProperty(window, "PushManager", { value: {}, configurable: true })
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({ pushManager: mockPushManager }),
        },
        configurable: true,
      })

      const mockRequestPermission = vi.fn().mockResolvedValue("granted")
      Object.defineProperty(window, "Notification", {
        value: { permission: "granted", requestPermission: mockRequestPermission },
        configurable: true,
      })

      // Set VAPID key
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkBo1G_kw7ERm-SV_4WT9SJ3mR-kO9O6e_JIhQJPk4"

      const result = await subscribeToPush("user-1")

      expect(result).toBe(mockSubscription)
      expect(mockSupabase.from).toHaveBeenCalledWith("push_subscriptions")
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          endpoint: "https://push.example.com/sub-1",
        }),
        { onConflict: "endpoint" }
      )

      // Cleanup
      delete (window as Record<string, unknown>).PushManager
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    })
  })

  describe("unsubscribeFromPush", () => {
    it("returns false when push is not supported", async () => {
      const result = await unsubscribeFromPush("user-1")
      expect(result).toBe(false)
    })

    it("returns false when no active subscription exists", async () => {
      Object.defineProperty(window, "PushManager", { value: {}, configurable: true })
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: { getSubscription: vi.fn().mockResolvedValue(null) },
          }),
        },
        configurable: true,
      })
      Object.defineProperty(window, "Notification", {
        value: { permission: "granted" },
        configurable: true,
      })

      const result = await unsubscribeFromPush("user-1")
      expect(result).toBe(false)

      delete (window as Record<string, unknown>).PushManager
    })

    it("calls subscription.unsubscribe() and deletes from Supabase", async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true)
      const mockSubscription = {
        endpoint: "https://push.example.com/sub-1",
        unsubscribe: mockUnsubscribe,
      }

      Object.defineProperty(window, "PushManager", { value: {}, configurable: true })
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ready: Promise.resolve({
            pushManager: {
              getSubscription: vi.fn().mockResolvedValue(mockSubscription),
            },
          }),
        },
        configurable: true,
      })
      Object.defineProperty(window, "Notification", {
        value: { permission: "granted" },
        configurable: true,
      })

      const result = await unsubscribeFromPush("user-1")
      expect(result).toBe(true)
      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith("push_subscriptions")

      delete (window as Record<string, unknown>).PushManager
    })
  })
})
