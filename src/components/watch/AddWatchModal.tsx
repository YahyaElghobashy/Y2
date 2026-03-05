"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Film, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TMDBResult, WatchItemType, AddWatchItemInput } from "@/lib/types/watch.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const TYPE_OPTIONS: { value: WatchItemType; label: string }[] = [
  { value: "movie", label: "Movie" },
  { value: "series", label: "Series" },
  { value: "anime", label: "Anime" },
  { value: "documentary", label: "Documentary" },
  { value: "short", label: "Short" },
  { value: "other", label: "Other" },
]

type AddWatchModalProps = {
  open: boolean
  onClose: () => void
  onAdd: (data: AddWatchItemInput) => void
  onSearch: (query: string) => Promise<TMDBResult[]>
}

export function AddWatchModal({
  open,
  onClose,
  onAdd,
  onSearch,
}: AddWatchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<TMDBResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualTitle, setManualTitle] = useState("")
  const [manualType, setManualType] = useState<WatchItemType>("movie")
  const [manualYear, setManualYear] = useState("")

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      setShowManual(false)

      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (value.trim().length < 2) {
        setResults([])
        return
      }

      debounceRef.current = setTimeout(async () => {
        setIsSearching(true)
        const res = await onSearch(value.trim())
        setResults(res)
        setIsSearching(false)
      }, 400)
    },
    [onSearch]
  )

  const handleSelectTMDB = (result: TMDBResult) => {
    onAdd({
      title: result.title,
      item_type: result.media_type === "tv" ? "series" : "movie",
      poster_url: result.poster_path,
      year: result.release_date ? parseInt(result.release_date.slice(0, 4)) : undefined,
      tmdb_id: result.id,
    })
    handleReset()
  }

  const handleManualAdd = () => {
    if (!manualTitle.trim()) return
    onAdd({
      title: manualTitle.trim(),
      item_type: manualType,
      year: manualYear ? parseInt(manualYear) : undefined,
    })
    handleReset()
  }

  const handleReset = () => {
    setQuery("")
    setResults([])
    setShowManual(false)
    setManualTitle("")
    setManualType("movie")
    setManualYear("")
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        data-testid="add-watch-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40"
        onClick={handleReset}
      />
      <motion.div
        data-testid="add-watch-modal"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[var(--bg-elevated,#FFFFFF)] pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-[var(--border-subtle)]" />
        </div>

        <div className="px-5">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[18px] font-semibold text-[var(--text-primary)]">
              Add to Watch Log
            </h2>
            <button
              data-testid="close-modal-btn"
              onClick={handleReset}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              data-testid="tmdb-search-input"
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search movies & shows..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-2.5 ps-10 pe-3 text-[14px] outline-none focus:border-[var(--accent-primary)]"
              autoFocus
            />
          </div>

          {/* Loading */}
          {isSearching && (
            <div data-testid="search-loading" className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
            </div>
          )}

          {/* TMDB Results */}
          {results.length > 0 && (
            <div data-testid="tmdb-results" className="flex flex-col gap-2 mb-4">
              {results.map((r) => (
                <motion.button
                  key={r.id}
                  data-testid={`tmdb-result-${r.id}`}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15, ease: EASE_OUT }}
                  onClick={() => handleSelectTMDB(r)}
                  className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] p-3 text-start"
                >
                  <div className="h-[60px] w-[42px] flex-shrink-0 overflow-hidden rounded-lg bg-[var(--bg-primary)]">
                    {r.poster_path ? (
                      <img
                        src={r.poster_path}
                        alt={r.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                        <Film size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] line-clamp-1">
                      {r.title}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)]">
                      {r.release_date?.slice(0, 4) ?? "—"} · {r.media_type === "tv" ? "Series" : "Movie"}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* No results + manual add toggle */}
          {query.trim().length >= 2 && !isSearching && results.length === 0 && (
            <p className="mb-3 text-center text-[13px] text-[var(--text-muted)]">
              No results found
            </p>
          )}

          {/* Manual add toggle */}
          <button
            data-testid="manual-add-toggle"
            onClick={() => setShowManual(!showManual)}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] py-3 text-[13px] font-medium text-[var(--text-secondary)]"
          >
            <Plus size={14} />
            Add manually
          </button>

          {/* Manual form */}
          <AnimatePresence>
            {showManual && (
              <motion.div
                data-testid="manual-add-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 pb-4">
                  <input
                    data-testid="manual-title-input"
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Title"
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-[14px] outline-none"
                  />
                  <div className="flex gap-2">
                    <select
                      data-testid="manual-type-select"
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value as WatchItemType)}
                      className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-[14px] outline-none"
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      data-testid="manual-year-input"
                      type="number"
                      value={manualYear}
                      onChange={(e) => setManualYear(e.target.value)}
                      placeholder="Year"
                      className="w-20 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-[14px] outline-none"
                    />
                  </div>
                  <motion.button
                    data-testid="manual-add-btn"
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15, ease: EASE_OUT }}
                    onClick={handleManualAdd}
                    disabled={!manualTitle.trim()}
                    className="rounded-xl bg-[var(--accent-primary,#C4956A)] py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
                  >
                    Add to Watchlist
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
