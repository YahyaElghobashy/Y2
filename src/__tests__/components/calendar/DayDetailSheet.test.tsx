import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { DayDetailSheet } from "@/components/calendar/DayDetailSheet"
import type { CalendarEvent } from "@/lib/types/calendar.types"

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    creator_id: "user-1",
    title: "Date Night",
    description: null,
    event_date: "2026-04-15",
    event_time: "19:00:00",
    end_time: "21:00:00",
    recurrence: "none",
    category: "date_night",
    is_shared: true,
    google_calendar_event_id: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "evt-2",
    creator_id: "user-2",
    title: "Partner Event",
    description: "Partner's event",
    event_date: "2026-04-15",
    event_time: null,
    end_time: null,
    recurrence: "none",
    category: "milestone",
    is_shared: true,
    google_calendar_event_id: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
]

const TEST_DATE = new Date(2026, 3, 15) // April 15, 2026

describe("DayDetailSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──

  it("renders nothing when closed", () => {
    const { container } = render(
      <DayDetailSheet
        isOpen={false}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    expect(container.querySelector("[data-testid='day-detail-sheet']")).toBeNull()
  })

  it("renders sheet when open", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    expect(screen.getByTestId("day-detail-sheet")).toBeInTheDocument()
  })

  it("shows formatted date in title", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    // April 15, 2026 is a Wednesday
    expect(screen.getByTestId("day-sheet-title")).toHaveTextContent("Wednesday, April 15")
  })

  it("renders event cards for each event", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    expect(screen.getByText("Date Night")).toBeInTheDocument()
    expect(screen.getByText("Partner Event")).toBeInTheDocument()
  })

  it("shows time range for timed events", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    // event_time=19:00:00, end_time=21:00:00
    expect(screen.getByText(/7:00 PM/)).toBeInTheDocument()
  })

  it("shows 'All day' for all-day events", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    expect(screen.getByText("All day")).toBeInTheDocument()
  })

  // ── Interaction Tests ──

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn()
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={onClose}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    fireEvent.click(screen.getByTestId("day-sheet-close"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when backdrop clicked", () => {
    const onClose = vi.fn()
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={onClose}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    fireEvent.click(screen.getByTestId("day-sheet-backdrop"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("navigates to create page with date when add button clicked", () => {
    const onClose = vi.fn()
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={onClose}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    fireEvent.click(screen.getByTestId("day-sheet-add"))
    expect(mockPush).toHaveBeenCalledWith("/us/calendar/create?date=2026-04-15")
    expect(onClose).toHaveBeenCalled()
  })

  it("navigates to edit page when own event clicked", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    fireEvent.click(screen.getByText("Date Night"))
    expect(mockPush).toHaveBeenCalledWith("/us/calendar/edit/evt-1")
  })

  it("does NOT navigate to edit for partner events", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    fireEvent.click(screen.getByText("Partner Event"))
    // Should not navigate — partner's event (creator_id=user-2, userId=user-1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  // ── Empty state ──

  it("shows empty state when no events", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={[]}
        userId="user-1"
      />
    )
    expect(screen.getByTestId("day-sheet-empty")).toBeInTheDocument()
    expect(screen.getByText("No events this day")).toBeInTheDocument()
  })

  it("shows Add Event CTA in empty state", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={[]}
        userId="user-1"
      />
    )
    const addBtn = screen.getByTestId("day-sheet-add-cta")
    expect(addBtn).toHaveTextContent("Add Event")
    fireEvent.click(addBtn)
    expect(mockPush).toHaveBeenCalledWith("/us/calendar/create?date=2026-04-15")
  })

  // ── Integration: drag handle ──

  it("has a drag handle element", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    const sheet = screen.getByTestId("day-detail-sheet")
    // Drag handle is the first child div with a small bar
    const handle = sheet.querySelector(".h-1.w-10")
    expect(handle).toBeInTheDocument()
  })

  it("sheet has max-height constraint", () => {
    render(
      <DayDetailSheet
        isOpen={true}
        onClose={vi.fn()}
        date={TEST_DATE}
        events={MOCK_EVENTS}
        userId="user-1"
      />
    )
    const sheet = screen.getByTestId("day-detail-sheet")
    expect(sheet.className).toContain("max-h-[80vh]")
  })
})
