import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// --- Supabase mock ---
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockContains = vi.fn().mockResolvedValue({ error: null })
const mockEq = vi.fn().mockReturnValue({ contains: mockContains })
const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })

const mockSupabase = {
  from: vi.fn(() => ({
    insert: mockInsert,
    delete: mockDelete,
  })),
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

// Helper to set up browser push APIs
function setupPushMocks(overrides?: {
  permission?: string
  requestPermission?: () => Promise<string>
  pushManager?: Record<string, unknown>
}) {
  Object.defineProperty(window, "PushManager", { value: {}, configurable: true })
  Object.defineProperty(navigator, "serviceWorker", {
    value: {
      ready: Promise.resolve({
        pushManager: overrides?.pushManager ?? {},
      }),
    },
    configurable: true,
  })
  Object.defineProperty(window, "Notification", {
    value: {
      permission: overrides?.permission ?? "default",
      requestPermission: overrides?.requestPermission ?? vi.fn().mockResolvedValue("default"),
    },
    configurable: true,
  })
}

function cleanupPushMocks() {
  delete (window as unknown as Record<string, unknown>).PushManager
  // Restore Notification to a minimal stub
  Object.defineProperty(window, "Notification", {
    value: undefined,
    configurable: true,
  })
}

describe("push-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupPushMocks()
    vi.restoreAllMocks()
  })

  describe("isPushSupported", () => {
    it("returns false in jsdom (no PushManager)", () => {
      expect(isPushSupported()).toBe(false)
    })
  })

  describe("getPushPermission", () => {
    it("returns 'unsupported' when isPushSupported() is false", () => {
      expect(getPushPermission()).toBe("unsupported")
    })

    it("returns 'default' when Notification.permission is 'default'", () => {
      setupPushMocks({ permission: "default" })
      expect(getPushPermission()).toBe("default")
    })
  })

  describe("subscribeToPush", () => {
    it("returns null when push is not supported", async () => {
      const result = await subscribeToPush("user-1")
      expect(result).toBeNull()
    })

    it("returns null when permission is denied", async () => {
      setupPushMocks({
        requestPermission: vi.fn().mockResolvedValue("denied"),
      })

      const result = await subscribeToPush("user-1")
      expect(result).toBeNull()
    })

    it("inserts subscription to Supabase when permission is granted", async () => {
      const mockSubscription = {
        toJSON: () => ({
          endpoint: "https://push.example.com/sub-1",
          keys: { p256dh: "key1", auth: "key2" },
        }),
      }

      const mockPushManager = {
        subscribe: vi.fn().mockResolvedValue(mockSubscription),
      }

      setupPushMocks({
        permission: "granted",
        requestPermission: vi.fn().mockResolvedValue("granted"),
        pushManager: mockPushManager,
      })

      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
        "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkBo1G_kw7ERm-SV_4WT9SJ3mR-kO9O6e_JIhQJPk4"

      const result = await subscribeToPush("user-1")

      expect(result).toBe(mockSubscription)
      expect(mockSupabase.from).toHaveBeenCalledWith("push_subscriptions")
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
        })
      )

      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    })
  })

  describe("unsubscribeFromPush", () => {
    it("returns false when push is not supported", async () => {
      const result = await unsubscribeFromPush("user-1")
      expect(result).toBe(false)
    })

    it("returns false when no active subscription exists", async () => {
      setupPushMocks({
        permission: "granted",
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(null),
        },
      })

      const result = await unsubscribeFromPush("user-1")
      expect(result).toBe(false)
    })

    it("calls subscription.unsubscribe() and deletes from Supabase", async () => {
      const mockUnsubscribe = vi.fn().mockResolvedValue(true)
      const mockSubscription = {
        endpoint: "https://push.example.com/sub-1",
        unsubscribe: mockUnsubscribe,
      }

      setupPushMocks({
        permission: "granted",
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(mockSubscription),
        },
      })

      const result = await unsubscribeFromPush("user-1")
      expect(result).toBe(true)
      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith("push_subscriptions")
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1")
      expect(mockContains).toHaveBeenCalledWith("subscription", {
        endpoint: "https://push.example.com/sub-1",
      })
    })
  })
})
