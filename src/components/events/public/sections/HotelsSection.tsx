"use client"

import { Star, ExternalLink, MapPin } from "lucide-react"
import type { PortalSection } from "@/lib/types/portal.types"

type HotelItem = {
  name: string
  description?: string
  image_url?: string
  rating?: number
  price_range?: string
  booking_url?: string
  address?: string
  distance_from_venue?: string
  is_recommended?: boolean
}

type Props = { section: PortalSection }

export function HotelsSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const hotels = (section.content.hotels as HotelItem[]) ?? []

  if (hotels.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="hotels-section">
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
        {hotels.map((hotel, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border"
            style={{
              borderColor: "var(--portal-border)",
              backgroundColor: "var(--portal-surface)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid={`hotel-card-${i}`}
          >
            {hotel.is_recommended && (
              <span
                className="absolute end-3 top-3 z-10 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: "var(--portal-primary)" }}
              >
                Recommended
              </span>
            )}
            {hotel.image_url && (
              <img
                src={hotel.image_url}
                alt={hotel.name}
                className="h-36 w-full object-cover"
              />
            )}
            <div className="p-4">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--portal-text)" }}
              >
                {hotel.name}
              </h3>
              {hotel.rating && (
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" style={{ color: "var(--portal-primary)" }} />
                  <span className="text-xs" style={{ color: "var(--portal-text-muted)" }}>
                    {hotel.rating}
                  </span>
                </div>
              )}
              {hotel.description && (
                <p className="mt-2 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  {hotel.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {hotel.price_range && (
                  <span style={{ color: "var(--portal-text-muted)" }}>
                    {hotel.price_range}
                  </span>
                )}
                {hotel.distance_from_venue && (
                  <span className="flex items-center gap-1" style={{ color: "var(--portal-text-muted)" }}>
                    <MapPin className="h-3 w-3" />
                    {hotel.distance_from_venue}
                  </span>
                )}
              </div>
              {hotel.booking_url && (
                <a
                  href={hotel.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--portal-primary)" }}
                >
                  Book Now
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
