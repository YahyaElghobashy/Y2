"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Eye, Star, Trash2, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import { WatchRatingReveal } from "./WatchRatingReveal"
import type { WatchItem, WatchRating, WatchStatus } from "@/lib/types/watch.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  series: "Series",
  anime: "Anime",
  documentary: "Doc",
  short: "Short",
  other: "Other",
}

type WatchCardProps = {
  item: WatchItem
  myRating: WatchRating | null
  partnerRating: WatchRating | null
  onUpdateStatus: (itemId: string, status: WatchStatus) => void
  onRemove: (itemId: string) => void
  onRate: (itemId: string) => void
  className?: string
}

export function WatchCard({
  item,
  myRating,
  partnerRating,
  onUpdateStatus,
  onRemove,
  onRate,
  className,
}: WatchCardProps) {
  const [showReveal, setShowReveal] = useState(false)

  return (
    <motion.div
      layout
      data-testid={`watch-card-${item.id}`}
      className={cn(
        "rounded-2xl bg-[var(--bg-elevated,#FFFFFF)] p-4 shadow-sm",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      <div className="flex gap-3">
        {/* Poster */}
        <div className="h-[80px] w-[56px] flex-shrink-0 overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
          {item.poster_url ? (
            <img
              src={item.poster_url}
              alt={item.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
              <Film size={20} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)] line-clamp-1">
              {item.title}
            </h3>
            <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
              {item.year && <span>{item.year}</span>}
              <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[11px] font-medium">
                {TYPE_LABELS[item.item_type] ?? item.item_type}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-2 flex items-center gap-2">
            {item.status === "watchlist" && (
              <motion.button
                data-testid="start-watching-btn"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                onClick={() => onUpdateStatus(item.id, "watching")}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-soft,#E8D5C0)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent-primary,#C4956A)]"
              >
                <Play size={12} />
                Start
              </motion.button>
            )}

            {item.status === "watching" && (
              <motion.button
                data-testid="finished-btn"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                onClick={() => onUpdateStatus(item.id, "watched")}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-soft,#E8D5C0)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent-primary,#C4956A)]"
              >
                <Eye size={12} />
                Finished
              </motion.button>
            )}

            {item.status === "watched" && !myRating && (
              <motion.button
                data-testid="rate-btn"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                onClick={() => onRate(item.id)}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary,#C4956A)] px-3 py-1.5 text-[12px] font-medium text-white"
              >
                <Star size={12} />
                Rate
              </motion.button>
            )}

            {item.status === "watched" && myRating && !item.both_rated && (
              <span className="text-[12px] text-[var(--text-muted)]">
                Waiting for partner...
              </span>
            )}

            {item.status === "watched" && item.both_rated && (
              <motion.button
                data-testid="reveal-btn"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                onClick={() => setShowReveal(!showReveal)}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-soft,#E8D5C0)] px-3 py-1.5 text-[12px] font-medium text-[var(--accent-primary,#C4956A)]"
              >
                <Star size={12} />
                {myRating?.score ?? "?"} / {partnerRating?.score ?? "?"}
              </motion.button>
            )}

            <motion.button
              data-testid="remove-btn"
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              onClick={() => onRemove(item.id)}
              className="ms-auto flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--color-error,#C27070)]"
              aria-label="Remove"
            >
              <Trash2 size={14} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Rating reveal */}
      <AnimatePresence>
        {showReveal && myRating && partnerRating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
              <WatchRatingReveal
                myRating={myRating}
                partnerRating={partnerRating}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
