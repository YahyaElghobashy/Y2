"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Link as LinkIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  WISHLIST_CATEGORIES,
  WISHLIST_PRIORITIES,
  type WishlistCategory,
  type WishlistPriority,
  type AddWishlistItemData,
  type UrlMetadata,
} from "@/lib/types/wishlist.types"

type AddWishlistItemFormProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: AddWishlistItemData) => Promise<void>
  extractUrlMetadata?: (url: string) => Promise<UrlMetadata | null>
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const CATEGORY_LABELS: Record<WishlistCategory, string> = {
  fashion: "Fashion",
  tech: "Tech",
  home: "Home",
  books: "Books",
  beauty: "Beauty",
  food: "Food",
  experience: "Experience",
  travel: "Travel",
  other: "Other",
}

const PRIORITY_LABELS: Record<WishlistPriority, string> = {
  must_have: "Must Have",
  want: "Want",
  nice_to_have: "Nice to Have",
}

const CURRENCIES = ["EGP", "USD", "EUR", "SAR", "GBP"] as const

export function AddWishlistItemForm({
  open,
  onClose,
  onSubmit,
  extractUrlMetadata,
  className,
}: AddWishlistItemFormProps) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState<string>("EGP")
  const [category, setCategory] = useState<WishlistCategory>("other")
  const [priority, setPriority] = useState<WishlistPriority>("want")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setUrl("")
    setTitle("")
    setDescription("")
    setImageUrl("")
    setPrice("")
    setCurrency("EGP")
    setCategory("other")
    setPriority("want")
    setError(null)
    setIsExtracting(false)
    setIsSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleUrlBlur = useCallback(async () => {
    if (!url || !extractUrlMetadata) return

    // Validate URL
    try {
      new URL(url)
    } catch {
      return
    }

    setIsExtracting(true)
    const metadata = await extractUrlMetadata(url)
    setIsExtracting(false)

    if (metadata) {
      if (metadata.title && !title) setTitle(metadata.title)
      if (metadata.description && !description) setDescription(metadata.description)
      if (metadata.image && !imageUrl) setImageUrl(metadata.image)
      if (metadata.price && !price) setPrice(String(metadata.price))
      if (metadata.currency && currency === "EGP") setCurrency(metadata.currency)
    }
  }, [url, extractUrlMetadata, title, description, imageUrl, price, currency])

  const handleSubmit = useCallback(async () => {
    setError(null)

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    setIsSubmitting(true)

    const data: AddWishlistItemData = {
      title: title.trim(),
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
      currency,
      category,
      priority,
    }

    try {
      await onSubmit(data)
      resetForm()
      onClose()
    } catch {
      setError("Failed to add item")
    } finally {
      setIsSubmitting(false)
    }
  }, [title, description, url, imageUrl, price, currency, category, priority, onSubmit, onClose, resetForm])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={handleClose}
          data-testid="add-wishlist-form-overlay"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "w-full max-w-lg rounded-t-[20px] bg-[var(--color-bg-elevated)] px-5 pb-8 pt-4",
              "max-h-[85vh] overflow-y-auto",
              className
            )}
            data-testid="add-wishlist-form"
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-[20px] font-bold text-[var(--color-text-primary)]">
                Add Item
              </h2>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="rounded-full p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)]"
                data-testid="add-wishlist-close"
              >
                <X size={20} />
              </motion.button>
            </div>

            <div className="flex flex-col gap-4">
              {/* URL Input */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)] font-body">
                  Product URL (optional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={handleUrlBlur}
                    placeholder="Paste a link to auto-fill..."
                    className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] px-3 py-2.5 ps-9 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-body focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-glow)]"
                    data-testid="wishlist-url-input"
                  />
                  <LinkIcon size={16} className="absolute start-3 top-3 text-[var(--color-text-muted)]" />
                  {isExtracting && (
                    <Loader2 size={16} className="absolute end-3 top-3 animate-spin text-[var(--color-accent-primary)]" />
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)] font-body">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you want?"
                  className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-body focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-glow)]"
                  data-testid="wishlist-title-input"
                />
              </div>

              {/* Price + Currency */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)] font-body">
                    Price
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-body focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-glow)]"
                    data-testid="wishlist-price-input"
                  />
                </div>
                <div className="w-24">
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)] font-body">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] font-body focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-glow)]"
                    data-testid="wishlist-currency-select"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category chips */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)] font-body">
                  Category
                </label>
                <div className="flex flex-wrap gap-2" data-testid="wishlist-category-chips">
                  {WISHLIST_CATEGORIES.map((cat) => (
                    <motion.button
                      key={cat}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-[12px] font-medium transition-colors",
                        category === cat
                          ? "bg-[var(--color-accent-primary)] text-white"
                          : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                      )}
                      data-testid={`category-${cat}`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Priority radio */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)] font-body">
                  Priority
                </label>
                <div className="flex gap-2" data-testid="wishlist-priority-radio">
                  {WISHLIST_PRIORITIES.map((pri) => (
                    <motion.button
                      key={pri}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPriority(pri)}
                      className={cn(
                        "flex-1 rounded-xl px-3 py-2 text-[12px] font-medium transition-colors",
                        priority === pri
                          ? "bg-[var(--color-accent-primary)] text-white"
                          : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                      )}
                      data-testid={`priority-${pri}`}
                    >
                      {PRIORITY_LABELS[pri]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[var(--color-text-secondary)] font-body">
                  Notes (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Size, color, any details..."
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] font-body focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-glow)]"
                  data-testid="wishlist-description-input"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-[13px] text-[var(--color-error)] font-body" data-testid="wishlist-form-error">
                  {error}
                </p>
              )}

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim()}
                className={cn(
                  "w-full rounded-xl py-3 text-[15px] font-semibold font-body",
                  "bg-[var(--color-accent-primary)] text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                data-testid="wishlist-submit-btn"
              >
                {isSubmitting ? "Adding..." : "Add to Wishlist"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
