/**
 * .ics (iCalendar) file generator for event portal sub-events.
 * Generates RFC 5545-compliant VCALENDAR content.
 */

export type ICSEvent = {
  title: string
  description?: string
  location?: string
  startDate: string // ISO date string (YYYY-MM-DD)
  startTime?: string // HH:mm (24h)
  endTime?: string // HH:mm (24h)
  url?: string
}

/**
 * Escape special iCalendar text characters
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

/**
 * Format a date + optional time into iCalendar DATE or DATE-TIME format.
 * Uses local time (no timezone / TZID — keeps it simple and broadly compatible).
 */
function formatICSDate(date: string, time?: string): string {
  const d = date.replace(/-/g, "")
  if (!time) return d // All-day event: YYYYMMDD
  const t = time.replace(/:/g, "")
  return `${d}T${t}00` // YYYYMMDDTHHMMSS
}

/**
 * Generate a deterministic UID for an event to avoid duplicates.
 */
function generateUID(title: string, date: string): string {
  const hash = Array.from(`${title}-${date}`)
    .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    .toString(36)
    .replace("-", "n")
  return `${hash}@y2-portal`
}

/**
 * Generate an iCalendar (.ics) string for a single event.
 */
export function generateICS(event: ICSEvent): string {
  const uid = generateUID(event.title, event.startDate)
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")

  const dtStart = formatICSDate(event.startDate, event.startTime)
  const isAllDay = !event.startTime

  // For all-day events, DTEND is the next day
  let dtEnd: string
  if (isAllDay) {
    const d = new Date(event.startDate)
    d.setDate(d.getDate() + 1)
    dtEnd = d.toISOString().slice(0, 10).replace(/-/g, "")
  } else if (event.endTime) {
    dtEnd = formatICSDate(event.startDate, event.endTime)
  } else {
    // Default: 1 hour after start
    const [h, m] = (event.startTime ?? "00:00").split(":").map(Number)
    const endH = String(h + 1).padStart(2, "0")
    const endM = String(m).padStart(2, "0")
    dtEnd = formatICSDate(event.startDate, `${endH}:${endM}`)
  }

  const valueParam = isAllDay ? ";VALUE=DATE" : ""

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Y2 System//Event Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART${valueParam}:${dtStart}`,
    `DTEND${valueParam}:${dtEnd}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ]

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`)
  }
  if (event.url) {
    lines.push(`URL:${event.url}`)
  }

  lines.push("END:VEVENT", "END:VCALENDAR")

  return lines.join("\r\n")
}

/**
 * Generate .ics content for multiple events in a single calendar file.
 */
export function generateMultiICS(events: ICSEvent[]): string {
  if (events.length === 0) return ""

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")

  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Y2 System//Event Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  const vevents = events.map((event) => {
    const uid = generateUID(event.title, event.startDate)
    const dtStart = formatICSDate(event.startDate, event.startTime)
    const isAllDay = !event.startTime

    let dtEnd: string
    if (isAllDay) {
      const d = new Date(event.startDate)
      d.setDate(d.getDate() + 1)
      dtEnd = d.toISOString().slice(0, 10).replace(/-/g, "")
    } else if (event.endTime) {
      dtEnd = formatICSDate(event.startDate, event.endTime)
    } else {
      const [h, m] = (event.startTime ?? "00:00").split(":").map(Number)
      dtEnd = formatICSDate(event.startDate, `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    }

    const valueParam = isAllDay ? ";VALUE=DATE" : ""

    const lines = [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART${valueParam}:${dtStart}`,
      `DTEND${valueParam}:${dtEnd}`,
      `SUMMARY:${escapeICS(event.title)}`,
    ]

    if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
    if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`)
    if (event.url) lines.push(`URL:${event.url}`)
    lines.push("END:VEVENT")

    return lines.join("\r\n")
  })

  return [...header, ...vevents, "END:VCALENDAR"].join("\r\n")
}

/**
 * Generate a Google Calendar "Add to Calendar" URL for an event.
 */
export function generateGoogleCalendarUrl(event: ICSEvent): string {
  const params = new URLSearchParams()
  params.set("action", "TEMPLATE")
  params.set("text", event.title)

  if (event.startTime) {
    const start = `${event.startDate.replace(/-/g, "")}T${event.startTime.replace(/:/g, "")}00`
    let end: string
    if (event.endTime) {
      end = `${event.startDate.replace(/-/g, "")}T${event.endTime.replace(/:/g, "")}00`
    } else {
      const [h, m] = event.startTime.split(":").map(Number)
      end = `${event.startDate.replace(/-/g, "")}T${String(h + 1).padStart(2, "0")}${String(m).padStart(2, "0")}00`
    }
    params.set("dates", `${start}/${end}`)
  } else {
    // All-day event
    const d = event.startDate.replace(/-/g, "")
    const next = new Date(event.startDate)
    next.setDate(next.getDate() + 1)
    const nextD = next.toISOString().slice(0, 10).replace(/-/g, "")
    params.set("dates", `${d}/${nextD}`)
  }

  if (event.description) params.set("details", event.description)
  if (event.location) params.set("location", event.location)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Trigger a download of an .ics file in the browser.
 */
export function downloadICS(content: string, filename = "event.ics"): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
