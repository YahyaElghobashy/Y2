"use client"

import { motion } from "framer-motion"
import { ExternalLink, Trash2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { ClaimBadge } from "./ClaimBadge"
import type { WishlistItem, WishlistCategory, WishlistPriority } from "@/lib/types/wishlist.types"

type WishlistItemCardProps = {
  item: WishlistItem
  isOwnList: boolean
  onClaim?: (itemId: string) => void
  onUnclaim?: (itemId: string) => void
  onMarkPurchased?: (itemId: string) => void
  onDelete?: (itemId: string) => void
  onEdit?: (item: WishlistItem) => void
  userId?: string
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

const CATEGORY_EMOJI: Record<WishlistCategory, string> = {
  fashion: "\uD83D\uDC57",
  tech: "\uD83D\uDCBB",
  home: "\uD83C\uDFE0",
  books: "\uD83D\uDCDA",
  beauty: "\u2728",
  food: "\uD83C\uDF74",
  experience: "\uD83C\uDF1F",
  travel: "\u2708\uFE0F",
  other: "\uD83C\uDFF7\uFE0F",
}

const PRIORITY_CONFIG: Record<WishlistPriority, { label: string; className: string }> = {
  must_have: {
    label: "Must Have",
    className: "bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]",
  },
  want: {
    label: "Want",
    className: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  },
  nice_to_have: {
    label: "Nice to Have",
    className: "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]",
  },
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EGP: "EGP",
  USD: "$",
  EUR: "\u20AC",
  SAR: "SAR",
  GBP: "\u00A3",
}

function formatPrice(price: number | null, currency: string): string | null {
  if (price === null || price === undefined) return null
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  return `${symbol} ${Number(price).toLocaleString()}`
}

export function WishlistItemCard({
  item,
  isOwnList,
  onClaim,
  onUnclaim,
  onMarkPurchased,
  onDelete,
  onEdit,
  userId,
  className,
}: WishlistItemCardProps) {
  const priceStr = formatPrice(item.price, item.currency)
  const priorityCfg = PRIORITY_CONFIG[item.priority]
  const categoryEmoji = CATEGORY_EMOJI[item.category]
  const categoryLabel = CATEGORY_LABELS[item.category]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className={cn(
        "relative rounded-2xl bg-[var(--color-bg-elevated)] p-4 border border-[var(--color-border-subtle)]",
        "shadow-[0_2px_12px_rgba(44,40,37,0.06)]",
        item.is_purchased && "opacity-60",
        className
      )}
      data-testid="wishlist-item-card"
    >
      <div className="flex gap-3">
        {/* Image / Emoji fallback */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-secondary)] overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-2xl" role="img" aria-hidden="true">
              {categoryEmoji}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] font-[family-name:var(--font-body)] line-clamp-1">
              {item.title}
            </h3>

            {/* Own list: edit/delete actions */}
            {isOwnList && (
              <div className="flex shrink-0 items-center gap-1">
                {onEdit && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEdit(item)}
                    className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)]"
                    data-testid="wishlist-edit-btn"
                  >
                    <Pencil size={14} />
                  </motion.button>
                )}
                {onDelete && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(item.id)}
                    className="rounded-lg p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                    data-testid="wishlist-delete-btn"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                )}
              </div>
            )}
          </div>

          {item.description && (
            <p className="text-[13px] text-[var(--color-text-secondary)] font-[family-name:var(--font-body)] line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {priceStr && (
              <span
                className="rounded-lg bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent-primary)]"
                data-testid="wishlist-price"
              >
                {priceStr}
              </span>
            )}
            <span className="rounded-lg bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
              {categoryEmoji} {categoryLabel}
            </span>
            <span className={cn("rounded-lg px-2 py-0.5 text-[11px] font-medium", priorityCfg.className)}>
              {priorityCfg.label}
            </span>
          </div>

          {/* URL link + ClaimBadge row */}
          <div className="flex items-center justify-between pt-0.5">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[12px] text-[var(--color-info)] font-[family-name:var(--font-body)]"
                data-testid="wishlist-link"
              >
                <ExternalLink size={12} />
                <span>View link</span>
              </a>
            ) : (
              <div />
            )}

            {/* CRITICAL: No claim badge on own list */}
            {!isOwnList && userId && onClaim && onUnclaim && onMarkPurchased && (
              <ClaimBadge
                item={item}
                userId={userId}
                onClaim={onClaim}
                onUnclaim={onUnclaim}
                onMarkPurchased={onMarkPurchased}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
