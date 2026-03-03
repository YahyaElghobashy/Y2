import type { Database } from "@/lib/types/database.types"

export type PushPermissionState = "granted" | "denied" | "default" | "unsupported"

export type NotificationStatus = "pending" | "delivered" | "failed"

export type Notification = Database["public"]["Tables"]["notifications"]["Row"]

export type DailyLimit = Database["public"]["Tables"]["daily_send_limits"]["Row"]

export type UseNotificationsReturn = {
  notifications: Notification[]
  dailyLimit: DailyLimit | null
  canSend: boolean
  remainingSends: number
  isLoading: boolean
  error: string | null
  sendNotification: (title: string, body: string, emoji?: string) => Promise<void>
  refreshLimits: () => Promise<void>
}
