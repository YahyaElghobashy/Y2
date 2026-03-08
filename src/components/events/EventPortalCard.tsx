"use client"

import Link from "next/link"
import {
  Globe,
  EyeOff,
  Calendar,
  Users,
  Eye,
  MoreVertical,
} from "lucide-react"
import type { EventPortal } from "@/lib/types/portal.types"

type Props = {
  portal: EventPortal
  rsvpCount?: number
  viewCount?: number
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  engagement: "Engagement",
  wedding: "Wedding",
  birthday: "Birthday",
  anniversary: "Anniversary",
  gathering: "Gathering",
  custom: "Custom Event",
}

export function EventPortalCard({ portal, rsvpCount = 0, viewCount = 0 }: Props) {
  const shareUrl = `/e/${portal.slug}`

  return (
    <Link
      href={`/us/events/${portal.id}`}
      className="block rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
      data-testid={`portal-card-${portal.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-base font-semibold"
            data-testid={`portal-title-${portal.id}`}
          >
            {portal.title}
          </h3>
          <p
            className="mt-0.5 text-xs text-muted-foreground"
            data-testid={`portal-type-${portal.id}`}
          >
            {EVENT_TYPE_LABELS[portal.event_type] ?? portal.event_type}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={`ms-2 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            portal.is_published
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
          data-testid={`portal-status-${portal.id}`}
        >
          {portal.is_published ? (
            <>
              <Globe className="h-3 w-3" />
              Live
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3" />
              Draft
            </>
          )}
        </span>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        {portal.event_date && (
          <span className="inline-flex items-center gap-1" data-testid={`portal-date-${portal.id}`}>
            <Calendar className="h-3.5 w-3.5" />
            {new Date(portal.event_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}

        <span className="inline-flex items-center gap-1" data-testid={`portal-rsvps-${portal.id}`}>
          <Users className="h-3.5 w-3.5" />
          {rsvpCount} RSVPs
        </span>

        <span className="inline-flex items-center gap-1" data-testid={`portal-views-${portal.id}`}>
          <Eye className="h-3.5 w-3.5" />
          {viewCount}
        </span>
      </div>

      {/* Slug / URL */}
      <p
        className="mt-2 truncate text-xs text-muted-foreground/60"
        data-testid={`portal-slug-${portal.id}`}
      >
        {shareUrl}
      </p>
    </Link>
  )
}
