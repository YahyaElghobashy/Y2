"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronDown, Trash2, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ListItem } from "@/lib/types/shared-list.types"

type ListItemCardProps = {
  item: ListItem
  subItems?: ListItem[]
  isOwn: boolean
  onToggle: (itemId: string) => void
  onDelete: (itemId: string) => void
  onAddSubItem?: (parentId: string, title: string) => void
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function ListItemCard({
  item,
  subItems = [],
  isOwn,
  onToggle,
  onDelete,
  onAddSubItem,
  className,
}: ListItemCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [subInput, setSubInput] = useState("")

  const handleSubSubmit = () => {
    const trimmed = subInput.trim()
    if (!trimmed || !onAddSubItem) return
    onAddSubItem(item.id, trimmed)
    setSubInput("")
  }

  return (
    <div
      data-testid={`list-item-${item.id}`}
      className={cn("rounded-xl bg-[var(--bg-elevated)] p-3", className)}
    >
      {/* Main item row */}
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <motion.button
          data-testid={`toggle-${item.id}`}
          onClick={() => onToggle(item.id)}
          whileTap={{ scale: 0.85 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            item.is_completed
              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
              : "border-[var(--border-subtle)] bg-transparent"
          )}
          aria-label={item.is_completed ? "Mark incomplete" : "Mark complete"}
          aria-pressed={item.is_completed}
        >
          {item.is_completed && (
            <Check size={14} strokeWidth={2.5} className="text-white" />
          )}
        </motion.button>

        {/* Title */}
        <span
          data-testid={`title-${item.id}`}
          className={cn(
            "flex-1 font-body text-[14px]",
            item.is_completed
              ? "text-[var(--text-muted)] line-through"
              : "text-[var(--text-primary)]"
          )}
        >
          {item.title}
        </span>

        {/* CoYYns badge */}
        {item.coyyns_reward > 0 && (
          <span
            data-testid={`coyyns-badge-${item.id}`}
            className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-primary)]"
          >
            <Coins size={12} />
            {item.coyyns_reward}
          </span>
        )}

        {/* Creator dot */}
        <span
          data-testid={`creator-${item.id}`}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
            isOwn
              ? "bg-[var(--accent-primary)]"
              : "bg-[var(--text-secondary)]"
          )}
          title={isOwn ? "You" : "Partner"}
        >
          {isOwn ? "Y" : "P"}
        </span>

        {/* Expand sub-items */}
        {!item.is_completed && (
          <motion.button
            data-testid={`expand-${item.id}`}
            onClick={() => setExpanded((prev) => !prev)}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className="text-[var(--text-muted)]"
            aria-label={expanded ? "Collapse sub-items" : "Expand sub-items"}
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </motion.button>
        )}

        {/* Delete */}
        <motion.button
          data-testid={`delete-${item.id}`}
          onClick={() => onDelete(item.id)}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          className="text-[var(--text-muted)] hover:text-red-500"
          aria-label="Delete item"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>

      {/* Sub-items */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            data-testid={`sub-items-${item.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mt-2 ms-8 flex flex-col gap-1.5">
              {subItems.map((sub) => (
                <div
                  key={sub.id}
                  data-testid={`sub-item-${sub.id}`}
                  className="flex items-center gap-2"
                >
                  <motion.button
                    data-testid={`toggle-${sub.id}`}
                    onClick={() => onToggle(sub.id)}
                    whileTap={{ scale: 0.85 }}
                    transition={{ duration: 0.15, ease: EASE_OUT }}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                      sub.is_completed
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                        : "border-[var(--border-subtle)] bg-transparent"
                    )}
                    aria-pressed={sub.is_completed}
                  >
                    {sub.is_completed && (
                      <Check size={10} strokeWidth={3} className="text-white" />
                    )}
                  </motion.button>
                  <span
                    className={cn(
                      "text-[13px]",
                      sub.is_completed
                        ? "text-[var(--text-muted)] line-through"
                        : "text-[var(--text-secondary)]"
                    )}
                  >
                    {sub.title}
                  </span>
                </div>
              ))}

              {/* Sub-item add input */}
              {onAddSubItem && (
                <div className="flex items-center gap-2">
                  <input
                    data-testid={`sub-input-${item.id}`}
                    type="text"
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleSubSubmit()
                      }
                    }}
                    placeholder="Add sub-item..."
                    className="flex-1 bg-transparent text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] outline-none"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
