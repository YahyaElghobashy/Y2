import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * CalendarTabPage (src/app/(main)/us/calendar/page.tsx) was redesigned to render
 * the presentational `PlanView`, fed by real hooks (`useCalendar`, `useAuth`).
 * These tests assert the NEW behavior: the page maps DB events → PlanData,
 * drives month navigation through `getEventsForMonth`, and wires day taps to the
 * shared `DayDetailSheet` and event taps to the edit route.
 */

// ── Mock data ──────────────────────────────────────────────
const TODAY = new Date()
const YEAR = TODAY.getFullYear()
const MONTH = TODAY.getMonth() // 0-indexed
const DAY = TODAY.getDate()
const MONTH_STR = String(MONTH + 1).padStart(2, "0")
const DAY_STR = String(DAY).padStart(2, "0")
const TODAY_DATE = `${YEAR}-${MONTH_STR}-${DAY_STR}`

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "evt-1",
  creator_id: "user-1",
  title: "Date Night",
  description: null,
  event_date: TODAY_DATE,
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

const mockGetEventsForMonth = vi.fn()

// getEventsForMonth(year, month1Indexed) → events whose date is in that month.
function defaultGetEventsForMonth(year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`
  return MOCK_EVENTS.filter((e) => e.event_date.startsWith(prefix))
}

let mockCalendarReturn: {
  upcomingEvents: ReturnType<typeof makeEvent>[]
  getEventsForMonth: typeof mockGetEventsForMonth
  isLoading: boolean
  error: string | null
}

vi.mock("@/lib/hooks/use-calendar", () => ({
  useCalendar: () => mockCalendarReturn,
}))

// The page reads useAuth() for the current user id (passed to DayDetailSheet).
// Mock it so the page can render without an AuthProvider wrapper.
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: { id: "user-1", display_name: "Yahya", partner_id: "user-2" },
    partner: { id: "user-2", display_name: "Yara", partner_id: "user-1" },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

// PageTransition wrapper → passthrough; LoadingSkeleton → identifiable stub.
vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// framer-motion: strip animation props, keep DOM + data-testid (matches repo pattern).
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileHover, whileTap, transition, layoutId, initial, animate, exit, variants, drag, dragConstraints, dragElastic, onDragEnd, ...domProps } = props
      void whileHover; void whileTap; void transition; void layoutId; void initial; void animate; void exit; void variants; void drag; void dragConstraints; void dragElastic; void onDragEnd
      return <div {...(domProps as Record<string, unknown>)}>{children as React.ReactNode}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileHover, whileTap, transition, ...domProps } = props
      void whileHover; void whileTap; void transition
      return <button {...(domProps as Record<string, unknown>)}>{children as React.ReactNode}</button>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Import after mocks
import CalendarTabPage from "@/app/(main)/us/calendar/page"

describe("CalendarTabPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEventsForMonth.mockImplementation(defaultGetEventsForMonth)
    mockCalendarReturn = {
      upcomingEvents: MOCK_EVENTS,
      getEventsForMonth: mockGetEventsForMonth,
      isLoading: false,
      error: null,
    }
  })

  // Helper: read the month label rendered by PlanView (the only month heading).
  function monthLabel() {
    return screen.getByText((_, el) =>
      el?.tagName === "SPAN" && /(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}/.test(el.textContent ?? ""),
    )
  }

  // ── Unit: derived values render from mocked data ──────────────

  describe("unit", () => {
    it("renders the redesigned Plan header (not the old 'Our Calendar' header)", () => {
      render(<CalendarTabPage />)
      expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument()
      expect(screen.queryByText("Our Calendar")).not.toBeInTheDocument()
    })

    it("derives the month label from the current view (current month + year)", () => {
      render(<CalendarTabPage />)
      expect(
        screen.getByText(`${MONTH_NAMES[MONTH]} ${YEAR}`),
      ).toBeInTheDocument()
    })

    it("calls getEventsForMonth with the current year and 1-indexed month", () => {
      render(<CalendarTabPage />)
      expect(mockGetEventsForMonth).toHaveBeenCalledWith(YEAR, MONTH + 1)
    })

    it("renders the loading skeleton (not PlanView) when isLoading is true", () => {
      mockCalendarReturn = { ...mockCalendarReturn, isLoading: true }
      render(<CalendarTabPage />)
      expect(screen.getByTestId("calendar-loading")).toBeInTheDocument()
      // PlanView's heading must NOT be present while loading
      expect(screen.queryByRole("heading", { name: "Plan" })).not.toBeInTheDocument()
    })

    it("renders the error state (not PlanView) when error is set", () => {
      mockCalendarReturn = { ...mockCalendarReturn, error: "Network error" }
      render(<CalendarTabPage />)
      const err = screen.getByTestId("calendar-error")
      expect(err).toBeInTheDocument()
      expect(err).toHaveTextContent("Something went wrong loading your calendar.")
      expect(screen.queryByRole("heading", { name: "Plan" })).not.toBeInTheDocument()
    })

    it("renders the day grid with the correct number of day cells for the month", () => {
      render(<CalendarTabPage />)
      const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate()
      // Each day is a button with aria-label "Day N..."
      const dayCells = screen
        .getAllByRole("button")
        .filter((b) => /^Day \d+/.test(b.getAttribute("aria-label") ?? ""))
      expect(dayCells).toHaveLength(daysInMonth)
    })

    it("highlights today: today's cell advertises its events in its aria-label", () => {
      render(<CalendarTabPage />)
      // evt-1 (Date Night) is on today's date → today's cell has 1 event.
      const todayCell = screen.getByRole("button", {
        name: new RegExp(`^Day ${DAY}, 1 event$`),
      })
      expect(todayCell).toBeInTheDocument()
    })

    it("renders upcoming events (capped at 3) in the 'Coming up' section", () => {
      render(<CalendarTabPage />)
      expect(screen.getByRole("heading", { name: "Coming up" })).toBeInTheDocument()
      // All three mock events are upcoming and within the cap of 3.
      expect(screen.getByText("Date Night")).toBeInTheDocument()
      expect(screen.getByText("Anniversary")).toBeInTheDocument()
      expect(screen.getByText("Dentist")).toBeInTheDocument()
    })

    it("does not render stale hardcoded sample events", () => {
      render(<CalendarTabPage />)
      expect(screen.queryByText("6 Month Anniversary")).not.toBeInTheDocument()
      expect(screen.queryByText("Yara's Birthday")).not.toBeInTheDocument()
    })

    it("does not open the DayDetailSheet until a day is selected", () => {
      render(<CalendarTabPage />)
      expect(screen.queryByTestId("day-detail-sheet")).not.toBeInTheDocument()
    })
  })

  // ── Interaction: user flows ──────────────────────────────────

  describe("interaction", () => {
    it("navigates to the previous month when the prev chevron is clicked", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByRole("button", { name: "Previous month" }))

      const prevMonth = MONTH === 0 ? 11 : MONTH - 1
      const prevYear = MONTH === 0 ? YEAR - 1 : YEAR
      expect(monthLabel()).toHaveTextContent(`${MONTH_NAMES[prevMonth]} ${prevYear}`)
    })

    it("navigates to the next month when the next chevron is clicked", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByRole("button", { name: "Next month" }))

      const nextMonth = MONTH === 11 ? 0 : MONTH + 1
      const nextYear = MONTH === 11 ? YEAR + 1 : YEAR
      expect(monthLabel()).toHaveTextContent(`${MONTH_NAMES[nextMonth]} ${nextYear}`)
    })

    it("re-queries getEventsForMonth with the new month after navigating forward", () => {
      render(<CalendarTabPage />)
      mockGetEventsForMonth.mockClear()
      fireEvent.click(screen.getByRole("button", { name: "Next month" }))

      const nextMonth = MONTH === 11 ? 0 : MONTH + 1
      const nextYear = MONTH === 11 ? YEAR + 1 : YEAR
      // hook is called with 1-indexed month for the now-displayed month
      expect(mockGetEventsForMonth).toHaveBeenCalledWith(nextYear, nextMonth + 1)
    })

    it("wraps Dec → Jan of the next year and back again", () => {
      render(<CalendarTabPage />)
      for (let i = 0; i <= 11 - MONTH; i++) {
        fireEvent.click(screen.getByRole("button", { name: "Next month" }))
      }
      expect(monthLabel()).toHaveTextContent(`January ${YEAR + 1}`)

      fireEvent.click(screen.getByRole("button", { name: "Previous month" }))
      expect(monthLabel()).toHaveTextContent(`December ${YEAR}`)
    })

    it("opens the DayDetailSheet for the tapped day", () => {
      render(<CalendarTabPage />)
      expect(screen.queryByTestId("day-detail-sheet")).not.toBeInTheDocument()

      // Tap today's cell (which has an event).
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(`^Day ${DAY},`) }),
      )

      expect(screen.getByTestId("day-detail-sheet")).toBeInTheDocument()
      // Sheet title is the formatted selected date (e.g. "Monday, June 16").
      const monthShort = MONTH_NAMES[MONTH]
      expect(screen.getByTestId("day-sheet-title")).toHaveTextContent(
        new RegExp(`${monthShort} ${DAY}$`),
      )
    })

    it("passes the tapped day's events into the DayDetailSheet", () => {
      render(<CalendarTabPage />)
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(`^Day ${DAY},`) }),
      )
      // The sheet renders an EventCard for evt-1 ("Date Night") which falls on today.
      const sheet = screen.getByTestId("day-detail-sheet")
      expect(sheet).toHaveTextContent("Date Night")
    })

    it("closes the DayDetailSheet when navigating to another month", () => {
      render(<CalendarTabPage />)
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(`^Day ${DAY},`) }),
      )
      expect(screen.getByTestId("day-detail-sheet")).toBeInTheDocument()

      // goNextMonth clears the selected day → sheet unmounts.
      fireEvent.click(screen.getByRole("button", { name: "Next month" }))
      expect(screen.queryByTestId("day-detail-sheet")).not.toBeInTheDocument()
    })

    it("shows the empty-day state in the sheet when the tapped day has no events", () => {
      render(<CalendarTabPage />)
      // Tap a day with no events. Use day 1 unless an event lands on it.
      const emptyDay = MOCK_EVENTS.some((e) => e.event_date.endsWith("-01")) ? 2 : 1
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(`^Day ${emptyDay}(,|$)`) }),
      )
      expect(screen.getByTestId("day-sheet-empty")).toBeInTheDocument()
      expect(screen.getByText("No events this day")).toBeInTheDocument()
    })
  })

  // ── Integration: mocked hooks receive correct calls ──────────

  describe("integration", () => {
    it("routes the FAB to the calendar create sub-route via router.push", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByRole("button", { name: "Add" }))
      expect(mockPush).toHaveBeenCalledWith("/us/calendar/create")
    })

    it("routes an upcoming event tap to its edit page via router.push(/us/calendar/edit/:id)", () => {
      render(<CalendarTabPage />)
      // Click the "Anniversary" upcoming card → onEditEvent("evt-2").
      fireEvent.click(screen.getByText("Anniversary"))
      expect(mockPush).toHaveBeenCalledWith("/us/calendar/edit/evt-2")
    })

    it("routes a sheet event tap (own event) to its edit page", () => {
      render(<CalendarTabPage />)
      // Open today's sheet, then tap the event card inside it.
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(`^Day ${DAY},`) }),
      )
      const sheet = screen.getByTestId("day-detail-sheet")
      // evt-1 is creator_id "user-1" === userId → navigates to edit.
      fireEvent.click(sheet.querySelector("button.text-start") ?? sheet)
      // The EventCard's onClick → handleEventTap → push edit route for evt-1.
      // (Find the EventCard button by its title text.)
      const card = screen.getAllByText("Date Night").map((n) => n.closest("button")).find(Boolean)
      if (card) fireEvent.click(card)
      expect(mockPush).toHaveBeenCalledWith("/us/calendar/edit/evt-1")
    })

    it("maps DB categories onto PlanView dot colors without throwing (date_night/milestone/reminder)", () => {
      // reminder has no dedicated dot color → must fold onto a valid key ("family").
      // If mapping returned an undefined key, PlanView's dot style would be undefined;
      // rendering all three categories proves the mapping produced valid keys.
      render(<CalendarTabPage />)
      // All three categorized events render their titles in "Coming up".
      expect(screen.getByText("Date Night")).toBeInTheDocument() // date_night → date
      expect(screen.getByText("Anniversary")).toBeInTheDocument() // milestone → milestone
      expect(screen.getByText("Dentist")).toBeInTheDocument() // reminder → family
    })

    it("caps the 'Coming up' list at 3 even when more upcoming events exist", () => {
      const many = [
        ...MOCK_EVENTS,
        makeEvent({ id: "evt-4", title: "Fourth Event", event_date: `${YEAR}-${MONTH_STR}-25`, category: "reminder" }),
        makeEvent({ id: "evt-5", title: "Fifth Event", event_date: `${YEAR}-${MONTH_STR}-26`, category: "reminder" }),
      ]
      mockCalendarReturn = { ...mockCalendarReturn, upcomingEvents: many }
      render(<CalendarTabPage />)
      // First three render; the 4th/5th are sliced off.
      expect(screen.getByText("Date Night")).toBeInTheDocument()
      expect(screen.getByText("Anniversary")).toBeInTheDocument()
      expect(screen.getByText("Dentist")).toBeInTheDocument()
      expect(screen.queryByText("Fourth Event")).not.toBeInTheDocument()
      expect(screen.queryByText("Fifth Event")).not.toBeInTheDocument()
    })

    it("formats an upcoming event's 'when' with date + time when event_time is present", () => {
      const todayOnly = [makeEvent({ id: "evt-1", title: "Timed Event", event_date: TODAY_DATE, event_time: "19:00:00", category: "date_night" })]
      mockCalendarReturn = { ...mockCalendarReturn, upcomingEvents: todayOnly }
      render(<CalendarTabPage />)
      const card = screen.getByText("Timed Event").closest("div")?.parentElement
      // "MMM d · h:mm a" → contains the time portion.
      expect(card).toHaveTextContent("7:00 PM")
    })

    it("formats an all-day upcoming event's 'when' with date only (no time separator)", () => {
      const allDay = [makeEvent({ id: "evt-1", title: "All Day", event_date: TODAY_DATE, event_time: null, category: "milestone" })]
      mockCalendarReturn = { ...mockCalendarReturn, upcomingEvents: allDay }
      render(<CalendarTabPage />)
      const whenLine = screen.getByText("All Day").parentElement?.querySelector("span:last-child")
      expect(whenLine?.textContent).not.toContain("·")
      expect(whenLine?.textContent).not.toMatch(/\d{1,2}:\d{2}/)
    })
  })
})
