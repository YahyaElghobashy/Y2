import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  generateICS,
  generateMultiICS,
  generateGoogleCalendarUrl,
  downloadICS,
  type ICSEvent,
} from "@/lib/ics-generator"

// ── generateICS Tests ──

describe("generateICS", () => {
  it("generates valid VCALENDAR structure", () => {
    const event: ICSEvent = {
      title: "Wedding Ceremony",
      startDate: "2026-06-15",
    }

    const result = generateICS(event)

    expect(result).toContain("BEGIN:VCALENDAR")
    expect(result).toContain("VERSION:2.0")
    expect(result).toContain("PRODID:-//Y2 System//Event Portal//EN")
    expect(result).toContain("BEGIN:VEVENT")
    expect(result).toContain("SUMMARY:Wedding Ceremony")
    expect(result).toContain("END:VEVENT")
    expect(result).toContain("END:VCALENDAR")
  })

  it("generates all-day event when no time provided", () => {
    const event: ICSEvent = {
      title: "Wedding Day",
      startDate: "2026-06-15",
    }

    const result = generateICS(event)

    expect(result).toContain("DTSTART;VALUE=DATE:20260615")
    expect(result).toContain("DTEND;VALUE=DATE:20260616")
  })

  it("generates timed event with start and end times", () => {
    const event: ICSEvent = {
      title: "Ceremony",
      startDate: "2026-06-15",
      startTime: "15:00",
      endTime: "17:30",
    }

    const result = generateICS(event)

    expect(result).toContain("DTSTART:20260615T150000")
    expect(result).toContain("DTEND:20260615T173000")
    expect(result).not.toContain("VALUE=DATE")
  })

  it("defaults to 1-hour duration when no end time", () => {
    const event: ICSEvent = {
      title: "Reception",
      startDate: "2026-06-15",
      startTime: "18:00",
    }

    const result = generateICS(event)

    expect(result).toContain("DTSTART:20260615T180000")
    expect(result).toContain("DTEND:20260615T190000")
  })

  it("includes description when provided", () => {
    const event: ICSEvent = {
      title: "Event",
      startDate: "2026-06-15",
      description: "Join us for the celebration",
    }

    const result = generateICS(event)

    expect(result).toContain("DESCRIPTION:Join us for the celebration")
  })

  it("includes location when provided", () => {
    const event: ICSEvent = {
      title: "Event",
      startDate: "2026-06-15",
      location: "Grand Hall, Cairo",
    }

    const result = generateICS(event)

    expect(result).toContain("LOCATION:Grand Hall\\, Cairo")
  })

  it("includes URL when provided", () => {
    const event: ICSEvent = {
      title: "Event",
      startDate: "2026-06-15",
      url: "https://example.com/e/our-wedding",
    }

    const result = generateICS(event)

    expect(result).toContain("URL:https://example.com/e/our-wedding")
  })

  it("escapes special characters in text fields", () => {
    const event: ICSEvent = {
      title: "Wedding; John & Jane",
      startDate: "2026-06-15",
      description: "Line 1\nLine 2",
      location: "Hall, Room A; Building B",
    }

    const result = generateICS(event)

    expect(result).toContain("SUMMARY:Wedding\\; John & Jane")
    expect(result).toContain("DESCRIPTION:Line 1\\nLine 2")
    expect(result).toContain("LOCATION:Hall\\, Room A\\; Building B")
  })

  it("generates deterministic UIDs for same input", () => {
    const event: ICSEvent = {
      title: "Wedding",
      startDate: "2026-06-15",
    }

    const result1 = generateICS(event)
    const result2 = generateICS(event)

    const uid1 = result1.match(/UID:(.+)/)?.[1]
    const uid2 = result2.match(/UID:(.+)/)?.[1]

    expect(uid1).toBe(uid2)
    expect(uid1).toContain("@y2-portal")
  })

  it("uses CRLF line endings per RFC 5545", () => {
    const event: ICSEvent = {
      title: "Test",
      startDate: "2026-06-15",
    }

    const result = generateICS(event)

    expect(result).toContain("\r\n")
    // All lines should use CRLF
    const lines = result.split("\r\n")
    expect(lines.length).toBeGreaterThan(5)
  })

  it("omits optional fields when not provided", () => {
    const event: ICSEvent = {
      title: "Minimal Event",
      startDate: "2026-06-15",
    }

    const result = generateICS(event)

    expect(result).not.toContain("DESCRIPTION:")
    expect(result).not.toContain("LOCATION:")
    expect(result).not.toContain("URL:")
  })
})

