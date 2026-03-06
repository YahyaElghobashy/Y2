"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  Notification,
  DailyLimit,
  UseNotificationsReturn,
} from "@/lib/types/notification.types"

const FREE_SENDS_PER_DAY = 2

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]
}

export function useNotifications(): UseNotificationsReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dailyLimit, setDailyLimit] = useState<DailyLimit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isSending = useRef(false)

  const freeSendsRemaining = useMemo(
    () => (dailyLimit ? FREE_SENDS_PER_DAY - dailyLimit.free_sends_used : FREE_SENDS_PER_DAY),
    [dailyLimit]
  )

  const bonusSendsRemaining = useMemo(
    () => (dailyLimit ? dailyLimit.bonus_sends_available - dailyLimit.bonus_sends_used : 0),
    [dailyLimit]
  )

  const remainingSends = useMemo(
    () => Math.max(0, freeSendsRemaining) + Math.max(0, bonusSendsRemaining),
    [freeSendsRemaining, bonusSendsRemaining]
  )

  const canSend = remainingSends > 0

  const refreshLimits = useCallback(async () => {
    if (!user) return

    const today = getTodayDateString()
    const { data, error: fetchError } = await supabase
      .from("daily_send_limits")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single()

    if (fetchError && fetchError.code === "PGRST116") {
      setDailyLimit(null)
      return
    }

    if (fetchError) {
      return
    }

    setDailyLimit(data as DailyLimit)
  }, [user, supabase])

  // Initial data load
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setDailyLimit(null)
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadData() {
      try {
        const today = getTodayDateString()

        const [notifResult, limitResult] = await Promise.all([
          supabase
            .from("notifications")
            .select("*")
            .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("daily_send_limits")
            .select("*")
            .eq("user_id", user!.id)
            .eq("date", today)
            .single(),
        ])

        if (!mounted) return

        if (notifResult.data) {
          setNotifications(notifResult.data as Notification[])
        }

        if (limitResult.error && limitResult.error.code === "PGRST116") {
          setDailyLimit(null)
        } else if (limitResult.data) {
          setDailyLimit(limitResult.data as DailyLimit)
        }
      } catch {
        if (mounted) {
          setError("Failed to load notifications")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // Realtime subscription for notification changes
  useEffect(() => {
    if (!user) return

    const channelName = `notifications_${user.id}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload: { new: Notification }) => {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `sender_id=eq.${user.id}`,
        },
        (payload: { new: Notification }) => {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const purchaseBonusSend = useCallback(async () => {
    if (!user) return

    const today = getTodayDateString()
    const currentBonus = dailyLimit?.bonus_sends_available ?? 0

    // Upsert daily limit row — creates if missing, updates bonus_sends_available if exists
    const { error: upsertError } = await supabase
      .from("daily_send_limits")
      .upsert(
        {
          user_id: user.id,
          date: today,
          free_sends_used: dailyLimit?.free_sends_used ?? 0,
          bonus_sends_used: dailyLimit?.bonus_sends_used ?? 0,
          bonus_sends_available: currentBonus + 1,
        },
        { onConflict: "user_id,date" }
      )

    if (upsertError) {
      setError("Failed to purchase bonus send")
      return
    }

    await refreshLimits()
  }, [user, supabase, dailyLimit, refreshLimits])

  const sendNotification = useCallback(
    async (title: string, body: string, emoji?: string) => {
      setError(null)

      if (!user) return

      if (!partner) {
        setError("Partner not connected")
        return
      }

      if (!canSend) {
        setError("Daily send limit reached")
        return
      }

      if (isSending.current) return
      isSending.current = true

      const optimisticNotification: Notification = {
        id: `optimistic-${Date.now()}`,
        sender_id: user.id,
        recipient_id: partner.id,
        title,
        body,
        emoji: emoji ?? null,
        status: "sent",
        type: "custom",
        metadata: {},
        created_at: new Date().toISOString(),
      }

      setNotifications((prev) => [optimisticNotification, ...prev])

      try {
        const { data: insertedData, error: insertError } = await supabase
          .from("notifications")
          .insert({
            sender_id: user.id,
            recipient_id: partner.id,
            title,
            body,
            emoji: emoji ?? null,
          })
          .select()
          .single()

        if (insertError || !insertedData) {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== optimisticNotification.id)
          )
          setError("Failed to send notification")
          return
        }

        const insertedRow = insertedData as Notification

        // Replace optimistic row with real row
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === optimisticNotification.id ? insertedRow : n
          )
        )

        await supabase.functions.invoke("send-notification", {
          body: { notification_id: insertedRow.id, recipient_id: partner.id },
        })

        await refreshLimits()
      } catch {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== optimisticNotification.id)
        )
        setError("Failed to send notification. Please check your connection.")
      } finally {
        isSending.current = false
      }
    },
    [user, partner, canSend, supabase, refreshLimits]
  )

  if (!user) {
    return {
      notifications: [],
      dailyLimit: null,
      canSend: false,
      remainingSends: 0,
      isLoading: false,
      error: null,
      sendNotification: async () => {},
      purchaseBonusSend: async () => {},
      refreshLimits: async () => {},
    }
  }

  return {
    notifications,
    dailyLimit,
    canSend,
    remainingSends,
    isLoading,
    error,
    sendNotification,
    purchaseBonusSend,
    refreshLimits,
  }
}
