"use client"

import { ExternalLink, Star } from "lucide-react"
import type { PortalSection } from "@/lib/types/portal.types"

type RestaurantItem = {
  name: string
  cuisine?: string
  description?: string
  image_url?: string
  price_range?: string
  url?: string
  address?: string
  is_recommended?: boolean
}

type Props = { section: PortalSection }

export function RestaurantsSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const restaurants = (section.content.restaurants as RestaurantItem[]) ?? []

  if (restaurants.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="restaurants-section">
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
        {restaurants.map((r, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border"
            style={{
              borderColor: "var(--portal-border)",
              backgroundColor: "var(--portal-surface)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid={`restaurant-card-${i}`}
          >
            {r.is_recommended && (
              <span
                className="absolute end-3 top-3 z-10 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: "var(--portal-primary)" }}
              >
                Recommended
              </span>
            )}
            {r.image_url && (
              <img src={r.image_url} alt={r.name} className="h-36 w-full object-cover" />
            )}
            <div className="p-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--portal-text)" }}>
                {r.name}
              </h3>
              {(r.cuisine || r.price_range) && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  {[r.cuisine, r.price_range].filter(Boolean).join(" · ")}
                </p>
              )}
              {r.description && (
                <p className="mt-2 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  {r.description}
                </p>
              )}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--portal-primary)" }}
                >
                  Visit
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