// ── generateMultiICS Tests ──

describe("generateMultiICS", () => {
  it("generates multiple VEVENTs in one VCALENDAR", () => {
    const events: ICSEvent[] = [
      { title: "Ceremony", startDate: "2026-06-15", startTime: "15:00" },
      { title: "Reception", startDate: "2026-06-15", startTime: "18:00" },
    ]

    const result = generateMultiICS(events)

    // One VCALENDAR wrapper
    expect(result.match(/BEGIN:VCALENDAR/g)?.length).toBe(1)
    expect(result.match(/END:VCALENDAR/g)?.length).toBe(1)

    // Two VEVENTs
    expect(result.match(/BEGIN:VEVENT/g)?.length).toBe(2)
    expect(result.match(/END:VEVENT/g)?.length).toBe(2)

    expect(result).toContain("SUMMARY:Ceremony")
    expect(result).toContain("SUMMARY:Reception")
  })

  it("returns empty string for empty array", () => {
    expect(generateMultiICS([])).toBe("")
  })

  it("handles mix of all-day and timed events", () => {
    const events: ICSEvent[] = [
      { title: "Full Day", startDate: "2026-06-14" },
      { title: "Timed", startDate: "2026-06-15", startTime: "10:00", endTime: "12:00" },
    ]

    const result = generateMultiICS(events)

    expect(result).toContain("DTSTART;VALUE=DATE:20260614")
    expect(result).toContain("DTSTART:20260615T100000")
  })
})

// ── generateGoogleCalendarUrl Tests ──

describe("generateGoogleCalendarUrl", () => {
  it("generates valid Google Calendar URL for timed event", () => {
    const event: ICSEvent = {
      title: "Wedding Ceremony",
      startDate: "2026-06-15",
      startTime: "15:00",
      endTime: "17:00",
      description: "Join us",
      location: "Grand Hall",
    }

    const url = generateGoogleCalendarUrl(event)

    expect(url).toContain("https://calendar.google.com/calendar/render")
    expect(url).toContain("action=TEMPLATE")
    expect(url).toContain("text=Wedding+Ceremony")
    expect(url).toContain("dates=20260615T150000%2F20260615T170000")
    expect(url).toContain("details=Join+us")
    expect(url).toContain("location=Grand+Hall")
  })

  it("generates URL for all-day event", () => {
    const event: ICSEvent = {
      title: "Wedding Day",
      startDate: "2026-06-15",
    }

    const url = generateGoogleCalendarUrl(event)

    expect(url).toContain("dates=20260615%2F20260616")
  })

  it("defaults to 1-hour duration when no end time", () => {
    const event: ICSEvent = {
      title: "Ceremony",
      startDate: "2026-06-15",
      startTime: "15:00",
    }

    const url = generateGoogleCalendarUrl(event)

    expect(url).toContain("dates=20260615T150000%2F20260615T160000")
  })

  it("omits optional params when not provided", () => {
    const event: ICSEvent = {
      title: "Event",
      startDate: "2026-06-15",
    }

    const url = generateGoogleCalendarUrl(event)

    expect(url).not.toContain("details=")
    expect(url).not.toContain("location=")
  })
})

// ── downloadICS Tests ──

describe("downloadICS", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("creates blob URL, triggers download, and cleans up", () => {
    const mockUrl = "blob:http://test/abc"
    const mockCreateObjectURL = vi.fn(() => mockUrl)
    const mockRevokeObjectURL = vi.fn()
    const mockClick = vi.fn()
    const mockAppend = vi.fn()
    const mockRemove = vi.fn()

    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    })

    const mockAnchor = {
      href: "",
      download: "",
      click: mockClick,
    }

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as unknown as HTMLElement)
    vi.spyOn(document.body, "appendChild").mockImplementation(mockAppend)
    vi.spyOn(document.body, "removeChild").mockImplementation(mockRemove)

    downloadICS("BEGIN:VCALENDAR\r\nEND:VCALENDAR", "test.ics")

    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(mockAnchor.href).toBe(mockUrl)
    expect(mockAnchor.download).toBe("test.ics")
    expect(mockClick).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl)
  })

  it("uses default filename when not provided", () => {
    const mockAnchor = { href: "", download: "", click: vi.fn() }
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as unknown as HTMLElement)
    vi.spyOn(document.body, "appendChild").mockImplementation(() => null as unknown as Node)
    vi.spyOn(document.body, "removeChild").mockImplementation(() => null as unknown as Node)
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    })

    downloadICS("content")

    expect(mockAnchor.download).toBe("event.ics")
  })
})
