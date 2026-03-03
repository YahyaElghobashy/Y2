import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { PushPermissionState } from "@/lib/types/notification.types"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

export function getPushPermission(): PushPermissionState {
  if (!isPushSupported()) return "unsupported"
  return Notification.permission as PushPermissionState
}

export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return null

  try {
    const registration = await navigator.serviceWorker.ready
    const vapidKey = urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    )
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey.buffer as ArrayBuffer,
    })

    const subscriptionJson = subscription.toJSON()
    const supabase = getSupabaseBrowserClient()

    // Delete existing subscription for this user with same endpoint
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .contains("subscription", { endpoint: subscriptionJson.endpoint })

    // Insert new subscription
    await supabase.from("push_subscriptions").insert({
      user_id: userId,
      subscription: subscriptionJson as unknown as import("@/lib/types/database.types").Json,
    })

    return subscription
  } catch {
    return null
  }
}

export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) return false

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()

    const supabase = getSupabaseBrowserClient()
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .contains("subscription", { endpoint })

    return true
  } catch {
    return false
  }
}
