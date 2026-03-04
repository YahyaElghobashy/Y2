"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ListChecks, ChevronDown, Plus } from "lucide-react"
import { useSharedList } from "@/lib/hooks/use-shared-list"
import { useAuth } from "@/lib/providers/AuthProvider"
import { QuickAddInput } from "@/components/list/QuickAddInput"
import { ListItemCard } from "@/components/list/ListItemCard"
import { StaggerList } from "@/components/animations"
import { EmptyState } from "@/components/shared/EmptyState"
import { cn } from "@/lib/utils"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export default function SharedListPage() {
  const { user } = useAuth()
  const {
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
    createList,
    selectList,
  } = useSharedList()

  const [showCompleted, setShowCompleted] = useState(false)
  const [showNewList, setShowNewList] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")

  // Group items: top-level vs sub-items
  const topLevelItems = useMemo(
    () => items.filter((i) => !i.parent_id),
    [items]
  )

  const subItemsByParent = useMemo(() => {
    const map = new Map<string, typeof items>()
    for (const item of items) {
      if (item.parent_id) {
        const existing = map.get(item.parent_id) ?? []
        existing.push(item)
        map.set(item.parent_id, existing)
      }
    }
    return map
  }, [items])

  const handleCreateList = async () => {
    const trimmed = newListTitle.trim()
    if (!trimmed) return
    await createList(trimmed)
    setNewListTitle("")
    setShowNewList(false)
  }

  if (isLoading) {
    return (
      <div data-testid="list-loading" className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-[var(--bg-secondary)]"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="list-error" className="text-center text-[14px] text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div data-testid="shared-list-page" className="flex flex-col gap-5 pb-8">
      {/* List selector */}
      {lists.length > 0 && (
        <div data-testid="list-selector" className="flex items-center gap-2 overflow-x-auto">
          {lists.map((l) => (
            <button
              key={l.id}
              data-testid={`list-tab-${l.id}`}
              onClick={() => selectList(l.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                l.id === list?.id
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              )}
            >
              {l.title}
            </button>
          ))}
          <motion.button
            data-testid="new-list-button"
            onClick={() => setShowNewList(true)}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]"
            aria-label="Create new list"
          >
            <Plus size={14} />
          </motion.button>
        </div>
      )}

      {/* New list input */}
      <AnimatePresence>
        {showNewList && (
          <motion.div
            data-testid="new-list-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <input
                data-testid="new-list-input"
                type="text"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreateList()
                  }
                  if (e.key === "Escape") setShowNewList(false)
                }}
                placeholder="List name..."
                className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px] outline-none"
                autoFocus
              />
              <motion.button
                data-testid="create-list-confirm"
                onClick={handleCreateList}
                whileTap={{ scale: 0.95 }}
                disabled={!newListTitle.trim()}
                className="rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
              >
                Create
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick add */}
      {list && (
        <QuickAddInput
          onAdd={(title) => addItem(title)}
          placeholder={`Add to ${list.title}...`}
        />
      )}

      {/* Empty state */}
      {!list && lists.length === 0 && (
        <EmptyState
          icon={<ListChecks size={48} strokeWidth={1.5} />}
          title="No lists yet"
          subtitle="Create a shared list to get started"
          actionLabel="Create List"
          onAction={() => setShowNewList(true)}
        />
      )}

      {list && topLevelItems.length === 0 && completedItems.length === 0 && (
        <EmptyState
          icon={<ListChecks size={48} strokeWidth={1.5} />}
          title="List is empty"
          subtitle="Add your first item above"
          className="min-h-[200px]"
        />
      )}

      {/* Active items */}
      {topLevelItems.length > 0 && (
        <StaggerList className="flex flex-col gap-2">
          {topLevelItems.map((item) => (
            <ListItemCard
              key={item.id}
              item={item}
              subItems={subItemsByParent.get(item.id) ?? []}
              isOwn={item.created_by === user?.id}
              onToggle={toggleComplete}
              onDelete={deleteItem}
              onAddSubItem={addSubItem}
            />
          ))}
        </StaggerList>
      )}

      {/* Completed section */}
      {completedItems.length > 0 && (
        <div data-testid="completed-section">
          <button
            data-testid="completed-toggle"
            onClick={() => setShowCompleted((prev) => !prev)}
            className="flex w-full items-center gap-2 py-2 text-[13px] font-medium text-[var(--text-muted)]"
          >
            <motion.div
              animate={{ rotate: showCompleted ? 180 : 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <ChevronDown size={14} />
            </motion.div>
            Completed ({completedItems.length})
          </button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                {completedItems.map((item) => (
                  <ListItemCard
                    key={item.id}
                    item={item}
                    isOwn={item.created_by === user?.id}
                    onToggle={toggleComplete}
                    onDelete={deleteItem}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
