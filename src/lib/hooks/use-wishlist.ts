import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  Wishlist,
  WishlistItem,
  AddWishlistItemData,
  UrlMetadata,
} from "@/lib/types/wishlist.types"

type UseWishlistReturn = {
  myWishlist: Wishlist | null
  partnerWishlist: Wishlist | null
  myItems: WishlistItem[]
  partnerItems: WishlistItem[]
  myTotal: number
  partnerTotal: number
  isLoading: boolean
  error: string | null
  addItem: (data: AddWishlistItemData) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  updateItem: (itemId: string, data: Partial<AddWishlistItemData>) => Promise<void>
  claimItem: (itemId: string) => Promise<void>
  unclaimItem: (itemId: string) => Promise<void>
  markPurchased: (itemId: string) => Promise<void>
  extractUrlMetadata: (url: string) => Promise<UrlMetadata | null>
}

const INERT_RETURN: UseWishlistReturn = {
  myWishlist: null,
  partnerWishlist: null,
  myItems: [],
  partnerItems: [],
  myTotal: 0,
  partnerTotal: 0,
  isLoading: false,
  error: null,
  addItem: async () => {},
  removeItem: async () => {},
  updateItem: async () => {},
  claimItem: async () => {},
  unclaimItem: async () => {},
  markPurchased: async () => {},
  extractUrlMetadata: async () => null,
}

