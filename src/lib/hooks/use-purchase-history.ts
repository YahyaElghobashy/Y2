"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { ActivePurchaseWithItem } from "@/lib/hooks/use-active-purchases"

export type PurchaseHistoryEntry = ActivePurchaseWithItem

export type UsePurchaseHistoryReturn = {
  history: PurchaseHistoryEntry[]
  isLoading: boolean
  error: string | null
  refreshHistory: () => Promise<void>
}

const HISTORY_LIMIT = 50
const TERMINAL_STATUSES = ["completed", "declined", "expired"]

/**
 * Past (terminal) marketplace purchases for the couple — both the purchases
 * this user sent and the ones their partner sent them. Kept separate from
 * useActivePurchases (which only tracks pending/active) so the marketplace
 * page can render a clean "history" section. Refreshes live via the same
 * realtime channel pattern so a purchase moves from active → history without
 * a manual reload.
 */
export function usePurchaseHistory(): UsePurchaseHistoryReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [history, setHistory] = useState<PurchaseHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshHistory = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("purchases")
      .select("*, marketplace_items(*)")
      .or(`target_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .in("status", TERMINAL_STATUSES)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT)

    if (fetchError) {
      setError("Failed to load purchase history")
      return
    }

    setHistory((data ?? []) as PurchaseHistoryEntry[])
  }, [user, supabase])

  // Initial load
  useEffect(() => {
    if (!user) {
      setHistory([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadData() {
      const { data, error: fetchError } = await supabase
        .from("purchases")
        .select("*, marketplace_items(*)")
        .or(`target_id.eq.${user!.id},buyer_id.eq.${user!.id}`)
        .in("status", TERMINAL_STATUSES)
        .order("completed_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT)

      if (!mounted) return

      if (fetchError) {
        setError("Failed to load purchase history")
      } else {
        setHistory((data ?? []) as PurchaseHistoryEntry[])
      }
      setIsLoading(false)
    }

    loadData()
    return () => {
      mounted = false
    }
  }, [user, supabase])

  // Realtime: a purchase reaching a terminal state should drop into history.
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`purchase_history_${user.id}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "purchases",
        },
        () => {
          refreshHistory()
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, refreshHistory])

  if (!user) {
    return {
      history: [],
      isLoading: false,
      error: null,
      refreshHistory: async () => {},
    }
  }

  return { history, isLoading, error, refreshHistory }
}
