"use client"

import { Phone, MapPin, Star } from "lucide-react"
import type { PortalSection } from "@/lib/types/portal.types"

type BeautyItem = {
  name: string
  type: string
  description?: string
  url?: string
  phone?: string
  address?: string
  is_recommended?: boolean
}

type Props = { section: PortalSection }

const TYPE_LABELS: Record<string, string> = {
  salon: "Salon",
  spa: "Spa",
  barber: "Barber",
  makeup: "Makeup",
  other: "Service",
}

export function BeautySection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const services = (section.content.services as BeautyItem[]) ?? []

  if (services.length === 0) return null

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="beauty-section">
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

      <div className="space-y-3">
        {services.map((svc, i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-xl border p-4"
            style={{
              borderColor: "var(--portal-border)",
              backgroundColor: "var(--portal-surface)",
              borderRadius: "var(--portal-radius)",
            }}
            data-testid={`beauty-card-${i}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--portal-text)" }}>
                  {svc.name}
                </h3>
                {svc.is_recommended && (
                  <Star className="h-3 w-3 fill-current" style={{ color: "var(--portal-primary)" }} />
                )}
              </div>
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--portal-primary)" }}
              >
                {TYPE_LABELS[svc.type] ?? svc.type}
              </span>
              {svc.description && (
                <p className="mt-1 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                  {svc.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--portal-text-muted)" }}>
                {svc.phone && (
                  <a href={`tel:${svc.phone}`} className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {svc.phone}
                  </a>
                )}
                {svc.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {svc.address}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
