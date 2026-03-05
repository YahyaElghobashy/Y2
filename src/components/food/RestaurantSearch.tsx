"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, Pencil, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export type NominatimResult = {
  place_id: number
  osm_id: number
  osm_type: string
  display_name: string
  lat: string
  lon: string
  name?: string
  address?: {
    road?: string
    city?: string
    state?: string
    country?: string
    [key: string]: string | undefined
  }
}

type RestaurantSearchProps = {
  onSelect: (data: {
    placeName: string
    placeId: string | null
    lat: number | null
    lng: number | null
  }) => void
  userLat?: number | null
  userLng?: number | null
}

export function RestaurantSearch({
  onSelect,
  userLat,
  userLng,
}: RestaurantSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isManual, setIsManual] = useState(false)
  const [manualName, setManualName] = useState("")

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const searchNominatim = useCallback(
    async (q: string) => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams({
          q,
          format: "json",
          addressdetails: "1",
          limit: "5",
        })

        // Bias results near user's location if available
        if (userLat && userLng) {
          const delta = 0.1 // ~11km box
          params.set(
            "viewbox",
            `${userLng - delta},${userLat + delta},${userLng + delta},${userLat - delta}`
          )
          params.set("bounded", "0")
        }

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            headers: {
              "User-Agent": "Y2-FoodJournal/1.0",
              Accept: "application/json",
            },
          }
        )

        if (!res.ok) {
          setResults([])
          return
        }

        const data: NominatimResult[] = await res.json()
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [userLat, userLng]
  )

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)

      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (value.trim().length < 2) {
        setResults([])
        return
      }

      // Nominatim rate limit: 1 req/sec — use 500ms debounce
      debounceRef.current = setTimeout(() => {
        searchNominatim(value.trim())
      }, 500)
    },
    [searchNominatim]
  )

  const handleSelectResult = (result: NominatimResult) => {
    onSelect({
      placeName: result.name || result.display_name.split(",")[0],
      placeId: `${result.osm_type}/${result.osm_id}`,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    })
  }

  const handleManualSubmit = () => {
    if (!manualName.trim()) return
    onSelect({
      placeName: manualName.trim(),
      placeId: null,
      lat: userLat ?? null,
      lng: userLng ?? null,
    })
  }

  const formatAddress = (result: NominatimResult): string => {
    if (!result.address) return result.display_name
    const parts = [
      result.address.road,
      result.address.city || result.address.state,
      result.address.country,
    ].filter(Boolean)
    return parts.join(", ") || result.display_name
  }

  return (
    <div data-testid="restaurant-search" className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          data-testid="search-mode-btn"
          onClick={() => {
            setIsManual(false)
            setManualName("")
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-medium transition-colors",
            !isManual
              ? "bg-[var(--accent-primary,#C4956A)] text-white"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
          )}
        >
          <Search size={14} />
          Search
        </button>
        <button
          data-testid="manual-mode-btn"
          onClick={() => {
            setIsManual(true)
            setQuery("")
            setResults([])
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-medium transition-colors",
            isManual
              ? "bg-[var(--accent-primary,#C4956A)] text-white"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
          )}
        >
          <Pencil size={14} />
          Manual
        </button>
      </div>

      {isManual ? (
        /* Manual mode */
        <div data-testid="manual-input-section" className="flex flex-col gap-3">
          <input
            data-testid="manual-name-input"
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Restaurant name"
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--accent-primary)]"
            autoFocus
          />
          <motion.button
            data-testid="manual-confirm-btn"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            onClick={handleManualSubmit}
            disabled={!manualName.trim()}
            className="rounded-xl bg-[var(--accent-primary,#C4956A)] py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
          >
            Confirm
          </motion.button>
        </div>
      ) : (
        /* Search mode */
        <>
          <div className="relative">
            <Search
              size={16}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              data-testid="search-input"
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-2.5 ps-10 pe-3 text-[14px] outline-none focus:border-[var(--accent-primary)]"
              autoFocus
            />
          </div>

          {/* Loading */}
          {isSearching && (
            <div data-testid="search-loading" className="flex justify-center py-3">
              <Loader2 size={20} className="animate-spin text-[var(--accent-primary,#C4956A)]" />
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                data-testid="search-results"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="flex flex-col gap-1.5"
              >
                {results.map((r) => (
                  <button
                    key={r.place_id}
                    data-testid={`result-${r.place_id}`}
                    onClick={() => handleSelectResult(r)}
                    className="flex items-start gap-3 rounded-xl bg-[var(--bg-secondary)] p-3 text-start transition-colors active:bg-[var(--bg-primary)]"
                  >
                    <MapPin
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-[var(--accent-primary,#C4956A)]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)] line-clamp-1">
                        {r.name || r.display_name.split(",")[0]}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                        {formatAddress(r)}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* No results */}
          {query.trim().length >= 2 && !isSearching && results.length === 0 && (
            <p
              data-testid="no-results"
              className="text-center text-[12px] text-[var(--text-muted)] py-2"
            >
              No places found. Try manual entry.
            </p>
          )}
        </>
      )}
    </div>
  )
}
