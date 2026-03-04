import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import type { MarketplaceItem, Purchase } from "@/lib/types/marketplace.types"
import type { Json } from "@/lib/types/database.types"

type UseMarketplaceReturn = {
  items: MarketplaceItem[]
  purchases: Purchase[]
  isLoading: boolean
  error: string | null
  createPurchase: (
    itemId: string,
    effectPayload?: Record<string, unknown>
  ) => Promise<Purchase>
  refreshItems: () => Promise<void>
  refreshPurchases: () => Promise<void>
}

const PURCHASE_LIMIT = 50

export function useMarketplace(): UseMarketplaceReturn {
  const { user, partner } = useAuth()
  const { spendCoyyns } = useCoyyns()
  const supabase = getSupabaseBrowserClient()

  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshItems = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("marketplace_items")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (fetchError) {
      setError("Failed to load marketplace items")
      return
    }
    setItems((data ?? []) as MarketplaceItem[])
  }, [supabase])

  const refreshPurchases = useCallback(async () => {
    if (!user) return
    const { data, error: fetchError } = await supabase
      .from("purchases")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PURCHASE_LIMIT)

    if (fetchError) return
    setPurchases((data ?? []) as Purchase[])
  }, [user, supabase])

  // Initial data load
  useEffect(() => {
    if (!user) {
      setItems([])
      setPurchases([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadData() {
      const [itemsResult, purchasesResult] = await Promise.all([
        supabase
          .from("marketplace_items")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("purchases")
          .select("*")
          .eq("buyer_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(PURCHASE_LIMIT),
      ])

      if (!mounted) return

      if (itemsResult.data) setItems(itemsResult.data as MarketplaceItem[])
      if (purchasesResult.data) setPurchases(purchasesResult.data as Purchase[])
      setIsLoading(false)
    }

    loadData()
    return () => { mounted = false }
  }, [user, supabase])

  const createPurchase = useCallback(
    async (
      itemId: string,
      effectPayload?: Record<string, unknown>
    ): Promise<Purchase> => {
      if (!user) throw new Error("Not authenticated")
      if (!partner) throw new Error("No partner connected")

      const item = items.find((i) => i.id === itemId)
      if (!item) throw new Error("Item not found")

      // 1. Spend CoYYns (validates balance internally)
      await spendCoyyns(item.price, item.name, "marketplace")

      // 2. Insert purchase record
      const { data, error: insertError } = await supabase
        .from("purchases")
        .insert({
          buyer_id: user.id,
          target_id: partner.id,
          item_id: itemId,
          cost: item.price,
          effect_payload: (effectPayload ?? null) as Json,
          status: "pending",
        })
        .select()
        .single()

      if (insertError || !data) {
        throw new Error("Failed to create purchase record")
      }

      const purchase = data as Purchase

      // 3. Fire-and-forget: invoke process-purchase edge function
      supabase.functions
        .invoke("process-purchase", {
          body: {
            purchase_id: purchase.id,
            item_id: itemId,
            effect_type: item.effect_type,
            effect_payload: effectPayload ?? null,
            buyer_id: user.id,
            target_id: partner.id,
          },
        })
        .catch(() => {
          // Edge function failure is non-blocking — purchase record exists
        })

      // 4. Refresh local purchases list
      await refreshPurchases()

      return purchase
    },
    [user, partner, items, spendCoyyns, supabase, refreshPurchases]
  )

  // Auth-safe: inert state when user is null
  if (!user) {
    return {
      items: [],
      purchases: [],
      isLoading: false,
      error: null,
      createPurchase: async () => { throw new Error("Not authenticated") },
      refreshItems: async () => {},
      refreshPurchases: async () => {},
    }
  }

  return {
    items,
    purchases,
    isLoading,
    error,
    createPurchase,
    refreshItems,
    refreshPurchases,
  }
}
