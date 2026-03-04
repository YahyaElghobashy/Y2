import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockPartner = { id: "user-2", email: "yara@test.com" }
const mockUseAuth: ReturnType<typeof vi.fn> = vi.fn(() => ({
  user: mockUser,
  partner: mockPartner,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Test Data ─────────────────────────────────────────────────

const MOCK_LIST = {
  id: "list-1",
  created_by: "user-1",
  title: "Groceries",
  list_type: "grocery",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MOCK_ITEM_OWN = {
  id: "item-1",
  list_id: "list-1",
  parent_id: null,
  title: "Milk",
  is_completed: false,
  completed_by: null,
  completed_at: null,
  coyyns_reward: 0,
  position: 0,
  created_by: "user-1",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MOCK_ITEM_PARTNER = {
  id: "item-2",
  list_id: "list-1",
  parent_id: null,
  title: "Eggs",
  is_completed: false,
  completed_by: null,
  completed_at: null,
  coyyns_reward: 5,
  position: 1,
  created_by: "user-2",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MOCK_SUB_ITEM = {
  id: "sub-1",
  list_id: "list-1",
  parent_id: "item-1",
  title: "Whole milk",
  is_completed: false,
  completed_by: null,
  completed_at: null,
  coyyns_reward: 0,
  position: 0,
  created_by: "user-1",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

// ── Mutable query result refs ─────────────────────────────────

let listsResult = { data: [MOCK_LIST] as unknown[] | null, error: null as unknown }
let itemsResult = { data: [MOCK_ITEM_OWN, MOCK_ITEM_PARTNER] as unknown[] | null, error: null as unknown }
let insertResult = { data: MOCK_ITEM_OWN as unknown, error: null as unknown }
let updateResult = { error: null as unknown }
let deleteResult = { error: null as unknown }

const coyynsInsertCalls: unknown[] = []
const listItemsInsertCalls: unknown[] = []
const sharedListsInsertCalls: unknown[] = []

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannelOn = vi.fn(function (this: unknown) { return this })

function buildChain(table: string) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => {
    if (table === "shared_lists") return Promise.resolve(listsResult)
    return Promise.resolve(itemsResult)
  })
  chain.single = vi.fn(() => Promise.resolve(insertResult))
  chain.insert = vi.fn((data: unknown) => {
    if (table === "coyyns_transactions") {
      coyynsInsertCalls.push(data)
      return Promise.resolve({ error: null })
    }
    if (table === "list_items") listItemsInsertCalls.push(data)
    if (table === "shared_lists") sharedListsInsertCalls.push(data)
    return chain
  })
  chain.update = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(updateResult)) }))
  chain.delete = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(deleteResult)) }))
  return chain
}

const mockFrom = vi.fn((table: string) => buildChain(table))

// CRITICAL: stable reference to prevent infinite re-renders
const stableSupabase = {
  from: mockFrom,
  channel: vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe })),
  removeChannel: mockRemoveChannel,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

import { useSharedList } from "@/lib/hooks/use-shared-list"

