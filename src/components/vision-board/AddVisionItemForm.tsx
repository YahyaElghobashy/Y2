"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CategoryWithItems } from "@/lib/types/vision-board.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type AddVisionItemFormProps = {
  categoryId: string
  categories: CategoryWithItems[]
  onSave: (categoryId: string, data: { title: string; description?: string; file?: File }) => Promise<void>
  onClose: () => void
}

export function AddVisionItemForm({
  categoryId,
  categories,
  onSave,
  onClose,
}: AddVisionItemFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isValid = title.trim().length > 0

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(selected)
  }

  const handleSubmit = async () => {
    if (!isValid || isSaving) return
    setIsSaving(true)
    await onSave(selectedCategoryId, {
      title: title.trim(),
      description: description.trim() || undefined,
      file: file ?? undefined,
    })
    setIsSaving(false)
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50" data-testid="add-item-form">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className={cn(
            "absolute bottom-0 inset-x-0 bg-[var(--color-bg-elevated,#FFFFFF)]",
            "rounded-t-[20px] px-5 pt-4 pb-8 max-h-[85vh] overflow-y-auto"
          )}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          {/* Handle */}
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border-subtle,#E8E2DA)]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[18px] font-semibold font-[family-name:var(--font-display)] text-[var(--color-text-primary,#2C2825)]">
              Add Vision Item
            </h3>
            <button onClick={onClose} className="p-1">
              <X size={20} className="text-[var(--color-text-muted,#B5ADA4)]" />
            </button>
          </div>

          {/* Photo upload */}
          <label className="block mb-4 cursor-pointer" data-testid="photo-upload">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {preview ? (
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden max-w-[200px] mx-auto">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={cn(
                "flex flex-col items-center justify-center gap-2 py-8 rounded-2xl",
                "border-2 border-dashed border-[var(--color-border-subtle,#E8E2DA)]",
                "text-[var(--color-text-muted,#B5ADA4)]"
              )}>
                <Camera size={28} />
                <span className="text-[13px]">Add photo (optional)</span>
              </div>
            )}
          </label>

          {/* Title */}
          <div className="mb-4">
            <label className="text-[12px] font-medium text-[var(--color-text-secondary,#8C8279)] mb-1 block">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your vision?"
              maxLength={100}
              className={cn(
                "w-full px-4 py-3 rounded-[10px] text-[14px]",
                "bg-[var(--color-bg-secondary,#F5F0E8)]",
                "text-[var(--color-text-primary,#2C2825)]",
                "placeholder:text-[var(--color-text-muted,#B5ADA4)]",
                "outline-none focus:ring-2 focus:ring-[var(--accent-primary,#C4956A)]/30"
              )}
              data-testid="title-input"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="text-[12px] font-medium text-[var(--color-text-secondary,#8C8279)] mb-1 flex justify-between">
              <span>Description</span>
              <span className="text-[var(--color-text-muted,#B5ADA4)]">{description.length}/300</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="Describe your aspiration..."
              maxLength={300}
              rows={3}
              className={cn(
                "w-full px-4 py-3 rounded-[10px] text-[14px] resize-none",
                "bg-[var(--color-bg-secondary,#F5F0E8)]",
                "text-[var(--color-text-primary,#2C2825)]",
                "placeholder:text-[var(--color-text-muted,#B5ADA4)]",
                "outline-none focus:ring-2 focus:ring-[var(--accent-primary,#C4956A)]/30"
              )}
              data-testid="description-input"
            />
          </div>

          {/* Category selector */}
          <div className="mb-6">
            <label className="text-[12px] font-medium text-[var(--color-text-secondary,#8C8279)] mb-1 block">
              Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-[10px] text-[14px]",
                "bg-[var(--color-bg-secondary,#F5F0E8)]",
                "text-[var(--color-text-primary,#2C2825)]",
                "outline-none"
              )}
              data-testid="category-select"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <motion.button
            className={cn(
              "w-full py-3 rounded-xl text-[15px] font-semibold",
              "font-[family-name:var(--font-body)]",
              isValid
                ? "bg-[var(--accent-primary,#C4956A)] text-white"
                : "bg-[var(--color-bg-secondary,#F5F0E8)] text-[var(--color-text-muted,#B5ADA4)]"
            )}
            whileTap={isValid ? { scale: 0.98 } : undefined}
            onClick={handleSubmit}
            disabled={!isValid || isSaving}
            data-testid="save-item-btn"
          >
            {isSaving ? "Adding..." : "Add Item"}
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
