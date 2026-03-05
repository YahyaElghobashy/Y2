"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Film, TrendingUp } from "lucide-react"
import { useWatchLog } from "@/lib/hooks/use-watch-log"
import { WatchCard } from "@/components/watch/WatchCard"
import { AddWatchModal } from "@/components/watch/AddWatchModal"
import { EmptyState } from "@/components/shared/EmptyState"
import { cn } from "@/lib/utils"
import type { WatchItemType, WatchStatus } from "@/lib/types/watch.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const STATUS_TABS: { label: string; value: WatchStatus }[] = [
  { label: "Watchlist", value: "watchlist" },
  { label: "Watching", value: "watching" },
  { label: "Watched", value: "watched" },
]

const TYPE_FILTERS: { label: string; value: WatchItemType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Movie", value: "movie" },
  { label: "Series", value: "series" },
  { label: "Anime", value: "anime" },
  { label: "Doc", value: "documentary" },
]

export default function WatchLogPage() {
  const {
    watchlist,
    watching,
    watched,
    isLoading,
    error,
    addItem,
    updateStatus,
    removeItem,
    submitRating,
    myRating,
    partnerRating,
    searchTMDB,
    stats,
  } = useWatchLog()

  const [activeTab, setActiveTab] = useState<WatchStatus>("watchlist")
  const [typeFilter, setTypeFilter] = useState<WatchItemType | "all">("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [ratingItemId, setRatingItemId] = useState<string | null>(null)
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingReaction, setRatingReaction] = useState("")

  const activeItems = useMemo(() => {
    const list =
      activeTab === "watchlist"
        ? watchlist
        : activeTab === "watching"
          ? watching
          : watched

    if (typeFilter === "all") return list
    return list.filter((i) => i.item_type === typeFilter)
  }, [activeTab, typeFilter, watchlist, watching, watched])

  const handleRate = (itemId: string) => {
    setRatingItemId(itemId)
    setRatingScore(5)
    setRatingReaction("")
  }

  const handleSubmitRating = async () => {
    if (!ratingItemId) return
    await submitRating(ratingItemId, ratingScore, ratingReaction || undefined)
    setRatingItemId(null)
  }

  if (isLoading) {
    return (
      <div data-testid="watch-loading" className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-[var(--bg-secondary)]"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="watch-error" className="text-center text-[14px] text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div data-testid="watch-log-page" className="flex flex-col gap-4 pb-8">
      {/* Stats bar */}
      {stats.totalWatched > 0 && (
        <div
          data-testid="stats-bar"
          className="flex items-center justify-between rounded-xl bg-[var(--bg-secondary)] px-4 py-2.5"
        >
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <Film size={14} />
            <span>{stats.totalWatched} watched</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
            <TrendingUp size={14} />
            <span>Avg {stats.avgScore}/10</span>
          </div>
          <div className="text-[12px] font-medium text-[var(--accent-primary,#C4956A)]">
            {stats.agreeRate}% agree
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div data-testid="status-tabs" className="flex gap-1 rounded-xl bg-[var(--bg-secondary)] p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            data-testid={`tab-${tab.value}`}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors",
              activeTab === tab.value
                ? "bg-[var(--bg-elevated,#FFFFFF)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Type filter chips */}
      <div data-testid="type-filters" className="flex gap-2 overflow-x-auto">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            data-testid={`filter-${f.value}`}
            onClick={() => setTypeFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
              typeFilter === f.value
                ? "bg-[var(--accent-primary,#C4956A)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Items list */}
      <AnimatePresence mode="popLayout">
        {activeItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {activeItems.map((item) => (
              <WatchCard
                key={item.id}
                item={item}
                myRating={myRating(item.id)}
                partnerRating={partnerRating(item.id)}
                onUpdateStatus={updateStatus}
                onRemove={removeItem}
                onRate={handleRate}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Film size={48} strokeWidth={1.5} />}
            title={
              activeTab === "watchlist"
                ? "Nothing in your watchlist"
                : activeTab === "watching"
                  ? "Not watching anything"
                  : "Haven't watched anything yet"
            }
            subtitle="Add something to get started"
            className="min-h-[200px]"
          />
        )}
      </AnimatePresence>

      {/* Rating bottom sheet */}
      <AnimatePresence>
        {ratingItemId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setRatingItemId(null)}
            />
            <motion.div
              data-testid="rating-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[var(--bg-elevated,#FFFFFF)] px-5 pb-8 pt-4"
            >
              <div className="mb-4 flex justify-center">
                <div className="h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
              </div>

              <h3 className="mb-4 font-display text-[16px] font-semibold text-[var(--text-primary)]">
                Rate this title
              </h3>

              {/* Score slider */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-secondary)]">Score</span>
                  <span className="font-display text-[20px] font-bold text-[var(--accent-primary,#C4956A)]">
                    {ratingScore}
                  </span>
                </div>
                <input
                  data-testid="rating-slider"
                  type="range"
                  min={1}
                  max={10}
                  value={ratingScore}
                  onChange={(e) => setRatingScore(parseInt(e.target.value))}
                  className="w-full accent-[var(--accent-primary,#C4956A)]"
                />
                <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Reaction */}
              <textarea
                data-testid="rating-reaction"
                value={ratingReaction}
                onChange={(e) => setRatingReaction(e.target.value.slice(0, 200))}
                placeholder="Quick reaction... (optional)"
                maxLength={200}
                rows={2}
                className="mb-4 w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-[14px] outline-none"
              />

              <motion.button
                data-testid="submit-rating-btn"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                onClick={handleSubmitRating}
                className="w-full rounded-xl bg-[var(--accent-primary,#C4956A)] py-3 text-[14px] font-medium text-white"
              >
                Submit Rating
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add FAB */}
      <motion.button
        data-testid="add-watch-fab"
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.15, ease: EASE_OUT }}
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 end-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary,#C4956A)] text-white shadow-lg"
        aria-label="Add to watch log"
      >
        <Plus size={22} />
      </motion.button>

      {/* Add modal */}
      <AddWatchModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(data) => {
          addItem(data)
          setShowAddModal(false)
        }}
        onSearch={searchTMDB}
      />
    </div>
  )
}
