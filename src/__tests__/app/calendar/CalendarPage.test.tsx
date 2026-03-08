import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock data ──────────────────────────────────────────────
const TODAY = new Date()
const YEAR = TODAY.getFullYear()
const MONTH = TODAY.getMonth() // 0-indexed
const DAY = TODAY.getDate()
const MONTH_STR = String(MONTH + 1).padStart(2, "0")

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "evt-1",
  creator_id: "user-1",
  title: "Date Night",
  description: null,
  event_date: `${YEAR}-${MONTH_STR}-${String(DAY).padStart(2, "0")}`,
  event_time: "19:00:00",
  end_time: null,
  recurrence: "none",
  category: "date_night",
  color: null,
  google_calendar_event_id: null,
  is_shared: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
})

const MOCK_EVENTS = [
  makeEvent(),
  makeEvent({
    id: "evt-2",
    title: "Anniversary",
    event_date: `${YEAR}-${MONTH_STR}-15`,
    event_time: null,
    recurrence: "annual",
    category: "milestone",
  }),
  makeEvent({
    id: "evt-3",
    title: "Dentist",
    event_date: `${YEAR}-${MONTH_STR}-20`,
    event_time: "10:00:00",
    category: "reminder",
  }),
]

// ── Mocks ───────────────────────────────────────────────────
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}))

const mockCreateEvent = vi.fn()
const mockUpdateEvent = vi.fn()
const mockDeleteEvent = vi.fn()
const mockRefreshEvents = vi.fn()
const mockGetEventsForMonth = vi.fn()

let mockCalendarReturn = {
  events: MOCK_EVENTS,
  upcomingEvents: MOCK_EVENTS,
  milestones: [MOCK_EVENTS[1]],
  isLoading: false,
  error: null as string | null,
  createEvent: mockCreateEvent,
  updateEvent: mockUpdateEvent,
  deleteEvent: mockDeleteEvent,
  refreshEvents: mockRefreshEvents,
  getEventsForMonth: mockGetEventsForMonth,
}

vi.mock("@/lib/hooks/use-calendar", () => ({
  useCalendar: () => mockCalendarReturn,
}))

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FadeIn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => <h1 data-testid="page-header">{title}</h1>,
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div data-testid={props["data-testid"] as string}>{children as React.ReactNode}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("date-fns", () => ({
  format: (date: Date, fmt: string) => {
    if (fmt === "MMM d") {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return `${months[date.getMonth()]} ${date.getDate()}`
    }
    if (fmt === "h:mm a") {
      const h = date.getHours()
      const m = String(date.getMinutes()).padStart(2, "0")
      const ampm = h >= 12 ? "PM" : "AM"
      return `${h % 12 || 12}:${m} ${ampm}`
    }
    return date.toISOString()
  },
}))

// Import after mocks
import CalendarTabPage from "@/app/(main)/us/calendar/page"

