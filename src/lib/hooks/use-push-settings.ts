"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/services/push-service"
import type { PushPermissionState } from "@/lib/types/notification.types"
import type { Database } from "@/lib/types/database.types"

type PushSubscriptionRow = Database["public"]["Tables"]["push_subscriptions"]["Row"]

export type UsePushSettingsReturn = {
  permissionState: PushPermissionState
  isSubscribed: boolean
  isLoading: boolean
  devices: PushSubscriptionRow[]
  currentEndpoint: string | null
  error: string | null
  togglePush: () => Promise<void>
  removeDevice: (id: string) => Promise<void>
  refreshDevices: () => Promise<void>
}

export function usePushSettings(): UsePushSettingsReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [permissionState, setPermissionState] = useState<PushPermissionState>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [devices, setDevices] = useState<PushSubscriptionRow[]>([])
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isToggling = useRef(false)

  const refreshDevices = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError("Failed to load devices")
      return
    }

    setDevices((data ?? []) as PushSubscriptionRow[])
  }, [user, supabase])

  // Initial load: check permission, subscription, and fetch devices
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    let mounted = true

    async function init() {
      try {
        // Check push support and permission
        const permission = getPushPermission()
        if (mounted) setPermissionState(permission)

        if (isPushSupported() && "serviceWorker" in navigator) {
          // Check if currently subscribed — timeout after 3s to avoid hanging
          // when no service worker is registered (e.g. dev/preview environments)
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
          ])
          if (registration) {
            const subscription = await registration.pushManager.getSubscription()
            if (mounted) {
              setIsSubscribed(Boolean(subscription))
              setCurrentEndpoint(subscription?.endpoint ?? null)
            }
          }
        }

        // Fetch device list from DB
        const { data } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })

        if (mounted && data) {
          setDevices(data as PushSubscriptionRow[])
        }
      } catch {
        if (mounted) setError("Failed to load push settings")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  const togglePush = useCallback(async () => {
    if (!user || isToggling.current) return
    isToggling.current = true
    setError(null)

    try {
      if (isSubscribed) {
        const success = await unsubscribeFromPush(user.id)
        if (success) {
          setIsSubscribed(false)
          setCurrentEndpoint(null)
          await refreshDevices()
        } else {
          setError("Failed to disable notifications")
        }
      } else {
        const subscription = await subscribeToPush(user.id)
        if (subscription) {
          setIsSubscribed(true)
          setCurrentEndpoint(subscription.endpoint)
          setPermissionState("granted")
          await refreshDevices()
        } else {
          // Permission may have been denied
          setPermissionState(getPushPermission())
          if (getPushPermission() === "denied") {
            setError("Notifications are blocked in your browser settings")
          } else {
            setError("Failed to enable notifications")
          }
        }
      }
    } catch {
      setError("Something went wrong")
    } finally {
      isToggling.current = false
    }
  }, [user, isSubscribed, refreshDevices])

  const removeDevice = useCallback(
    async (id: string) => {
      if (!user) return
      setError(null)

      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (deleteError) {
        setError("Failed to remove device")
        return
      }

      // Check if we removed the current device's subscription
      const removed = devices.find((d) => d.id === id)
      if (removed) {
        const removedSub = removed.subscription as Record<string, unknown>
        if (removedSub?.endpoint === currentEndpoint) {
          // Also unsubscribe the browser
          try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
              await subscription.unsubscribe()
            }
          } catch {
            // Silently fail browser unsubscribe
          }
          setIsSubscribed(false)
          setCurrentEndpoint(null)
        }
      }

      await refreshDevices()
    },
    [user, supabase, devices, currentEndpoint, refreshDevices]
  )

  if (!user) {
    return {
      permissionState: "unsupported",
      isSubscribed: false,
      isLoading: false,
      devices: [],
      currentEndpoint: null,
      error: null,
      togglePush: async () => {},
      removeDevice: async () => {},
      refreshDevices: async () => {},
    }
  }

  return {
    permissionState,
    isSubscribed,
    isLoading,
    devices,
    currentEndpoint,
    error,
    togglePush,
    removeDevice,
    refreshDevices,
  }
}
