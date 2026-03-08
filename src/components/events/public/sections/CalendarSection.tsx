"use client"

import type { PortalSection } from "@/lib/types/portal.types"
import { usePortalData } from "@/components/events/public/PortalDataProvider"
import { AddToCalendar } from "@/components/events/shared/AddToCalendar"
import type { ICSEvent } from "@/lib/ics-generator"

type Props = { section: PortalSection }

export function CalendarSection({ section }: Props) {
  const heading = (section.content.heading as string) ?? ""
  const description = (section.content.description as string) ?? ""
  const showAddToCal = (section.content.show_add_to_calendar as boolean) ?? true

  const { portal } = usePortalData()

  // Build ICS event from portal data
  const calEvent: ICSEvent = {
    title: portal.title,
    description: portal.subtitle ?? undefined,
    location: portal.location_name ?? undefined,
    startDate: portal.event_date ?? new Date().toISOString().slice(0, 10),
  }

  return (
    <div className="mx-auto max-w-2xl px-4 text-center" data-testid="calendar-section">
      {heading && (
        <h2
          className="mb-3 text-2xl font-semibold"
          style={{
            fontFamily: "var(--portal-font-heading)",
            color: "var(--portal-text)",
          }}
        >
          {heading}
        </h2>
      )}
      {description && (
        <p
          className="mb-6 text-sm"
          style={{ color: "var(--portal-text-muted)" }}
        >
          {description}
        </p>
      )}
      {showAddToCal && (
        <div className="flex flex-wrap items-center justify-center gap-3" data-testid="add-to-calendar-btn">
          <AddToCalendar
            events={calEvent}
            label="Add to Calendar"
            filename={portal.slug ?? "event"}
            portalStyle
          />
        </div>
      )}
    </div>
  )
}
