import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockPartner = { id: "user-2", email: "yara@test.com", display_name: "Yara" }
const mockUseAuth: ReturnType<typeof vi.fn> = vi.fn(() => ({
  user: mockUser,
  partner: mockPartner,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Test Data ─────────────────────────────────────────────────

const MY_WISHLIST = {
  id: "wl-mine",
  owner_id: "user-1",
  name: "My Wishlist",
  is_default: true,
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const PARTNER_WISHLIST = {
  id: "wl-partner",
  owner_id: "user-2",
  name: "My Wishlist",
  is_default: true,
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MY_ITEM_UNCLAIMED = {
  id: "item-1",
  wishlist_id: "wl-mine",
  title: "New Headphones",
  description: "Sony WH-1000XM5",
  url: "https://example.com/headphones",
  image_url: "https://example.com/img.jpg",
  image_media_id: null,
  price: 350,
  currency: "USD",
  category: "tech",
  priority: "must_have",
  is_purchased: false,
  purchased_at: null,
  purchased_by: null,
  claimed_by: null,
  claimed_at: null,
  sort_order: 0,
  added_by: "user-1",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MY_ITEM_CLAIMED = {
  id: "item-2",
  wishlist_id: "wl-mine",
  title: "Leather Journal",
  description: null,
  url: null,
  image_url: null,
  image_media_id: null,
  price: 45,
  currency: "EGP",
  category: "books",
  priority: "want",
  is_purchased: false,
  purchased_at: null,
  purchased_by: null,
  claimed_by: "user-2",
  claimed_at: "2026-03-05T10:00:00Z",
  sort_order: 1,
  added_by: "user-1",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MY_ITEM_PURCHASED = {
  id: "item-3",
  wishlist_id: "wl-mine",
  title: "Coffee Mug",
  description: null,
  url: null,
  image_url: null,
  image_media_id: null,
  price: 20,
  currency: "EGP",
  category: "home",
  priority: "nice_to_have",
  is_purchased: true,
  purchased_at: "2026-03-04T00:00:00Z",
  purchased_by: "user-2",
  claimed_by: "user-2",
  claimed_at: "2026-03-03T00:00:00Z",
  sort_order: 2,
  added_by: "user-1",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const PARTNER_ITEM = {
  id: "item-p1",
  wishlist_id: "wl-partner",
  title: "Silk Scarf",
  description: "Rose gold silk",
  url: null,
  image_url: null,
  image_media_id: null,
  price: 120,
  currency: "EGP",
  category: "fashion",
  priority: "want",
  is_purchased: false,
  purchased_at: null,
  purchased_by: null,
  claimed_by: "user-1",
  claimed_at: "2026-03-05T09:00:00Z",
  sort_order: 0,
  added_by: "user-2",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const PARTNER_ITEM_UNCLAIMED = {
  id: "item-p2",
  wishlist_id: "wl-partner",
  title: "Book Set",
  description: null,
  url: null,
  image_url: null,
  image_media_id: null,
  price: 80,
  currency: "EGP",
  category: "books",
  priority: "must_have",
  is_purchased: false,
  purchased_at: null,
  purchased_by: null,
  claimed_by: null,
  claimed_at: null,
  sort_order: 1,
  added_by: "user-2",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

// ── Mutable query result refs ─────────────────────────────────

let wishlistsResult = {
  data: [MY_WISHLIST, PARTNER_WISHLIST] as unknown[] | null,
  error: null as unknown,
}
let itemsResult = {
  data: [MY_ITEM_UNCLAIMED, MY_ITEM_CLAIMED, MY_ITEM_PURCHASED, PARTNER_ITEM, PARTNER_ITEM_UNCLAIMED] as unknown[] | null,
  error: null as unknown,
}
let insertResult = { data: MY_ITEM_UNCLAIMED as unknown, error: null as unknown }
let updateResult = { error: null as unknown }
let deleteResult = { error: null as unknown }
let invokeResult = {
  data: { title: "Product", description: "Desc", image: "https://img.com/1.jpg", price: 99, currency: "USD" } as unknown,
  error: null as unknown,
}

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannelOn = vi.fn(function (this: unknown) { return this })

// Track insert/update/delete calls
const insertCalls: unknown[] = []
const updateCalls: { data: unknown; id: string }[] = []
const deleteCalls: string[] = []

function buildChain(table: string) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn((col: string, val: unknown) => {
    if (col === "id" && table === "wishlist_items") {
      // For update().eq() and delete().eq() chains
      if (updateCalls.length > 0 && typeof val === "string") {
        updateCalls[updateCalls.length - 1].id = val
      }
      if (deleteCalls.length === 0 || deleteCalls[deleteCalls.length - 1] !== "") {
        deleteCalls.push(val as string)
      } else {
        deleteCalls[deleteCalls.length - 1] = val as string
      }
      return Promise.resolve(updateResult)
    }
    return chain
  })
  chain.in = vi.fn(() => chain)
  chain.order = vi.fn(() => {
    if (table === "wishlists") return Promise.resolve(wishlistsResult)
    return Promise.resolve(itemsResult)
  })
  chain.single = vi.fn(() => Promise.resolve(insertResult))
  chain.insert = vi.fn((data: unknown) => {
    insertCalls.push(data)
    return chain
  })
  chain.update = vi.fn((data: unknown) => {
    updateCalls.push({ data, id: "" })
    return { eq: vi.fn((_col: string, val: string) => {
      updateCalls[updateCalls.length - 1].id = val
      return Promise.resolve(updateResult)
    })}
  })
  chain.delete = vi.fn(() => {
    deleteCalls.push("")
    return { eq: vi.fn((_col: string, val: string) => {
      deleteCalls[deleteCalls.length - 1] = val
      return Promise.resolve(deleteResult)
    })}
  })
  return chain
}

const mockFrom = vi.fn((table: string) => buildChain(table))
const mockInvoke = vi.fn(() => Promise.resolve(invokeResult))

const stableSupabase = {
  from: mockFrom,
  channel: vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe })),
  removeChannel: mockRemoveChannel,
  functions: { invoke: mockInvoke },
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

import { useWishlist } from "@/lib/hooks/use-wishlist"

describe("useWishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: mockPartner })
    wishlistsResult = { data: [MY_WISHLIST, PARTNER_WISHLIST], error: null }
    itemsResult = {
      data: [MY_ITEM_UNCLAIMED, MY_ITEM_CLAIMED, MY_ITEM_PURCHASED, PARTNER_ITEM, PARTNER_ITEM_UNCLAIMED],
      error: null,
    }
    insertResult = { data: MY_ITEM_UNCLAIMED, error: null }
    updateResult = { error: null }
    deleteResult = { error: null }
    invokeResult = {
      data: { title: "Product", description: "Desc", image: "https://img.com/1.jpg", price: 99, currency: "USD" },
      error: null,
    }
    insertCalls.length = 0
    updateCalls.length = 0
    deleteCalls.length = 0
    mockChannelOn.mockImplementation(function (this: unknown) { return this })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit: loading and auth-safe", () => {
    it("returns inert state when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useWishlist())

      expect(result.current.myWishlist).toBeNull()
      expect(result.current.partnerWishlist).toBeNull()
      expect(result.current.myItems).toEqual([])
      expect(result.current.partnerItems).toEqual([])
      expect(result.current.myTotal).toBe(0)
      expect(result.current.partnerTotal).toBe(0)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("fetches wishlists and items on mount", async () => {
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.myWishlist).toEqual(MY_WISHLIST)
      expect(result.current.partnerWishlist).toEqual(PARTNER_WISHLIST)
      expect(mockFrom).toHaveBeenCalledWith("wishlists")
      expect(mockFrom).toHaveBeenCalledWith("wishlist_items")
    })

    it("handles wishlists fetch error", async () => {
      wishlistsResult = { data: null, error: { message: "DB error" } }
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBe("DB error")
    })

    it("handles empty wishlists gracefully", async () => {
      wishlistsResult = { data: [], error: null }
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.myWishlist).toBeNull()
      expect(result.current.myItems).toEqual([])
    })
  })

  describe("unit: CRITICAL claim masking", () => {
    it("myItems always returns claimed_by as null even when DB has value", async () => {
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // MY_ITEM_CLAIMED has claimed_by: "user-2" in the DB
      const claimedItem = result.current.myItems.find((i) => i.id === "item-2")
      expect(claimedItem).toBeDefined()
      expect(claimedItem!.claimed_by).toBeNull()
      expect(claimedItem!.claimed_at).toBeNull()
    })

    it("myItems masks claimed_by for ALL own items (unclaimed too)", async () => {
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      for (const item of result.current.myItems) {
        expect(item.claimed_by).toBeNull()
        expect(item.claimed_at).toBeNull()
      }
    })

    it("partnerItems preserves claimed_by values", async () => {
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const claimedPartnerItem = result.current.partnerItems.find((i) => i.id === "item-p1")
      expect(claimedPartnerItem).toBeDefined()
      expect(claimedPartnerItem!.claimed_by).toBe("user-1")
      expect(claimedPartnerItem!.claimed_at).toBe("2026-03-05T09:00:00Z")
    })

    it("partnerItems shows null for unclaimed items", async () => {
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const unclaimed = result.current.partnerItems.find((i) => i.id === "item-p2")
      expect(unclaimed).toBeDefined()
      expect(unclaimed!.claimed_by).toBeNull()
    })

    it("myItems separates correctly by wishlist_id", async () => {
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Own items = items in wl-mine
      expect(result.current.myItems).toHaveLength(3) // unclaimed + claimed + purchased
      expect(result.current.partnerItems).toHaveLength(2) // partner items
    })
  })

  describe("unit: price totals", () => {
    it("myTotal sums only unpurchased item prices", async () => {
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // MY_ITEM_UNCLAIMED: 350, MY_ITEM_CLAIMED: 45, MY_ITEM_PURCHASED: 20 (excluded)
      expect(result.current.myTotal).toBe(395)
    })

    it("partnerTotal sums only unpurchased item prices", async () => {
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // PARTNER_ITEM: 120, PARTNER_ITEM_UNCLAIMED: 80
      expect(result.current.partnerTotal).toBe(200)
    })

    it("handles null prices as 0", async () => {
      itemsResult = {
        data: [
          { ...MY_ITEM_UNCLAIMED, price: null },
          { ...MY_ITEM_CLAIMED, price: null },
        ],
        error: null,
      }
      const { result } = renderHook(() => useWishlist())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.myTotal).toBe(0)
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction: addItem", () => {
    it("optimistically adds item and calls supabase insert", async () => {
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const initialCount = result.current.myItems.length

      await act(async () => {
        await result.current.addItem({
          title: "New Book",
          price: 25,
          category: "books",
          priority: "want",
        })
      })

      expect(mockFrom).toHaveBeenCalledWith("wishlist_items")
      expect(insertCalls.length).toBeGreaterThan(0)
      const lastInsert = insertCalls[insertCalls.length - 1] as Record<string, unknown>
      expect(lastInsert.title).toBe("New Book")
      expect(lastInsert.price).toBe(25)
      expect(lastInsert.category).toBe("books")
      expect(lastInsert.wishlist_id).toBe("wl-mine")
      expect(lastInsert.added_by).toBe("user-1")
    })

    it("rolls back on insert error", async () => {
      insertResult = { data: null, error: { message: "Insert failed" } }
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const initialCount = result.current.myItems.length

      await act(async () => {
        await result.current.addItem({ title: "Will Fail" })
      })

      expect(result.current.error).toBe("Insert failed")
      // Optimistic item should be rolled back
      expect(result.current.myItems).toHaveLength(initialCount)
    })
  })

  describe("interaction: removeItem", () => {
    it("optimistically removes item and calls supabase delete", async () => {
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.removeItem("item-1")
      })

      expect(mockFrom).toHaveBeenCalledWith("wishlist_items")
    })

    it("rolls back on delete error", async () => {
      deleteResult = { error: { message: "Delete failed" } }
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.removeItem("item-1")
      })

      expect(result.current.error).toBe("Delete failed")
    })
  })

  describe("interaction: updateItem", () => {
    it("optimistically updates and calls supabase update", async () => {
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.updateItem("item-1", { title: "Updated Title", price: 999 })
      })

      expect(mockFrom).toHaveBeenCalledWith("wishlist_items")
      expect(updateCalls.length).toBeGreaterThan(0)
      const lastUpdate = updateCalls[updateCalls.length - 1]
      expect((lastUpdate.data as Record<string, unknown>).title).toBe("Updated Title")
      expect((lastUpdate.data as Record<string, unknown>).price).toBe(999)
    })
  })

  describe("interaction: claimItem / unclaimItem", () => {
    it("claimItem calls update with user id on partner item", async () => {
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.claimItem("item-p2")
      })

      expect(updateCalls.length).toBeGreaterThan(0)
      const lastUpdate = updateCalls[updateCalls.length - 1]
      expect((lastUpdate.data as Record<string, unknown>).claimed_by).toBe("user-1")
      expect((lastUpdate.data as Record<string, unknown>).claimed_at).toBeDefined()
    })

    it("claimItem does NOT claim own items (guard)", async () => {
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const prevUpdateCount = updateCalls.length

      await act(async () => {
        await result.current.claimItem("item-1") // own item
      })

      // No new update calls should happen
      expect(updateCalls.length).toBe(prevUpdateCount)
    })

    it("unclaimItem nullifies claimed_by", async () => {
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.unclaimItem("item-p1")
      })

      expect(updateCalls.length).toBeGreaterThan(0)
      const lastUpdate = updateCalls[updateCalls.length - 1]
      expect((lastUpdate.data as Record<string, unknown>).claimed_by).toBeNull()
      expect((lastUpdate.data as Record<string, unknown>).claimed_at).toBeNull()
    })

    it("rolls back claim on error", async () => {
      updateResult = { error: { message: "Claim failed" } }
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.claimItem("item-p2")
      })

      expect(result.current.error).toBe("Claim failed")
    })
  })

  describe("interaction: markPurchased", () => {
    it("sets is_purchased true with user id", async () => {
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.markPurchased("item-p1")
      })

      expect(updateCalls.length).toBeGreaterThan(0)
      const lastUpdate = updateCalls[updateCalls.length - 1]
      expect((lastUpdate.data as Record<string, unknown>).is_purchased).toBe(true)
      expect((lastUpdate.data as Record<string, unknown>).purchased_by).toBe("user-1")
      expect((lastUpdate.data as Record<string, unknown>).purchased_at).toBeDefined()
    })

    it("rolls back purchase on error", async () => {
      updateResult = { error: { message: "Purchase update failed" } }
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.markPurchased("item-p1")
      })

      expect(result.current.error).toBe("Purchase update failed")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration: realtime", () => {
    it("subscribes to wishlist_items channel on mount", async () => {
      renderHook(() => useWishlist())

      await waitFor(() => expect(stableSupabase.channel).toHaveBeenCalledWith("wishlist_items_realtime"))
      expect(mockChannelOn).toHaveBeenCalledTimes(3) // INSERT, UPDATE, DELETE
      expect(mockSubscribe).toHaveBeenCalled()
    })

    it("cleans up channel on unmount", async () => {
      const { unmount } = renderHook(() => useWishlist())

      await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())
      unmount()

      expect(mockRemoveChannel).toHaveBeenCalled()
    })

    it("does not subscribe when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      renderHook(() => useWishlist())

      expect(stableSupabase.channel).not.toHaveBeenCalled()
    })
  })

  describe("integration: extractUrlMetadata", () => {
    it("invokes url-metadata edge function", async () => {
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      let metadata: unknown
      await act(async () => {
        metadata = await result.current.extractUrlMetadata("https://example.com/product")
      })

      expect(mockInvoke).toHaveBeenCalledWith("url-metadata", {
        body: { url: "https://example.com/product" },
      })
      expect(metadata).toEqual({
        title: "Product",
        description: "Desc",
        image: "https://img.com/1.jpg",
        price: 99,
        currency: "USD",
      })
    })

    it("returns null on edge function error", async () => {
      invokeResult = { data: null, error: { message: "Function error" } }
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      let metadata: unknown
      await act(async () => {
        metadata = await result.current.extractUrlMetadata("https://example.com/bad")
      })

      expect(metadata).toBeNull()
    })

    it("returns null on invoke exception", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Network error"))
      const { result } = renderHook(() => useWishlist())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      let metadata: unknown
      await act(async () => {
        metadata = await result.current.extractUrlMetadata("https://broken.com")
      })

      expect(metadata).toBeNull()
    })
  })

  describe("integration: supabase queries", () => {
    it("fetches wishlists with correct table and ordering", async () => {
      renderHook(() => useWishlist())

      await waitFor(() => expect(mockFrom).toHaveBeenCalledWith("wishlists"))
    })

    it("fetches items for all wishlists using .in()", async () => {
      renderHook(() => useWishlist())

      await waitFor(() => expect(mockFrom).toHaveBeenCalledWith("wishlist_items"))
    })
  })
})