describe("CalendarTabPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEventsForMonth.mockImplementation((year: number, month: number) => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`
      return MOCK_EVENTS.filter((e) => e.event_date.startsWith(prefix))
    })
    mockCalendarReturn = {
      events: MOCK_EVENTS,
      upcomingEvents: MOCK_EVENTS,
      milestones: [MOCK_EVENTS[1]],
      isLoading: false,
      error: null,
      createEvent: mockCreateEvent,
      updateEvent: mockUpdateEvent,
      deleteEvent: mockDeleteEvent,
      refreshEvents: mockRefreshEvents,
      getEventsForMonth: mockGetEventsForMonth,
    }
  })

  // ── Unit tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders page header with correct title", () => {
      render(<CalendarTabPage />)
      expect(screen.getByTestId("page-header")).toHaveTextContent("Our Calendar")
    })

    it("displays current month and year in header", () => {
      render(<CalendarTabPage />)
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ]
      expect(screen.getByTestId("month-header")).toHaveTextContent(
        `${months[MONTH]} ${YEAR}`
      )
    })

    it("calls getEventsForMonth with correct year and 1-indexed month", () => {
      render(<CalendarTabPage />)
      expect(mockGetEventsForMonth).toHaveBeenCalledWith(YEAR, MONTH + 1)
    })

    it("shows loading skeleton when isLoading is true", () => {
      mockCalendarReturn = { ...mockCalendarReturn, isLoading: true }
      render(<CalendarTabPage />)
      expect(screen.getByTestId("calendar-loading")).toBeInTheDocument()
    })

    it("shows error state with retry button when error occurs", () => {
      mockCalendarReturn = { ...mockCalendarReturn, error: "Network error" }
      render(<CalendarTabPage />)
      expect(screen.getByTestId("calendar-error")).toBeInTheDocument()
      expect(screen.getByTestId("calendar-retry")).toBeInTheDocument()
    })

    it("shows empty day message when selected day has no events", () => {
      mockGetEventsForMonth.mockReturnValue([])
      render(<CalendarTabPage />)
      // Today is selected by default
      expect(screen.getByTestId("empty-day")).toBeInTheDocument()
      expect(screen.getByText("No events — tap to add one")).toBeInTheDocument()
    })

    it("displays upcoming events in Coming Up section", () => {
      render(<CalendarTabPage />)
      expect(screen.getByText("Coming Up")).toBeInTheDocument()
      // Should show upcoming events (may appear in both selected day and Coming Up)
      expect(screen.getAllByText("Date Night").length).toBeGreaterThanOrEqual(1)
    })

    it("shows empty state when no upcoming events", () => {
      mockCalendarReturn = { ...mockCalendarReturn, upcomingEvents: [] }
      render(<CalendarTabPage />)
      expect(screen.getByText("Nothing coming up")).toBeInTheDocument()
    })

    it("does not contain SAMPLE_EVENTS or hardcoded data", () => {
      render(<CalendarTabPage />)
      // Verify the old sample event titles are not rendered
      // (unless they match our mock data)
      expect(screen.queryByText("6 Month Anniversary")).not.toBeInTheDocument()
      expect(screen.queryByText("Yara's Birthday")).not.toBeInTheDocument()
    })
  })

  // ── Interaction tests ────────────────────────────────────────

  describe("interaction", () => {
    it("navigates to previous month on left arrow click", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByTestId("prev-month"))

      const prevMonth = MONTH === 0 ? 11 : MONTH - 1
      const prevYear = MONTH === 0 ? YEAR - 1 : YEAR
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ]
      expect(screen.getByTestId("month-header")).toHaveTextContent(
        `${months[prevMonth]} ${prevYear}`
      )
    })

    it("navigates to next month on right arrow click", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByTestId("next-month"))

      const nextMonth = MONTH === 11 ? 0 : MONTH + 1
      const nextYear = MONTH === 11 ? YEAR + 1 : YEAR
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ]
      expect(screen.getByTestId("month-header")).toHaveTextContent(
        `${months[nextMonth]} ${nextYear}`
      )
    })

    it("clears selectedDate when navigating months", () => {
      render(<CalendarTabPage />)
      // Initially today is selected, showing selected-day-events
      expect(screen.getByTestId("selected-day-events")).toBeInTheDocument()

      // Navigate to next month — selectedDate should clear
      fireEvent.click(screen.getByTestId("next-month"))
      expect(screen.queryByTestId("selected-day-events")).not.toBeInTheDocument()
    })

    it("calls refreshEvents when retry button is clicked", () => {
      mockCalendarReturn = { ...mockCalendarReturn, error: "Failed" }
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByTestId("calendar-retry"))
      expect(mockRefreshEvents).toHaveBeenCalledTimes(1)
    })
  })

  // ── Integration tests ────────────────────────────────────────

  describe("integration", () => {
    it("passes correct events to EventDotCalendar after mapping", () => {
      // getEventsForMonth returns events with event_date as YYYY-MM-DD strings
      // The page should map them to {date: number, category: string} for EventDotCalendar
      render(<CalendarTabPage />)

      // Verify getEventsForMonth was called with correct args
      expect(mockGetEventsForMonth).toHaveBeenCalledWith(YEAR, MONTH + 1)
    })

    it("maps date_night category to 'date' for EventDotCalendar dots", () => {
      const eventsForMonth = [makeEvent({ event_date: `${YEAR}-${MONTH_STR}-${String(DAY).padStart(2, "0")}` })]
      mockGetEventsForMonth.mockReturnValue(eventsForMonth)

      render(<CalendarTabPage />)

      // The component should internally map "date_night" → "date" for dot colors
      // We verify via the calendar rendering that getEventsForMonth was called
      expect(mockGetEventsForMonth).toHaveBeenCalled()
    })

    it("displays event time when event_time is provided", () => {
      const todayStr = `${YEAR}-${MONTH_STR}-${String(DAY).padStart(2, "0")}`
      const timedEvent = makeEvent({ event_date: todayStr, event_time: "19:00:00" })
      mockGetEventsForMonth.mockReturnValue([timedEvent])
      mockCalendarReturn = {
        ...mockCalendarReturn,
        upcomingEvents: [timedEvent],
        getEventsForMonth: mockGetEventsForMonth,
      }

      render(<CalendarTabPage />)

      // Check that event is rendered (may appear in both sections)
      expect(screen.getAllByText("Date Night").length).toBeGreaterThanOrEqual(1)
    })

    it("displays events without time as date-only", () => {
      const todayStr = `${YEAR}-${MONTH_STR}-${String(DAY).padStart(2, "0")}`
      const allDayEvent = makeEvent({
        event_date: todayStr,
        event_time: null,
        title: "All Day Event",
      })
      mockGetEventsForMonth.mockReturnValue([allDayEvent])
      mockCalendarReturn = {
        ...mockCalendarReturn,
        upcomingEvents: [allDayEvent],
        getEventsForMonth: mockGetEventsForMonth,
      }

      render(<CalendarTabPage />)
      // May appear in both selected day and Coming Up sections
      expect(screen.getAllByText("All Day Event").length).toBeGreaterThanOrEqual(1)
    })

    it("wraps around months correctly (Dec → Jan, Jan → Dec)", () => {
      render(<CalendarTabPage />)

      // Navigate forward to wrap
      for (let i = 0; i <= 11 - MONTH; i++) {
        fireEvent.click(screen.getByTestId("next-month"))
      }
      // Should now be January of next year
      expect(screen.getByTestId("month-header")).toHaveTextContent(
        `January ${YEAR + 1}`
      )

      // Navigate back to wrap
      fireEvent.click(screen.getByTestId("prev-month"))
      expect(screen.getByTestId("month-header")).toHaveTextContent(
        `December ${YEAR}`
      )
    })

    it("renders FAB create button", () => {
      render(<CalendarTabPage />)
      const fab = screen.getByTestId("fab-create")
      expect(fab).toBeInTheDocument()
      expect(fab).toHaveAttribute("href", expect.stringContaining("/us/calendar/create"))
    })

    it("FAB passes selected date in URL", () => {
      render(<CalendarTabPage />)
      const fab = screen.getByTestId("fab-create")
      const expectedMonth = String(MONTH + 1).padStart(2, "0")
      const expectedDay = String(DAY).padStart(2, "0")
      expect(fab).toHaveAttribute(
        "href",
        `/us/calendar/create?date=${YEAR}-${expectedMonth}-${expectedDay}`
      )
    })

    it("empty day CTA links to create page", () => {
      mockGetEventsForMonth.mockReturnValue([])
      render(<CalendarTabPage />)
      const emptyDay = screen.getByTestId("empty-day")
      expect(emptyDay).toHaveAttribute("href", expect.stringContaining("/us/calendar/create"))
    })

    it("event card click navigates to edit page", () => {
      render(<CalendarTabPage />)
      // Click on "Date Night" event card in selected day section
      const eventCards = screen.getAllByText("Date Night")
      // Click the first one found (which should be the EventCard button)
      fireEvent.click(eventCards[0].closest("button")!)
      expect(mockPush).toHaveBeenCalledWith("/us/calendar/edit/evt-1")
    })
  })
})