describe("useSharedList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: mockPartner })
    listsResult = { data: [MOCK_LIST], error: null }
    itemsResult = { data: [MOCK_ITEM_OWN, MOCK_ITEM_PARTNER], error: null }
    insertResult = { data: MOCK_ITEM_OWN, error: null }
    updateResult = { error: null }
    deleteResult = { error: null }
    coyynsInsertCalls.length = 0
    listItemsInsertCalls.length = 0
    sharedListsInsertCalls.length = 0
    mockChannelOn.mockImplementation(function (this: unknown) { return this })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("returns inert state when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useSharedList())

      expect(result.current.lists).toEqual([])
      expect(result.current.list).toBeNull()
      expect(result.current.items).toEqual([])
      expect(result.current.completedItems).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("fetches lists on mount and auto-selects first", async () => {
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.lists).toHaveLength(1)
      expect(result.current.list).toEqual(MOCK_LIST)
    })

    it("separates active items from completed items", async () => {
      const completedItem = {
        ...MOCK_ITEM_OWN,
        id: "item-done",
        is_completed: true,
        completed_by: "user-1",
        completed_at: new Date().toISOString(),
      }
      itemsResult = { data: [MOCK_ITEM_OWN, completedItem], error: null }

      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() =>
        expect(result.current.items.length + result.current.completedItems.length).toBe(2)
      )

      expect(result.current.items[0].id).toBe("item-1")
      expect(result.current.completedItems[0].id).toBe("item-done")
    })

    it("filters out completed items older than 7 days", async () => {
      const oldCompleted = {
        ...MOCK_ITEM_OWN,
        id: "item-old",
        is_completed: true,
        completed_by: "user-1",
        completed_at: "2020-01-01T00:00:00Z",
      }
      itemsResult = { data: [MOCK_ITEM_OWN, oldCompleted], error: null }

      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(result.current.items).toHaveLength(1))

      expect(result.current.completedItems).toHaveLength(0)
    })

    it("sets error on lists fetch failure", async () => {
      listsResult = { data: null, error: { message: "Network error" } }

      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.error).toBe("Network error"))
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("addItem inserts with correct title and coyyns_reward", async () => {
      insertResult = { data: { ...MOCK_ITEM_OWN, id: "new-1", title: "Cheese", coyyns_reward: 3 }, error: null }
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(result.current.list).not.toBeNull())

      await act(async () => {
        await result.current.addItem("Cheese", 3)
      })

      expect(listItemsInsertCalls).toHaveLength(1)
      expect(listItemsInsertCalls[0]).toEqual(
        expect.objectContaining({
          title: "Cheese",
          coyyns_reward: 3,
          created_by: "user-1",
        })
      )
    })

    it("addItem rolls back on error", async () => {
      insertResult = { data: null, error: { message: "Insert failed" } }
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(result.current.list).not.toBeNull())

      await act(async () => {
        await result.current.addItem("Bad Item")
      })

      expect(result.current.error).toBe("Insert failed")
    })

    it("toggleComplete flips is_completed state", async () => {
      itemsResult = { data: [MOCK_ITEM_OWN], error: null }
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(result.current.items).toHaveLength(1))

      await act(async () => {
        await result.current.toggleComplete("item-1")
      })

      expect(result.current.items).toHaveLength(0)
      expect(result.current.completedItems).toHaveLength(1)
    })

    it("toggleComplete awards CoYYns when completing partner item with reward", async () => {
      itemsResult = { data: [MOCK_ITEM_PARTNER], error: null }
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(result.current.items).toHaveLength(1))

      await act(async () => {
        await result.current.toggleComplete("item-2")
      })

      expect(coyynsInsertCalls).toHaveLength(1)
      expect(coyynsInsertCalls[0]).toEqual(
        expect.objectContaining({
          user_id: "user-1",
          amount: 5,
          type: "earn",
          category: "list_completion",
        })
      )
    })

    it("toggleComplete does NOT award CoYYns for own items", async () => {
      itemsResult = { data: [MOCK_ITEM_OWN], error: null }
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(result.current.items).toHaveLength(1))

      await act(async () => {
        await result.current.toggleComplete("item-1")
      })

      expect(coyynsInsertCalls).toHaveLength(0)
    })

    it("deleteItem removes item and sub-items optimistically", async () => {
      itemsResult = { data: [MOCK_ITEM_OWN, MOCK_SUB_ITEM], error: null }
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(result.current.items).toHaveLength(2))

      await act(async () => {
        await result.current.deleteItem("item-1")
      })

      expect(result.current.items).toHaveLength(0)
    })

    it("createList inserts and auto-selects new list", async () => {
      const newList = { ...MOCK_LIST, id: "list-new", title: "New List" }
      insertResult = { data: newList, error: null }

      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      let newId: string | null = null
      await act(async () => {
        newId = await result.current.createList("New List", "todo")
      })

      expect(newId).toBe("list-new")
      expect(sharedListsInsertCalls).toHaveLength(1)
      expect(sharedListsInsertCalls[0]).toEqual(
        expect.objectContaining({
          created_by: "user-1",
          title: "New List",
          list_type: "todo",
        })
      )
    })

    it("selectList changes the selected list", async () => {
      const list2 = { ...MOCK_LIST, id: "list-2", title: "Watchlist" }
      listsResult = { data: [MOCK_LIST, list2], error: null }

      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      act(() => {
        result.current.selectList("list-2")
      })

      await waitFor(() => expect(result.current.list?.id).toBe("list-2"))
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("queries shared_lists table on mount", async () => {
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockFrom).toHaveBeenCalledWith("shared_lists")
    })

    it("queries list_items table when list selected", async () => {
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockFrom).toHaveBeenCalledWith("list_items"))
    })

    it("sets up realtime subscription on list_items", async () => {
      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())

      expect(mockChannelOn).toHaveBeenCalledTimes(3)
    })

    it("cleans up realtime channel on unmount", async () => {
      const { result, unmount } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())

      unmount()
      expect(mockRemoveChannel).toHaveBeenCalled()
    })

    it("addSubItem inserts with parent_id set", async () => {
      itemsResult = { data: [MOCK_ITEM_OWN], error: null }
      insertResult = { data: MOCK_SUB_ITEM, error: null }

      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(result.current.items).toHaveLength(1))

      await act(async () => {
        await result.current.addSubItem("item-1", "Whole milk")
      })

      expect(listItemsInsertCalls).toHaveLength(1)
      expect(listItemsInsertCalls[0]).toEqual(
        expect.objectContaining({
          parent_id: "item-1",
          title: "Whole milk",
          created_by: "user-1",
        })
      )
    })

    it("deleteList removes list and updates state", async () => {
      const list2 = { ...MOCK_LIST, id: "list-2", title: "Watchlist" }
      listsResult = { data: [MOCK_LIST, list2], error: null }

      const { result } = renderHook(() => useSharedList())

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.lists).toHaveLength(2)

      await act(async () => {
        await result.current.deleteList("list-1")
      })

      expect(result.current.lists).toHaveLength(1)
    })
  })
})
