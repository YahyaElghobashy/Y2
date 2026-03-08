"use client"

import { useState, useCallback } from "react"
import { CalendarDays, Download, ExternalLink, ChevronDown } from "lucide-react"
import {
  generateICS,
  generateMultiICS,
  generateGoogleCalendarUrl,
  downloadICS,
  type ICSEvent,
} from "@/lib/ics-generator"

type Props = {
  /** Single event or multiple events */
  events: ICSEvent | ICSEvent[]
  /** Label for the main button */
  label?: string
  /** Filename for .ics download (without extension) */
  filename?: string
  /** Use portal CSS variables (true) or Y2 design tokens (false) */
  portalStyle?: boolean
}

/**
 * AddToCalendar — dropdown with .ics download + Google Calendar link.
 * Works for both single events and multi-event portals.
 */
export function AddToCalendar({
  events,
  label = "Add to Calendar",
  filename = "event",
  portalStyle = false,
}: Props) {
  const [open, setOpen] = useState(false)

  const eventList = Array.isArray(events) ? events : [events]
  const firstEvent = eventList[0]

  const handleDownloadICS = useCallback(() => {
    const content =
      eventList.length === 1
        ? generateICS(eventList[0])
        : generateMultiICS(eventList)

    downloadICS(content, `${filename}.ics`)
    setOpen(false)
  }, [eventList, filename])

  const handleGoogleCalendar = useCallback(() => {
    if (!firstEvent) return
    const url = generateGoogleCalendarUrl(firstEvent)
    window.open(url, "_blank", "noopener,noreferrer")
    setOpen(false)
  }, [firstEvent])

  if (eventList.length === 0) return null

  // Style objects based on context (portal vs Y2)
  const btnStyle = portalStyle
    ? {
        borderColor: "var(--portal-border)",
        color: "var(--portal-text)",
        borderRadius: "var(--portal-radius)",
        backgroundColor: "var(--portal-surface)",
      }
    : {}

  const dropdownStyle = portalStyle
    ? {
        borderColor: "var(--portal-border)",
        backgroundColor: "var(--portal-surface)",
        color: "var(--portal-text)",
        borderRadius: "var(--portal-radius)",
      }
    : {}

  const iconStyle = portalStyle
    ? { color: "var(--portal-primary)" }
    : {}

  return (
    <div className="relative inline-block" data-testid="add-to-calendar">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
        style={btnStyle}
        data-testid="add-to-calendar-trigger"
      >
        <CalendarDays className="h-4 w-4" style={iconStyle} />
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          style={iconStyle}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            data-testid="add-to-calendar-backdrop"
          />

          {/* Dropdown */}
          <div
            className="absolute start-0 top-full z-50 mt-1 w-56 overflow-hidden border shadow-lg"
            style={dropdownStyle}
            data-testid="add-to-calendar-dropdown"
          >
            <button
              type="button"
              onClick={handleDownloadICS}
              className="flex w-full items-center gap-3 px-4 py-3 text-start text-sm transition-opacity hover:opacity-70"
              data-testid="add-to-calendar-ics"
            >
              <Download className="h-4 w-4 shrink-0" style={iconStyle} />
              <div>
                <div className="font-medium">Download .ics</div>
                <div className="text-xs opacity-60">Apple Calendar, Outlook</div>
              </div>
            </button>

            <div className="mx-4 border-t" style={portalStyle ? { borderColor: "var(--portal-border)" } : {}} />

            <button
              type="button"
              onClick={handleGoogleCalendar}
              className="flex w-full items-center gap-3 px-4 py-3 text-start text-sm transition-opacity hover:opacity-70"
              data-testid="add-to-calendar-google"
            >
              <ExternalLink className="h-4 w-4 shrink-0" style={iconStyle} />
              <div>
                <div className="font-medium">Google Calendar</div>
                <div className="text-xs opacity-60">Opens in new tab</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
