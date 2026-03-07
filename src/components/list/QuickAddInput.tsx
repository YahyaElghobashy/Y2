"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

type QuickAddInputProps = {
  onAdd: (title: string) => void
  placeholder?: string
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function QuickAddInput({
  onAdd,
  placeholder = "Add an item...",
  className,
}: QuickAddInputProps) {
  const [value, setValue] = useState("")

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue("")
  }, [value, onAdd])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div
      data-testid="quick-add-input"
      className={cn(
        "flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 ps-4",
        className
      )}
    >
      <input
        data-testid="quick-add-field"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent font-body text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
      />
      <motion.button
        data-testid="quick-add-button"
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim()}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          value.trim()
            ? "bg-[var(--accent-primary)] text-white"
            : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
        )}
        aria-label="Add item"
      >
        <Plus size={18} strokeWidth={2} />
      </motion.button>
    </div>
  )
}
