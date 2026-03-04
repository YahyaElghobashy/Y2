import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { SharedList, ListItem, ListType } from "@/lib/types/shared-list.types"

type UseSharedListReturn = {
  lists: SharedList[]
  list: SharedList | null
  items: ListItem[]
  completedItems: ListItem[]
  isLoading: boolean
  error: string | null
  addItem: (title: string, coyynsReward?: number) => Promise<void>
  addSubItem: (parentId: string, title: string) => Promise<void>
  toggleComplete: (itemId: string) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  reorderItems: (itemIds: string[]) => Promise<void>
  createList: (title: string, listType?: ListType) => Promise<string | null>
  deleteList: (listId: string) => Promise<void>
  selectList: (listId: string) => void
}

const ARCHIVE_DAYS = 7

function getSevenDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - ARCHIVE_DAYS)
  return d.toISOString()
}

export function useSharedList(): UseSharedListReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [lists, setLists] = useState<SharedList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [allItems, setAllItems] = useState<ListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch lists on mount ──────────────────────────────────
  useEffect(() => {
    if (!user) {
      setLists([])
      setAllItems([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadLists() {
      const { data, error: fetchError } = await supabase
        .from("shared_lists")
        .select("*")
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (fetchError) {
        setError(fetchError.message)
        setIsLoading(false)
        return
      }

      const fetched = (data ?? []) as SharedList[]
      setLists(fetched)

      // Auto-select first list if none selected
      if (fetched.length > 0) {
        setSelectedListId((prev) => prev ?? fetched[0].id)
      }

      setIsLoading(false)
    }

    loadLists()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Fetch items when selectedListId changes ───────────────
  useEffect(() => {
    if (!user || !selectedListId) {
      setAllItems([])
      return
    }

    let mounted = true

    async function loadItems() {
      const { data, error: fetchError } = await supabase
        .from("list_items")
        .select("*")
        .eq("list_id", selectedListId!)
        .order("position", { ascending: true })

      if (!mounted) return

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setAllItems((data ?? []) as ListItem[])
    }

    loadItems()

    return () => {
      mounted = false
    }
  }, [user, selectedListId, supabase])

  // ── Realtime subscription on list_items ────────────────────
  useEffect(() => {
    if (!user || !selectedListId) return

    const channelName = `list_items_${selectedListId}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${selectedListId}`,
        },
        (payload: { new: ListItem }) => {
          setAllItems((prev) => {
            // Avoid duplicates from optimistic updates
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
          table: "list_items",
          filter: `list_id=eq.${selectedListId}`,
        },
        (payload: { new: ListItem }) => {
          setAllItems((prev) =>
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
          table: "list_items",
          filter: `list_id=eq.${selectedListId}`,
        },
        (payload: { old: { id: string } }) => {
          setAllItems((prev) =>
            prev.filter((item) => item.id !== payload.old.id)
          )
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, selectedListId, supabase])

  // ── Derived state ─────────────────────────────────────────
  const list = useMemo(
    () => lists.find((l) => l.id === selectedListId) ?? null,
    [lists, selectedListId]
  )

  const items = useMemo(
    () => allItems.filter((item) => !item.is_completed),
    [allItems]
  )

  const completedItems = useMemo(() => {
    const cutoff = getSevenDaysAgo()
    return allItems.filter(
      (item) =>
        item.is_completed &&
        item.completed_at &&
        item.completed_at >= cutoff
    )
  }, [allItems])

  // ── Actions ───────────────────────────────────────────────
  const addItem = useCallback(
    async (title: string, coyynsReward: number = 0) => {
      setError(null)
      if (!user || !selectedListId) return

      const maxPosition = allItems.reduce(
        (max, item) => Math.max(max, item.position),
        -1
      )

      const tempId = crypto.randomUUID()
      const optimistic: ListItem = {
        id: tempId,
        list_id: selectedListId,
        parent_id: null,
        title,
        is_completed: false,
        completed_by: null,
        completed_at: null,
        coyyns_reward: coyynsReward,
        position: maxPosition + 1,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Optimistic insert
      setAllItems((prev) => [...prev, optimistic])

      const { data, error: insertError } = await supabase
        .from("list_items")
        .insert({
          list_id: selectedListId,
          title,
          coyyns_reward: coyynsReward,
          position: maxPosition + 1,
          created_by: user.id,
        })
        .select("*")
        .single()

      if (insertError) {
        // Rollback
        setAllItems((prev) => prev.filter((item) => item.id !== tempId))
        setError(insertError.message)
        return
      }

      // Replace temp with real
      setAllItems((prev) =>
        prev.map((item) => (item.id === tempId ? (data as ListItem) : item))
      )
    },
    [user, selectedListId, allItems, supabase]
  )

  const addSubItem = useCallback(
    async (parentId: string, title: string) => {
      setError(null)
      if (!user || !selectedListId) return

      const siblings = allItems.filter((item) => item.parent_id === parentId)
      const maxPos = siblings.reduce(
        (max, item) => Math.max(max, item.position),
        -1
      )

      const tempId = crypto.randomUUID()
      const optimistic: ListItem = {
        id: tempId,
        list_id: selectedListId,
        parent_id: parentId,
        title,
        is_completed: false,
        completed_by: null,
        completed_at: null,
        coyyns_reward: 0,
        position: maxPos + 1,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setAllItems((prev) => [...prev, optimistic])

      const { data, error: insertError } = await supabase
        .from("list_items")
        .insert({
          list_id: selectedListId,
          parent_id: parentId,
          title,
          position: maxPos + 1,
          created_by: user.id,
        })
        .select("*")
        .single()

      if (insertError) {
        setAllItems((prev) => prev.filter((item) => item.id !== tempId))
        setError(insertError.message)
        return
      }

      setAllItems((prev) =>
        prev.map((item) => (item.id === tempId ? (data as ListItem) : item))
      )
    },
    [user, selectedListId, allItems, supabase]
  )

  const toggleComplete = useCallback(
    async (itemId: string) => {
      setError(null)
      if (!user) return

      const item = allItems.find((i) => i.id === itemId)
      if (!item) return

      const wasCompleted = item.is_completed
      const nowCompleted = !wasCompleted
      const now = new Date().toISOString()

      // Optimistic update
      setAllItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                is_completed: nowCompleted,
                completed_by: nowCompleted ? user.id : null,
                completed_at: nowCompleted ? now : null,
              }
            : i
        )
      )

      const updateData = nowCompleted
        ? { is_completed: true, completed_by: user.id, completed_at: now }
        : { is_completed: false, completed_by: null, completed_at: null }

      const { error: updateError } = await supabase
        .from("list_items")
        .update(updateData)
        .eq("id", itemId)

      if (updateError) {
        // Rollback
        setAllItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  is_completed: wasCompleted,
                  completed_by: item.completed_by,
                  completed_at: item.completed_at,
                }
              : i
          )
        )
        setError(updateError.message)
        return
      }

      // Award CoYYns if completing partner's item with reward
      if (
        nowCompleted &&
        item.coyyns_reward > 0 &&
        item.created_by !== user.id
      ) {
        await supabase.from("coyyns_transactions").insert({
          user_id: user.id,
          amount: item.coyyns_reward,
          type: "earn",
          category: "list_completion",
          description: `Completed: ${item.title}`,
        })
      }
    },
    [user, allItems, supabase]
  )

  const deleteItem = useCallback(
    async (itemId: string) => {
      setError(null)
      if (!user) return

      const removed = allItems.filter(
        (i) => i.id === itemId || i.parent_id === itemId
      )

      // Optimistic remove (item + sub-items)
      setAllItems((prev) =>
        prev.filter((i) => i.id !== itemId && i.parent_id !== itemId)
      )

      const { error: deleteError } = await supabase
        .from("list_items")
        .delete()
        .eq("id", itemId)

      if (deleteError) {
        // Rollback
        setAllItems((prev) => [...prev, ...removed])
        setError(deleteError.message)
      }
    },
    [user, allItems, supabase]
  )

  const reorderItems = useCallback(
    async (itemIds: string[]) => {
      setError(null)
      if (!user) return

      // Optimistic reorder
      const prevItems = [...allItems]
      setAllItems((prev) => {
        const updated = [...prev]
        itemIds.forEach((id, index) => {
          const item = updated.find((i) => i.id === id)
          if (item) item.position = index
        })
        return updated.sort((a, b) => a.position - b.position)
      })

      const updates = itemIds.map((id, index) =>
        supabase.from("list_items").update({ position: index }).eq("id", id)
      )

      const results = await Promise.all(updates)
      const hasError = results.some((r) => r.error)

      if (hasError) {
        setAllItems(prevItems)
        setError("Failed to reorder items")
      }
    },
    [user, allItems, supabase]
  )

  const createList = useCallback(
    async (title: string, listType: ListType = "general"): Promise<string | null> => {
      setError(null)
      if (!user) return null

      const { data, error: insertError } = await supabase
        .from("shared_lists")
        .insert({ created_by: user.id, title, list_type: listType })
        .select("*")
        .single()

      if (insertError || !data) {
        setError(insertError?.message ?? "Failed to create list")
        return null
      }

      const newList = data as SharedList
      setLists((prev) => [newList, ...prev])
      setSelectedListId(newList.id)
      return newList.id
    },
    [user, supabase]
  )

  const deleteList = useCallback(
    async (listId: string) => {
      setError(null)
      if (!user) return

      const prevLists = [...lists]

      setLists((prev) => prev.filter((l) => l.id !== listId))
      if (selectedListId === listId) {
        const remaining = lists.filter((l) => l.id !== listId)
        setSelectedListId(remaining.length > 0 ? remaining[0].id : null)
        setAllItems([])
      }

      const { error: deleteError } = await supabase
        .from("shared_lists")
        .delete()
        .eq("id", listId)

      if (deleteError) {
        setLists(prevLists)
        setError(deleteError.message)
      }
    },
    [user, lists, selectedListId, supabase]
  )

  const selectList = useCallback((listId: string) => {
    setSelectedListId(listId)
  }, [])

  // ── Inert return when no user ─────────────────────────────
  if (!user) {
    return {
      lists: [],
      list: null,
      items: [],
      completedItems: [],
      isLoading: false,
      error: null,
      addItem: async () => {},
      addSubItem: async () => {},
      toggleComplete: async () => {},
      deleteItem: async () => {},
      reorderItems: async () => {},
      createList: async () => null,
      deleteList: async () => {},
      selectList: () => {},
    }
  }

  return {
    lists,
    list,
    items,
    completedItems,
    isLoading,
    error,
    addItem,
    addSubItem,
    toggleComplete,
    deleteItem,
    reorderItems,
    createList,
    deleteList,
    selectList,
  }
}
