"use client"

import { CalendarDays, MapPin, Clock } from "lucide-react"
import { usePortalData } from "@/components/events/public/PortalDataProvider"
import type { PortalSection } from "@/lib/types/portal.types"

type Props = { section: PortalSection }

export function EventCardsSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const layout = (section.content.layout as string) ?? "grid"

  // Pull sub-events from portal context
  // Note: sub-events are not passed via context yet—placeholder for now
  // Will integrate with PortalDataProvider once sub-events are added

  return (
    <div className="mx-auto max-w-3xl px-4" data-testid="event-cards-section">
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
      <div
        className="text-center text-sm"
        style={{ color: "var(--portal-text-muted)" }}
        data-testid="event-cards-placeholder"
      >
        <CalendarDays
          className="mx-auto mb-2 h-8 w-8"
          style={{ color: "var(--portal-primary)" }}
        />
        Event details will appear here
      </div>
    </div>
  )
}
