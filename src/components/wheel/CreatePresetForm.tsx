"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreatePresetInput } from "@/lib/types/wheel.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const EMOJI_OPTIONS = [
  "🎯", "🍕", "🎬", "🎲", "🧹", "🍽️", "🎮", "🎵", "📚", "🏃",
  "🎨", "✈️", "🛍️", "💡", "🤔", "❓", "🎉", "⭐", "💝", "🌙",
]

type CreatePresetFormProps = {
  onSave: (data: CreatePresetInput) => void
  onCancel: () => void
  initialData?: CreatePresetInput
  className?: string
}

export function CreatePresetForm({
  onSave,
  onCancel,
  initialData,
  className,
}: CreatePresetFormProps) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [icon, setIcon] = useState(initialData?.icon ?? "🎯")
  const [items, setItems] = useState<string[]>(
    initialData?.items?.map((i) => i.label) ?? ["", ""]
  )
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const canSave = name.trim().length > 0 && items.filter((i) => i.trim()).length >= 2

  const handleAddItem = () => {
    if (items.length >= 20) return
    setItems([...items, ""])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 2) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    setItems(newItems)
  }

  const handleSave = () => {
    if (!canSave) return
    onSave({
      name: name.trim(),
      icon,
      items: items
        .filter((i) => i.trim())
        .map((label) => ({ label: label.trim() })),
    })
  }

  return (
    <div data-testid="create-preset-form" className={cn("flex flex-col gap-4", className)}>
      <h2 className="font-display text-[16px] font-semibold text-[var(--text-primary)]">
        {initialData ? "Edit Preset" : "New Preset"}
      </h2>

      {/* Name */}
      <div>
        <label className="mb-1 block text-[12px] font-medium text-[var(--text-secondary)]">
          Name
        </label>
        <input
          data-testid="preset-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Restaurant Picker"
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--accent-primary)]"
        />
      </div>

      {/* Icon */}
      <div>
        <label className="mb-1 block text-[12px] font-medium text-[var(--text-secondary)]">
          Icon
        </label>
        <button
          data-testid="icon-picker-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[20px]"
        >
          {icon}
        </button>
        {showEmojiPicker && (
          <div data-testid="emoji-grid" className="mt-2 grid grid-cols-10 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setIcon(emoji)
                  setShowEmojiPicker(false)
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-[16px]",
                  icon === emoji
                    ? "bg-[var(--accent-soft,#E8D5C0)]"
                    : "hover:bg-[var(--bg-secondary)]"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div>
        <label className="mb-1 block text-[12px] font-medium text-[var(--text-secondary)]">
          Items ({items.filter((i) => i.trim()).length}/20)
        </label>
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                data-testid={`item-input-${index}`}
                type="text"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`Item ${index + 1}`}
                className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent-primary)]"
              />
              {items.length > 2 && (
                <button
                  data-testid={`remove-item-${index}`}
                  onClick={() => handleRemoveItem(index)}
                  className="rounded-lg p-1 text-[var(--text-muted)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {items.length < 20 && (
          <button
            data-testid="add-item-btn"
            onClick={handleAddItem}
            className="mt-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-[var(--accent-primary,#C4956A)]"
          >
            <Plus size={12} />
            Add Item
          </button>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <motion.button
          data-testid="save-preset-btn"
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 rounded-xl bg-[var(--accent-primary,#C4956A)] py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
        >
          Save
        </motion.button>
        <motion.button
          data-testid="cancel-preset-btn"
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          onClick={onCancel}
          className="flex-1 rounded-xl bg-[var(--bg-secondary)] py-2.5 text-[14px] font-medium text-[var(--text-secondary)]"
        >
          Cancel
        </motion.button>
      </div>
    </div>
  )
}