export function useWishlist(): UseWishlistReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [rawItems, setRawItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Load wishlists on mount ──────────────────────────────
  useEffect(() => {
    if (!user) {
      setWishlists([])
      setRawItems([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      // Fetch all wishlists (own + partner's via RLS)
      const { data: wlData, error: wlErr } = await supabase
        .from("wishlists")
        .select("*")
        .order("created_at", { ascending: true })

      if (!mounted) return

      if (wlErr) {
        setError(wlErr.message)
        setIsLoading(false)
        return
      }

      const fetchedWishlists = (wlData ?? []) as Wishlist[]
      setWishlists(fetchedWishlists)

      // Fetch all items for all wishlists
      const wishlistIds = fetchedWishlists.map((w) => w.id)
      if (wishlistIds.length === 0) {
        setRawItems([])
        setIsLoading(false)
        return
      }

      const { data: itemData, error: itemErr } = await supabase
        .from("wishlist_items")
        .select("*")
        .in("wishlist_id", wishlistIds)
        .order("sort_order", { ascending: true })

      if (!mounted) return

      if (itemErr) {
        setError(itemErr.message)
        setIsLoading(false)
        return
      }

      setRawItems((itemData ?? []) as WishlistItem[])
      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Realtime subscription on wishlist_items ───────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("wishlist_items_realtime")
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "wishlist_items",
        },
        (payload: { new: WishlistItem }) => {
          setRawItems((prev) => {
            if (prev.some((item) => item.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "wishlist_items",
        },
        (payload: { new: WishlistItem }) => {
          setRawItems((prev) =>
            prev.map((item) =>
              item.id === payload.new.id ? payload.new : item
            )
          )
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "DELETE",
          schema: "public",
          table: "wishlist_items",
        },
        (payload: { old: { id: string } }) => {
          setRawItems((prev) =>
            prev.filter((item) => item.id !== payload.old.id)
          )
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Derived wishlists ────────────────────────────────────
  const myWishlist = useMemo(
    () => wishlists.find((w) => w.owner_id === user?.id) ?? null,
    [wishlists, user]
  )

  const partnerWishlist = useMemo(
    () => wishlists.find((w) => w.owner_id === partner?.id) ?? null,
    [wishlists, partner]
  )

  // ── CRITICAL: Claim masking on own items ─────────────────
  // The owner must NEVER see who claimed their items.
  const myItems = useMemo(
    () =>
      rawItems
        .filter((item) => myWishlist && item.wishlist_id === myWishlist.id)
        .map((item) => ({
          ...item,
          claimed_by: null,
          claimed_at: null,
        })),
    [rawItems, myWishlist]
  )

  // Partner items: claimed_by is visible (claimant can see their claims)
  const partnerItems = useMemo(
    () =>
      rawItems.filter(
        (item) => partnerWishlist && item.wishlist_id === partnerWishlist.id
      ),
    [rawItems, partnerWishlist]
  )

  // ── Price totals (unpurchased only) ──────────────────────
  const myTotal = useMemo(
    () =>
      myItems
        .filter((item) => !item.is_purchased)
        .reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [myItems]
  )

  const partnerTotal = useMemo(
    () =>
      partnerItems
        .filter((item) => !item.is_purchased)
        .reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    [partnerItems]
  )

  // ── Actions ──────────────────────────────────────────────

  const addItem = useCallback(
    async (data: AddWishlistItemData) => {
      setError(null)
      if (!user || !myWishlist) return

      const maxOrder = rawItems
        .filter((i) => i.wishlist_id === myWishlist.id)
        .reduce((max, i) => Math.max(max, i.sort_order), -1)

      const tempId = crypto.randomUUID()
      const now = new Date().toISOString()
      const optimistic: WishlistItem = {
        id: tempId,
        wishlist_id: myWishlist.id,
        title: data.title,
        description: data.description ?? null,
        url: data.url ?? null,
        image_url: data.image_url ?? null,
        image_media_id: null,
        price: data.price ?? null,
        currency: data.currency ?? "EGP",
        category: data.category ?? "other",
        priority: data.priority ?? "want",
        is_purchased: false,
        purchased_at: null,
        purchased_by: null,
        claimed_by: null,
        claimed_at: null,
        sort_order: maxOrder + 1,
        added_by: user.id,
        created_at: now,
        updated_at: now,
      }

      setRawItems((prev) => [...prev, optimistic])

      const { data: inserted, error: insertErr } = await supabase
        .from("wishlist_items")
        .insert({
          wishlist_id: myWishlist.id,
          title: data.title,
          description: data.description ?? null,
          url: data.url ?? null,
          image_url: data.image_url ?? null,
          price: data.price ?? null,
          currency: data.currency ?? "EGP",
          category: data.category ?? "other",
          priority: data.priority ?? "want",
          sort_order: maxOrder + 1,
          added_by: user.id,
        })
        .select("*")
        .single()

      if (insertErr) {
        setRawItems((prev) => prev.filter((i) => i.id !== tempId))
        setError(insertErr.message)
        return
      }

      setRawItems((prev) =>
        prev.map((i) => (i.id === tempId ? (inserted as WishlistItem) : i))
      )
    },
    [user, myWishlist, rawItems, supabase]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      setError(null)
      if (!user) return

      const removed = rawItems.find((i) => i.id === itemId)
      setRawItems((prev) => prev.filter((i) => i.id !== itemId))

      const { error: deleteErr } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", itemId)

      if (deleteErr) {
        if (removed) setRawItems((prev) => [...prev, removed])
        setError(deleteErr.message)
      }
    },
    [user, rawItems, supabase]
  )

  const updateItem = useCallback(
    async (itemId: string, data: Partial<AddWishlistItemData>) => {
      setError(null)
      if (!user) return

      const prev = rawItems.find((i) => i.id === itemId)
      if (!prev) return

      const updateFields: Record<string, unknown> = {}
      if (data.title !== undefined) updateFields.title = data.title
      if (data.description !== undefined) updateFields.description = data.description
      if (data.url !== undefined) updateFields.url = data.url
      if (data.image_url !== undefined) updateFields.image_url = data.image_url
      if (data.price !== undefined) updateFields.price = data.price
      if (data.currency !== undefined) updateFields.currency = data.currency
      if (data.category !== undefined) updateFields.category = data.category
      if (data.priority !== undefined) updateFields.priority = data.priority

      // Optimistic update
      setRawItems((items) =>
        items.map((i) => (i.id === itemId ? { ...i, ...updateFields } as WishlistItem : i))
      )

      const { error: updateErr } = await supabase
        .from("wishlist_items")
        .update(updateFields)
        .eq("id", itemId)

      if (updateErr) {
        setRawItems((items) =>
          items.map((i) => (i.id === itemId ? prev : i))
        )
        setError(updateErr.message)
      }
    },
    [user, rawItems, supabase]
  )

  const claimItem = useCallback(
    async (itemId: string) => {
      setError(null)
      if (!user) return

      const item = rawItems.find((i) => i.id === itemId)
      if (!item) return

      // Cannot claim own items
      if (myWishlist && item.wishlist_id === myWishlist.id) return

      const now = new Date().toISOString()

      setRawItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, claimed_by: user.id, claimed_at: now }
            : i
        )
      )

      const { error: updateErr } = await supabase
        .from("wishlist_items")
        .update({ claimed_by: user.id, claimed_at: now })
        .eq("id", itemId)

      if (updateErr) {
        setRawItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, claimed_by: item.claimed_by, claimed_at: item.claimed_at }
              : i
          )
        )
        setError(updateErr.message)
      }
    },
    [user, myWishlist, rawItems, supabase]
  )

  const unclaimItem = useCallback(
    async (itemId: string) => {
      setError(null)
      if (!user) return

      const item = rawItems.find((i) => i.id === itemId)
      if (!item) return

      setRawItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, claimed_by: null, claimed_at: null }
            : i
        )
      )

      const { error: updateErr } = await supabase
        .from("wishlist_items")
        .update({ claimed_by: null, claimed_at: null })
        .eq("id", itemId)

      if (updateErr) {
        setRawItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, claimed_by: item.claimed_by, claimed_at: item.claimed_at }
              : i
          )
        )
        setError(updateErr.message)
      }
    },
    [user, rawItems, supabase]
  )

  const markPurchased = useCallback(
    async (itemId: string) => {
      setError(null)
      if (!user) return

      const item = rawItems.find((i) => i.id === itemId)
      if (!item) return

      const now = new Date().toISOString()

      setRawItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                is_purchased: true,
                purchased_at: now,
                purchased_by: user.id,
              }
            : i
        )
      )

      const { error: updateErr } = await supabase
        .from("wishlist_items")
        .update({
          is_purchased: true,
          purchased_at: now,
          purchased_by: user.id,
        })
        .eq("id", itemId)

      if (updateErr) {
        setRawItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  is_purchased: item.is_purchased,
                  purchased_at: item.purchased_at,
                  purchased_by: item.purchased_by,
                }
              : i
          )
        )
        setError(updateErr.message)
      }
    },
    [user, rawItems, supabase]
  )

  const extractUrlMetadata = useCallback(
    async (url: string): Promise<UrlMetadata | null> => {
      try {
        const { data, error: invokeErr } = await supabase.functions.invoke(
          "url-metadata",
          { body: { url } }
        )

        if (invokeErr || !data) return null
        return data as UrlMetadata
      } catch {
        return null
      }
    },
    [supabase]
  )

  // ── Inert return when no user ────────────────────────────
  if (!user) return INERT_RETURN

  return {
    myWishlist,
    partnerWishlist,
    myItems,
    partnerItems,
    myTotal,
    partnerTotal,
    isLoading,
    error,
    addItem,
    removeItem,
    updateItem,
    claimItem,
    unclaimItem,
    markPurchased,
    extractUrlMetadata,
  }
}
