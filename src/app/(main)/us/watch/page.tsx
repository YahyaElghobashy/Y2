"use client"

import { useMemo, useState } from "react"
import { PageTransition } from "@/components/animations"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { WatchView, type WatchItem as WatchViewItem } from "@/components/watch/WatchView"
import { AddWatchModal } from "@/components/watch/AddWatchModal"
import { RatingSheet } from "@/components/watch/RatingSheet"
import { useWatchLog } from "@/lib/hooks/use-watch-log"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { WatchItem } from "@/lib/types/watch.types"

/** Collapse the hook's six item types onto the View's two visual kinds. */
function mapKind(itemType: WatchItem["item_type"]): WatchViewItem["kind"] {
  return itemType === "movie" ? "movie" : "show"
}

export default function WatchLogPage() {
  const { partner } = useAuth()
  const {
    watchlist,
    watching,
    watched,
    isLoading,
    error,
    addItem,
    updateStatus,
    submitRating,
    myRating,
    partnerRating,
    searchTMDB,
  } = useWatchLog()

  const [showAddModal, setShowAddModal] = useState(false)
  const [rating, setRating] = useState<{ open: boolean; itemId: string; title: string }>({
    open: false,
    itemId: "",
    title: "",
  })

  const partnerName = partner?.display_name ?? "Yara"

  const openRating = (id: string) => {
    const item = [...watchlist, ...watching, ...watched].find((i) => i.id === id)
    setRating({ open: true, itemId: id, title: item?.title ?? "" })
  }

  const items: WatchViewItem[] = useMemo(() => {
    const all = [...watchlist, ...watching, ...watched]
    return all.map((item) => ({
      id: item.id,
      title: item.title,
      // TODO(wire): WatchView requires a non-null year; hook year can be null → fall back to 0.
      year: item.year ?? 0,
      kind: mapKind(item.item_type),
      status: item.status,
      mine: myRating(item.id)?.score,
      theirs: partnerRating(item.id)?.score,
    }))
  }, [watchlist, watching, watched, myRating, partnerRating])

  if (isLoading) {
    return (
      <PageTransition>
        <LoadingSkeleton variant="card" count={3} />
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <p className="px-5 py-6 text-center text-[14px]" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <WatchView
        items={items}
        partnerName={partnerName}
        onAdd={() => setShowAddModal(true)}
        onRate={openRating}
        onStartWatching={(id) => void updateStatus(id, "watching")}
        onMarkWatched={(id) => void updateStatus(id, "watched")}
      />

      {/* Preserve the working add flow (TMDB search → addItem) behind the redesigned FAB. */}
      <AddWatchModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(data) => {
          addItem(data)
          setShowAddModal(false)
        }}
        onSearch={searchTMDB}
      />

      {/* Rate a watched title — score 1–10 + optional reaction → submitRating. */}
      <RatingSheet
        open={rating.open}
        title={rating.title}
        initialScore={myRating(rating.itemId)?.score}
        onClose={() => setRating((r) => ({ ...r, open: false }))}
        onSubmit={async (score, reaction) => {
          await submitRating(rating.itemId, score, reaction)
          setRating((r) => ({ ...r, open: false }))
        }}
      />
    </PageTransition>
  )
}
