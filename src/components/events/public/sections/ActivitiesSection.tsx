"use client"

import { Clock, ExternalLink } from "lucide-react"
import type { PortalSection } from "@/lib/types/portal.types"

type ActivityItem = {
  name: string
  description?: string
  image_url?: string
  duration?: string
  price?: string
  url?: string
}

type Props = { section: PortalSection }

export function ActivitiesSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const activities = (section.content.activities as ActivityItem[]) ?? []

  if (activities.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="activities-section">
      {heading && (
        <h2
          className="mb-6 text-center text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {activities.map((a, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border"
            style={{
              borderColor: "var(--portal-border)",
              backgroundColor: "var(--portal-surface)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid={`activity-card-${i}`}
          >
            {a.image_url && (
              <img src={a.image_url} alt={a.name} className="h-36 w-full object-cover" />
            )}
            <div className="p-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--portal-text)" }}>
                {a.name}
              </h3>
              {a.description && (
                <p className="mt-1 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  {a.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                {a.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {a.duration}
                  </span>
                )}
                {a.price && <span>{a.price}</span>}
              </div>
              {a.url && (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--portal-primary)" }}
                >
                  Learn More
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
