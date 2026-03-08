"use client"

import dynamic from "next/dynamic"
import { MapPin } from "lucide-react"
import type { PortalSection } from "@/lib/types/portal.types"
import type { PortalMapPin, PinCategory } from "@/lib/types/portal.types"

// Leaflet must be dynamically imported (no SSR)
const PortalMap = dynamic(
  () => import("@/components/events/shared/PortalMap").then((m) => m.PortalMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-64 items-center justify-center rounded-xl border"
        style={{
          borderColor: "var(--portal-border)",
          backgroundColor: "var(--portal-surface)",
          borderRadius: "var(--portal-radius)",
        }}
      >
        <MapPin className="h-6 w-6 animate-pulse" style={{ color: "var(--portal-primary)" }} />
      </div>
    ),
  }
)

type Props = { section: PortalSection }

export function MapSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const pins = (section.content.pins as PortalMapPin[]) ?? []
  const showSidebar = (section.content.show_sidebar as boolean) ?? false
  const height = (section.content.height as string) ?? "20rem"

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="map-section">
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

      {pins.length > 0 ? (
        <PortalMap
          pins={pins}
          portalStyle
          height={height}
          showSidebar={showSidebar}
        />
      ) : (
        <div
          className="flex h-64 items-center justify-center rounded-xl border"
          style={{
            borderColor: "var(--portal-border)",
            backgroundColor: "var(--portal-surface)",
            borderRadius: "var(--portal-radius)",
          }}
          data-testid="map-placeholder"
        >
          <div className="text-center">
            <MapPin
              className="mx-auto mb-2 h-8 w-8"
              style={{ color: "var(--portal-primary)" }}
            />
            <span className="text-sm" style={{ color: "var(--portal-text-muted)" }}>
              Interactive map coming soon
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
