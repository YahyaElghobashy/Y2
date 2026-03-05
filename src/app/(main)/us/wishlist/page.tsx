"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useWishlist } from "@/lib/hooks/use-wishlist"
import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard"
import { AddWishlistItemForm } from "@/components/wishlist/AddWishlistItemForm"
import {
  WISHLIST_CATEGORIES,
  WISHLIST_PRIORITIES,
  type WishlistCategory,
  type WishlistPriority,
} from "@/lib/types/wishlist.types"

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
  nice_to_have: "Nice",
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EGP: "EGP",
  USD: "$",
  EUR: "\u20AC",
  SAR: "SAR",
  GBP: "\u00A3",
}

export default function WishlistPage() {
  const { user, partner } = useAuth()
  const {
    myItems,
    partnerItems,
    myTotal,
    partnerTotal,
    isLoading,
    addItem,
    removeItem,
    updateItem,
    claimItem,
    unclaimItem,
    markPurchased,
    extractUrlMetadata,
  } = useWishlist()

  const [activeTab, setActiveTab] = useState<"mine" | "partner">("mine")
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPurchased, setShowPurchased] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<WishlistCategory | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<WishlistPriority | "all">("all")

  const partnerName = partner?.display_name ?? "Partner"

  // Filtered items
  const activeItems = activeTab === "mine" ? myItems : partnerItems
  const currentTotal = activeTab === "mine" ? myTotal : partnerTotal

  const unpurchasedItems = useMemo(() => {
    let items = activeItems.filter((i) => !i.is_purchased)
    if (categoryFilter !== "all") {
      items = items.filter((i) => i.category === categoryFilter)
    }
    if (priorityFilter !== "all") {
      items = items.filter((i) => i.priority === priorityFilter)
    }
    return items
  }, [activeItems, categoryFilter, priorityFilter])

  const purchasedItems = useMemo(
    () => activeItems.filter((i) => i.is_purchased),
    [activeItems]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" data-testid="wishlist-loading">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-[var(--color-bg-secondary)]"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Tab bar */}
      <div className="flex rounded-xl bg-[var(--color-bg-secondary)] p-1" data-testid="wishlist-tabs">
        <button
          onClick={() => setActiveTab("mine")}
          className={cn(
            "relative flex-1 rounded-lg py-2 text-[13px] font-medium font-[family-name:var(--font-body)] transition-colors",
            activeTab === "mine"
              ? "text-[var(--color-accent-primary)]"
              : "text-[var(--color-text-secondary)]"
          )}
          data-testid="tab-mine"
        >
          My Wishlist
          {activeTab === "mine" && (
            <motion.div
              layoutId="wishlist-tab-bg"
              className="absolute inset-0 rounded-lg bg-[var(--color-bg-elevated)] shadow-sm -z-10"
              transition={{ duration: 0.25, ease: EASE_OUT }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("partner")}
          className={cn(
            "relative flex-1 rounded-lg py-2 text-[13px] font-medium font-[family-name:var(--font-body)] transition-colors",
            activeTab === "partner"
              ? "text-[var(--color-accent-primary)]"
              : "text-[var(--color-text-secondary)]"
          )}
          data-testid="tab-partner"
        >
          {partnerName}&apos;s Wishlist
          {activeTab === "partner" && (
            <motion.div
              layoutId="wishlist-tab-bg"
              className="absolute inset-0 rounded-lg bg-[var(--color-bg-elevated)] shadow-sm -z-10"
              transition={{ duration: 0.25, ease: EASE_OUT }}
            />
          )}
        </button>
      </div>

      {/* Total badge */}
      {currentTotal > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-[var(--color-accent-soft)] px-4 py-2.5" data-testid="wishlist-total">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)] font-[family-name:var(--font-body)]">
            {activeTab === "mine" ? "My total" : `${partnerName}'s total`}
          </span>
          <span className="text-[15px] font-bold text-[var(--color-accent-primary)] font-[family-name:var(--font-body)]">
            {currentTotal.toLocaleString()}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide" data-testid="wishlist-filters">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as WishlistCategory | "all")}
          className="shrink-0 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] font-[family-name:var(--font-body)] focus:outline-none"
          data-testid="category-filter"
        >
          <option value="all">All Categories</option>
          {WISHLIST_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as WishlistPriority | "all")}
          className="shrink-0 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] font-[family-name:var(--font-body)] focus:outline-none"
          data-testid="priority-filter"
        >
          <option value="all">All Priorities</option>
          {WISHLIST_PRIORITIES.map((pri) => (
            <option key={pri} value={pri}>
              {PRIORITY_LABELS[pri]}
            </option>
          ))}
        </select>
      </div>

      {/* Items list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === "mine" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === "mine" ? 20 : -20 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="flex flex-col gap-3"
        >
          {unpurchasedItems.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center" data-testid="wishlist-empty">
              <span className="text-4xl">
                {activeTab === "mine" ? "\uD83C\uDF81" : "\uD83D\uDC9D"}
              </span>
              <p className="text-[14px] text-[var(--color-text-secondary)] font-[family-name:var(--font-body)]">
                {activeTab === "mine"
                  ? "Your wishlist is empty. Add something!"
                  : `${partnerName} hasn't added anything yet.`}
              </p>
            </div>
          )}

          {unpurchasedItems.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              isOwnList={activeTab === "mine"}
              onClaim={claimItem}
              onUnclaim={unclaimItem}
              onMarkPurchased={markPurchased}
              onDelete={activeTab === "mine" ? removeItem : undefined}
              userId={user?.id}
            />
          ))}

          {/* Purchased section */}
          {purchasedItems.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowPurchased(!showPurchased)}
                className="flex w-full items-center justify-between rounded-xl bg-[var(--color-bg-secondary)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-text-secondary)] font-[family-name:var(--font-body)]"
                data-testid="purchased-toggle"
              >
                <span>Purchased ({purchasedItems.length})</span>
                {showPurchased ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <AnimatePresence>
                {showPurchased && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className="flex flex-col gap-3 overflow-hidden pt-3"
                  >
                    {purchasedItems.map((item) => (
                      <WishlistItemCard
                        key={item.id}
                        item={item}
                        isOwnList={activeTab === "mine"}
                        userId={user?.id}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* FAB — only on my list */}
      {activeTab === "mine" && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-24 end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-primary)] text-white shadow-lg"
          data-testid="wishlist-add-fab"
        >
          <Plus size={24} />
        </motion.button>
      )}

      {/* Add item form */}
      <AddWishlistItemForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={addItem}
        extractUrlMetadata={extractUrlMetadata}
      />
    </div>
  )
}
