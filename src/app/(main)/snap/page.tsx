"use client"

import { useMemo, useRef, useEffect, useCallback } from "react"
import { useSnap } from "@/lib/hooks/use-snap"
import { useAuth } from "@/lib/providers/AuthProvider"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { SnapView, type SnapDay } from "@/components/snap/SnapView"
import type { Snap } from "@/lib/types/snap.types"

/**
 * Get today's date in Cairo timezone as YYYY-MM-DD.
 */
function getCairoToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/**
 * Format a snap date into a human-readable string.
 */
function formatSnapDate(dateStr: string): string {
  const today = getCairoToday()
  if (dateStr === today) return "Today"

  // Calculate yesterday in Cairo timezone
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const yesterday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
  if (dateStr === yesterday) return "Yesterday"

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export default function SnapFeedPage() {
  const { user, partner, profile } = useAuth()
  const { snapFeed, isLoading, error, reactToSnap, loadMore, hasMore } =
    useSnap()

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const userName = profile?.display_name ?? "You"
  const partnerName = partner?.display_name ?? "Partner"

  // Group snaps by snap_date → the redesigned SnapView's SnapDay[] shape.
  const days: SnapDay[] = useMemo(() => {
    if (!user) return []
    const map = new Map<string, { mine?: Snap; theirs?: Snap }>()
    for (const snap of snapFeed) {
      const entry = map.get(snap.snap_date) ?? {}
      if (snap.user_id === user.id) entry.mine = snap
      else entry.theirs = snap
      map.set(snap.snap_date, entry)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, { mine, theirs }]) => ({
        label: formatSnapDate(date),
        mine: mine
          ? {
              photo: mine.photo_url ?? "",
              who: userName,
              reaction: mine.reaction_emoji ?? undefined,
              id: mine.id,
              // Own snap → no reaction picker.
              canReact: false,
            }
          : undefined,
        theirs: theirs
          ? {
              photo: theirs.photo_url ?? "",
              who: partnerName,
              reaction: theirs.reaction_emoji ?? undefined,
              id: theirs.id,
              // Partner's snap → I can react to it.
              canReact: true,
            }
          : undefined,
      }))
  }, [snapFeed, user, userName, partnerName])

  // Infinite scroll observer — preserved from the old page.
  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      loadMore()
    }
  }, [hasMore, loadMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleLoadMore])

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Snaps" backHref="/keepsake" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <PageHeader title="Snaps" backHref="/keepsake" />
        <div className="py-12 text-center text-[14px] text-[var(--color-text-secondary)]">
          Something went wrong. Please try again.
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <SnapView days={days} onReact={reactToSnap} />
      {/* Infinite scroll sentinel — kept for the loadMore flow. */}
      <div ref={sentinelRef} data-testid="snap-sentinel" className="h-4" />
    </PageTransition>
  )
}
