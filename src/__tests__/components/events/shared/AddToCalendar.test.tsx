import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Mocks ──

const mockDownloadICS = vi.fn()
const mockGenerateICS = vi.fn(() => "VCALENDAR_SINGLE")
const mockGenerateMultiICS = vi.fn(() => "VCALENDAR_MULTI")
const mockGenerateGoogleCalendarUrl = vi.fn(() => "https://calendar.google.com/test")

vi.mock("@/lib/ics-generator", () => ({
  generateICS: (...args: unknown[]) => mockGenerateICS(...args),
  generateMultiICS: (...args: unknown[]) => mockGenerateMultiICS(...args),
  generateGoogleCalendarUrl: (...args: unknown[]) => mockGenerateGoogleCalendarUrl(...args),
  downloadICS: (...args: unknown[]) => mockDownloadICS(...args),
}))

// ── Imports ──

import { AddToCalendar } from "@/components/events/shared/AddToCalendar"
import type { ICSEvent } from "@/lib/ics-generator"

// ── Test Data ──

const singleEvent: ICSEvent = {
  title: "Wedding Ceremony",
  startDate: "2026-06-15",
  startTime: "15:00",
  endTime: "17:00",
  location: "Grand Hall",
}

const multipleEvents: ICSEvent[] = [
  { title: "Ceremony", startDate: "2026-06-15", startTime: "15:00" },
  { title: "Reception", startDate: "2026-06-15", startTime: "18:00" },
]

// ── Tests ──

describe("AddToCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders trigger button with label", () => {
    render(<AddToCalendar events={singleEvent} />)

    const trigger = screen.getByTestId("add-to-calendar-trigger")
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveTextContent("Add to Calendar")
  })

  it("renders custom label", () => {
    render(<AddToCalendar events={singleEvent} label="Save the Date" />)

    expect(screen.getByTestId("add-to-calendar-trigger")).toHaveTextContent("Save the Date")
  })

  it("shows dropdown on click", async () => {
    const user = userEvent.setup()
    render(<AddToCalendar events={singleEvent} />)

    expect(screen.queryByTestId("add-to-calendar-dropdown")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("add-to-calendar-trigger"))

    expect(screen.getByTestId("add-to-calendar-dropdown")).toBeInTheDocument()
    expect(screen.getByTestId("add-to-calendar-ics")).toBeInTheDocument()
    expect(screen.getByTestId("add-to-calendar-google")).toBeInTheDocument()
  })

  it("closes dropdown on backdrop click", async () => {
    const user = userEvent.setup()
    render(<AddToCalendar events={singleEvent} />)

    await user.click(screen.getByTestId("add-to-calendar-trigger"))
    expect(screen.getByTestId("add-to-calendar-dropdown")).toBeInTheDocument()

    await user.click(screen.getByTestId("add-to-calendar-backdrop"))
    expect(screen.queryByTestId("add-to-calendar-dropdown")).not.toBeInTheDocument()
  })

  it("calls generateICS and downloadICS for single event", async () => {
    const user = userEvent.setup()
    render(<AddToCalendar events={singleEvent} filename="wedding" />)

    await user.click(screen.getByTestId("add-to-calendar-trigger"))
    await user.click(screen.getByTestId("add-to-calendar-ics"))

    expect(mockGenerateICS).toHaveBeenCalledWith(singleEvent)
    expect(mockDownloadICS).toHaveBeenCalledWith("VCALENDAR_SINGLE", "wedding.ics")
  })

  it("calls generateMultiICS for multiple events", async () => {
    const user = userEvent.setup()
    render(<AddToCalendar events={multipleEvents} filename="events" />)

    await user.click(screen.getByTestId("add-to-calendar-trigger"))
    await user.click(screen.getByTestId("add-to-calendar-ics"))

    expect(mockGenerateMultiICS).toHaveBeenCalledWith(multipleEvents)
    expect(mockDownloadICS).toHaveBeenCalledWith("VCALENDAR_MULTI", "events.ics")
  })

  it("opens Google Calendar URL in new tab", async () => {
    const mockOpen = vi.fn()
    vi.stubGlobal("open", mockOpen)

    const user = userEvent.setup()
    render(<AddToCalendar events={singleEvent} />)

    await user.click(screen.getByTestId("add-to-calendar-trigger"))
    await user.click(screen.getByTestId("add-to-calendar-google"))

    expect(mockGenerateGoogleCalendarUrl).toHaveBeenCalledWith(singleEvent)
    expect(mockOpen).toHaveBeenCalledWith(
      "https://calendar.google.com/test",
      "_blank",
      "noopener,noreferrer"
    )

    vi.unstubAllGlobals()
  })

  it("closes dropdown after .ics download", async () => {
    const user = userEvent.setup()
    render(<AddToCalendar events={singleEvent} />)

    await user.click(screen.getByTestId("add-to-calendar-trigger"))
    await user.click(screen.getByTestId("add-to-calendar-ics"))

    expect(screen.queryByTestId("add-to-calendar-dropdown")).not.toBeInTheDocument()
  })

  it("closes dropdown after Google Calendar click", async () => {
    vi.stubGlobal("open", vi.fn())

    const user = userEvent.setup()
    render(<AddToCalendar events={singleEvent} />)

    await user.click(screen.getByTestId("add-to-calendar-trigger"))
    await user.click(screen.getByTestId("add-to-calendar-google"))

    expect(screen.queryByTestId("add-to-calendar-dropdown")).not.toBeInTheDocument()

    vi.unstubAllGlobals()
  })

  it("returns null for empty events array", () => {
    const { container } = render(<AddToCalendar events={[]} />)
    expect(container.innerHTML).toBe("")
  })

  it("applies portal styles when portalStyle is true", () => {
    render(<AddToCalendar events={singleEvent} portalStyle />)

    const trigger = screen.getByTestId("add-to-calendar-trigger")
    expect(trigger.style.borderColor).toBe("var(--portal-border)")
    expect(trigger.style.color).toBe("var(--portal-text)")
  })

  it("uses default filename 'event' when not specified", async () => {
    const user = userEvent.setup()
    render(<AddToCalendar events={singleEvent} />)

    await user.click(screen.getByTestId("add-to-calendar-trigger"))
    await user.click(screen.getByTestId("add-to-calendar-ics"))

    expect(mockDownloadICS).toHaveBeenCalledWith("VCALENDAR_SINGLE", "event.ics")
  })

  it("toggles dropdown open and closed", async () => {
    const user = userEvent.setup()
    render(<AddToCalendar events={singleEvent} />)

    // Open
    await user.click(screen.getByTestId("add-to-calendar-trigger"))
    expect(screen.getByTestId("add-to-calendar-dropdown")).toBeInTheDocument()

    // Close by clicking trigger again
    await user.click(screen.getByTestId("add-to-calendar-trigger"))
    expect(screen.queryByTestId("add-to-calendar-dropdown")).not.toBeInTheDocument()
  })
})
