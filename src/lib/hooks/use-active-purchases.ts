"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Purchase, MarketplaceItem } from "@/lib/types/marketplace.types"

export type ActivePurchaseWithItem = Purchase & {
  marketplace_items: MarketplaceItem
}

export type UseActivePurchasesReturn = {
  activePurchases: ActivePurchaseWithItem[]
  isLoading: boolean
  error: string | null
  acknowledgePurchase: (purchaseId: string) => Promise<void>
  completePurchase: (purchaseId: string) => Promise<void>
  declinePurchase: (purchaseId: string) => Promise<void>
  refreshPurchases: () => Promise<void>
}

export function useActivePurchases(): UseActivePurchasesReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [activePurchases, setActivePurchases] = useState<ActivePurchaseWithItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshPurchases = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("purchases")
      .select("*, marketplace_items(*)")
      .or(`target_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError("Failed to load purchases")
      return
    }

    setActivePurchases((data ?? []) as ActivePurchaseWithItem[])
  }, [user, supabase])

  // Initial load
  useEffect(() => {
    if (!user) {
      setActivePurchases([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadData() {
      const { data, error: fetchError } = await supabase
        .from("purchases")
        .select("*, marketplace_items(*)")
        .or(`target_id.eq.${user!.id},buyer_id.eq.${user!.id}`)
        .in("status", ["pending", "active"])
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (fetchError) {
        setError("Failed to load purchases")
      } else {
        setActivePurchases((data ?? []) as ActivePurchaseWithItem[])
      }
      setIsLoading(false)
    }

    loadData()
    return () => { mounted = false }
  }, [user, supabase])

  // Realtime subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`purchases_${user.id}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "purchases",
        },
        () => {
          refreshPurchases()
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, refreshPurchases])

  const acknowledgePurchase = useCallback(async (purchaseId: string) => {
    if (!user) return

    const { error: updateError } = await supabase
      .from("purchases")
      .update({ status: "active" })
      .eq("id", purchaseId)

    if (updateError) {
      setError("Failed to acknowledge purchase")
      return
    }

    // Optimistic update
    setActivePurchases((prev) =>
      prev.map((p) => (p.id === purchaseId ? { ...p, status: "active" as const } : p))
    )
  }, [user, supabase])

  const completePurchase = useCallback(async (purchaseId: string) => {
    if (!user) return

    const { error: updateError } = await supabase
      .from("purchases")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", purchaseId)

    if (updateError) {
      setError("Failed to complete purchase")
      return
    }

    // Remove from active list
    setActivePurchases((prev) => prev.filter((p) => p.id !== purchaseId))
  }, [user, supabase])

  const declinePurchase = useCallback(async (purchaseId: string) => {
    if (!user) return

    const { error: updateError } = await supabase
      .from("purchases")
      .update({ status: "declined", completed_at: new Date().toISOString() })
      .eq("id", purchaseId)

    if (updateError) {
      setError("Failed to decline purchase")
      return
    }

    // Remove from active list
    setActivePurchases((prev) => prev.filter((p) => p.id !== purchaseId))
  }, [user, supabase])

  if (!user) {
    return {
      activePurchases: [],
      isLoading: false,
      error: null,
      acknowledgePurchase: async () => {},
      completePurchase: async () => {},
      declinePurchase: async () => {},
      refreshPurchases: async () => {},
    }
  }

  return {
    activePurchases,
    isLoading,
    error,
    acknowledgePurchase,
    completePurchase,
    declinePurchase,
    refreshPurchases,
  }
}
