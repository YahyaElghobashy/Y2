"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { MediaImage } from "@/components/shared/MediaImage"
import { Avatar } from "@/components/shared/Avatar"
import { SnapReaction } from "./SnapReaction"
import { cn } from "@/lib/utils"
import type { Snap, ReactionEmoji } from "@/lib/types/snap.types"
import { SNAP_WINDOW_SECONDS } from "@/lib/types/snap.types"
import { Camera } from "lucide-react"

type SnapCardProps = {
  snap: Snap
  authorName: string
  avatarUrl?: string | null
  isOwn: boolean
  onReact?: (snapId: string, emoji: ReactionEmoji | null) => void
  className?: string
}

/**
 * Format a timestamp into a relative time string.
 */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return "Just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return "1d ago"
  return `${diffDay}d ago`
}

export function SnapCard({
  snap,
  authorName,
  avatarUrl,
  isOwn,
  onReact,
  className,
}: SnapCardProps) {
  const isLate = useMemo(() => {
    if (!snap.window_opened_at) return false
    const createdMs = new Date(snap.created_at).getTime()
    const windowMs = new Date(snap.window_opened_at).getTime()
    return createdMs - windowMs > SNAP_WINDOW_SECONDS * 1000
  }, [snap.created_at, snap.window_opened_at])

  const relativeTime = useMemo(
    () => formatRelativeTime(snap.created_at),
    [snap.created_at]
  )

  return (
    <motion.div
      data-testid="snap-card"
      className={cn("flex flex-col", className)}
      initial={{ scale: 0.95, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--color-bg-secondary)]">
        {snap.photo_url ? (
          <>
            <MediaImage
              fallbackUrl={snap.photo_url}
              alt={`${authorName}'s snap`}
              fill
              objectFit="cover"
            />
            {/* Soft inner shadow at top */}
            <div
              className="absolute inset-x-0 top-0 h-12 z-[5] pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08), transparent)" }}
              aria-hidden="true"
            />
          </>
        ) : (
          <div
            data-testid="snap-no-photo"
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]"
          >
            <Camera size={32} strokeWidth={1.5} />
            <span className="text-[13px]">No snap</span>
          </div>
        )}

        {/* Avatar overlay */}
        <div className="absolute start-2 top-2 z-10">
          <Avatar
            src={avatarUrl}
            name={authorName}
            size="md"
            className="border-2 border-white shadow-sm"
          />
        </div>

        {/* Late badge */}
        {isLate && (
          <div
            data-testid="snap-late-badge"
            className="absolute end-2 top-2 z-10 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white"
          >
            Late
          </div>
        )}

        {/* Bottom overlay with gradient scrim */}
        {(snap.caption || snap.photo_url) && (
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/50 to-transparent px-3 pb-2.5 pt-8">
            {snap.caption && (
              <p
                data-testid="snap-caption"
                className="line-clamp-2 text-[14px] leading-tight text-white"
              >
                {snap.caption}
              </p>
            )}
            <span className="mt-0.5 block text-end text-[11px] text-white/70">
              {relativeTime}
            </span>
          </div>
        )}

        {/* Reaction overlay — only for partner's snaps */}
        {!isOwn && onReact && (
          <div className="absolute bottom-2 end-2 z-20">
            <SnapReaction
              snapId={snap.id}
              currentReaction={snap.reaction_emoji}
              onReact={onReact}
              className="backdrop-blur-sm rounded-full bg-black/30 px-1.5 py-0.5"
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
