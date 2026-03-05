"use client"

import { useMemo, useRef, useEffect, useCallback } from "react"
import { useSnap } from "@/lib/hooks/use-snap"
import { useAuth } from "@/lib/providers/AuthProvider"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { SnapCard } from "@/components/snap/SnapCard"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { Camera } from "lucide-react"
import Link from "next/link"
import type { Snap, ReactionEmoji } from "@/lib/types/snap.types"

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

  // Group snaps by snap_date
  const grouped = useMemo(() => {
    if (!user) return []
    const map = new Map<string, { user?: Snap; partner?: Snap }>()
    for (const snap of snapFeed) {
      const entry = map.get(snap.snap_date) ?? {}
      if (snap.user_id === user.id) entry.user = snap
      else entry.partner = snap
      map.set(snap.snap_date, entry)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [snapFeed, user])

  // Infinite scroll observer
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

  const handleReact = useCallback(
    (snapId: string, emoji: ReactionEmoji | null) => {
      reactToSnap(snapId, emoji)
    },
    [reactToSnap]
  )

  // Determine names for card display
  const userName = profile?.display_name ?? "You"
  const partnerName = partner?.display_name ?? "Partner"
  const userAvatar = profile?.avatar_url ?? null
  const partnerAvatar = partner?.avatar_url ?? null

  return (
    <PageTransition>
      <PageHeader
        title="Snaps"
        rightAction={
          <Link href="/snap/capture" aria-label="Take a snap">
            <Camera
              size={22}
              strokeWidth={1.75}
              className="text-[var(--color-text-secondary)]"
            />
          </Link>
        }
      />

      <div className="px-4 pb-24">
        {isLoading ? (
          <LoadingSkeleton variant="full-page" />
        ) : error ? (
          <div className="py-12 text-center text-[14px] text-[var(--color-text-secondary)]">
            Something went wrong. Please try again.
          </div>
        ) : grouped.length === 0 ? (
          <div data-testid="snap-empty-state">
            <EmptyState
              icon={<Camera size={48} strokeWidth={1.25} />}
              title="No snaps yet"
              subtitle="Take your first snap to start sharing moments"
              actionLabel="Take a Snap"
              actionHref="/snap/capture"
            />
          </div>
        ) : (
          <div data-testid="snap-feed" className="flex flex-col gap-6">
            {grouped.map(([date, { user: userSnap, partner: partnerSnap }]) => (
              <div key={date} data-testid="snap-date-group">
                {/* Date header */}
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-[16px] font-semibold text-[var(--color-text-primary)]">
                  {formatSnapDate(date)}
                </h2>

                {/* Snap cards */}
                {userSnap && partnerSnap ? (
                  // Side-by-side layout
                  <div className="grid grid-cols-2 gap-3">
                    <SnapCard
                      snap={userSnap}
                      authorName={userName}
                      avatarUrl={userAvatar}
                      isOwn
                    />
                    <SnapCard
                      snap={partnerSnap}
                      authorName={partnerName}
                      avatarUrl={partnerAvatar}
                      isOwn={false}
                      onReact={handleReact}
                    />
                  </div>
                ) : (
                  // Single card centered
                  <div className="mx-auto max-w-[200px]">
                    {userSnap && (
                      <SnapCard
                        snap={userSnap}
                        authorName={userName}
                        avatarUrl={userAvatar}
                        isOwn
                      />
                    )}
                    {partnerSnap && (
                      <SnapCard
                        snap={partnerSnap}
                        authorName={partnerName}
                        avatarUrl={partnerAvatar}
                        isOwn={false}
                        onReact={handleReact}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div
              ref={sentinelRef}
              data-testid="snap-sentinel"
              className="h-4"
            />
          </div>
        )}
      </div>
    </PageTransition>
  )
}
