import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
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

      // 1+2. Atomic spend + purchase insert in a single DB transaction.
      //   purchase_marketplace_item() debits the buyer's CoYYns and inserts
      //   the purchase row together, so an item can never be delivered
      //   without a charge (or charged without a purchase). It raises
      //   INSUFFICIENT_FUNDS / ITEM_NOT_FOUND / etc. on failure.
      const { data, error: rpcError } = await supabase.rpc(
        "purchase_marketplace_item",
        {
          p_item_id: itemId,
          p_target_id: partner.id,
          p_effect_payload: (effectPayload ?? null) as Json,
        }
      )

      if (rpcError || !data) {
        const code = rpcError?.message ?? ""
        if (code.includes("INSUFFICIENT_FUNDS")) {
          throw new Error("Insufficient CoYYns balance")
        }
        if (code.includes("ITEM_NOT_FOUND")) {
          throw new Error("Item is no longer available")
        }
        throw new Error("Failed to complete purchase")
      }

      const purchase = data as Purchase

      // 3. Invoke process-purchase edge function (applies the effect + pushes
      //    a notification to the partner). Awaited so a failure is observable
      //    rather than silently swallowed.
      const { error: fnError } = await supabase.functions.invoke(
        "process-purchase",
        {
          body: {
            purchase_id: purchase.id,
            item_id: itemId,
            effect_type: item.effect_type,
            effect_payload: effectPayload ?? null,
            buyer_id: user.id,
            target_id: partner.id,
          },
        }
      )

      if (fnError) {
        // Push / effect processing failed. Don't drop it on the floor — write
        // an in-app notification row so the partner still sees the purchase,
        // and activate it so it shows up as actionable rather than stuck.
        // The purchase + spend already succeeded, so a fallback failure must
        // never throw back to the caller — log it and move on.
        console.warn(
          "[marketplace] process-purchase failed, falling back to in-app notification",
          fnError
        )
        try {
          const { error: notifError } = await supabase
            .from("notifications")
            .insert({
              sender_id: user.id,
              recipient_id: partner.id,
              title: `${item.icon} ${item.name}`.trim(),
              body: `Your partner sent you "${item.name}".`,
              emoji: item.icon,
              type: "marketplace_effect",
              status: "sent",
              metadata: {
                purchase_id: purchase.id,
                effect_type: item.effect_type,
                fallback: true,
              },
            })
          if (notifError) {
            console.warn("[marketplace] fallback notification insert failed", notifError)
          }

          const { error: updateError } = await supabase
            .from("purchases")
            .update({ status: "active" })
            .eq("id", purchase.id)
          if (updateError) {
            console.warn("[marketplace] fallback purchase activation failed", updateError)
          }
        } catch (fallbackError) {
          console.warn("[marketplace] fallback handling threw", fallbackError)
        }
      }

      // 4. Refresh local purchases list
      await refreshPurchases()

      return purchase
    },
    [user, partner, items, supabase, refreshPurchases]
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
