import React from "react"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Calendar tab page — month navigation (chevrons) + day-detail behavior.
 *
 * REWRITTEN: the page was redesigned to render the presentational PlanView fed by
 * real hooks (useCalendar + useAuth). The previous version of this file grepped the
 * page source for a swipe gesture (`drag="x"`, `handleSwipeEnd`, `goToNextMonth`) and
 * a floating "Today" button (`goToToday`, `today-button`) — BOTH affordances were
 * removed in the redesign, so those source-grep tests were deleted (see file footer).
 * Month navigation now lives on the PlanView prev/next chevrons, which the page wires
 * to goPrevMonth / goNextMonth. These tests render the real page against mocked hooks
 * and assert behavior, not source text.
 */

// ── Mock data ──────────────────────────────────────────────
// Pin "today" so month-label assertions are deterministic regardless of run date.
const YEAR = 2026
const MONTH = 5 // 0-indexed → June
const DAY = 16
const MONTH_STR = String(MONTH + 1).padStart(2, "0") // "06"

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(YEAR, MONTH, DAY, 12, 0, 0))
})

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "evt-1",
  creator_id: "user-1",
  title: "Rooftop date night",
  description: null,
  event_date: `${YEAR}-${MONTH_STR}-18`,
  event_time: "20:00:00",
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
    title: "Anniversary dinner",
    event_date: `${YEAR}-${MONTH_STR}-22`,
    event_time: null,
    category: "milestone",
  }),
  makeEvent({
    id: "evt-3",
    title: "Coffee with Mom",
    event_date: `${YEAR}-${MONTH_STR}-14`,
    event_time: "11:00:00",
    category: "reminder",
  }),
]

// ── Mocks ───────────────────────────────────────────────────
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}))

const mockGetEventsForMonth = vi.fn()
const mockRefreshEvents = vi.fn()

let mockCalendarReturn = {
  events: MOCK_EVENTS,
  upcomingEvents: MOCK_EVENTS,
  milestones: [MOCK_EVENTS[1]],
  isLoading: false,
  error: null as string | null,
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  refreshEvents: mockRefreshEvents,
  getEventsForMonth: mockGetEventsForMonth,
}

vi.mock("@/lib/hooks/use-calendar", () => ({
  useCalendar: () => mockCalendarReturn,
}))

// The page reads useAuth() for the current user id (passed to DayDetailSheet as userId).
// Mock it so the page renders without an AuthProvider wrapper.
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "yahya@test.com" },
    profile: { id: "user-1", display_name: "Yahya" },
    partner: { id: "user-2", display_name: "Yara" },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// ── Framer Motion mock ──────────────────────────────────────
// PosterCard + DayDetailSheet render via motion.div; forward onClick/refs/children,
// strip motion-only props so jsdom doesn't choke. AnimatePresence passes children through.
vi.mock("framer-motion", () => {
  const passthrough = (Tag: "div" | "button") =>
    React.forwardRef(
      (
        {
          children,
          whileTap,
          whileHover,
          initial,
          animate,
          exit,
          transition,
          variants,
          drag,
          dragConstraints,
          dragElastic,
          onDragEnd,
          ...rest
        }: Record<string, unknown> & { children?: React.ReactNode },
        ref: React.Ref<HTMLElement>
      ) =>
        React.createElement(
          Tag,
          { ...rest, ref: ref as never },
          children as React.ReactNode
        )
    )
  return {
    motion: { div: passthrough("div"), button: passthrough("button") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

vi.mock("date-fns", () => ({
  format: (date: Date, fmt: string) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    if (fmt === "MMM d") return `${months[date.getMonth()]} ${date.getDate()}`
    if (fmt === "h:mm a") {
      const h = date.getHours()
      const m = String(date.getMinutes()).padStart(2, "0")
      const ampm = h >= 12 ? "PM" : "AM"
      return `${h % 12 || 12}:${m} ${ampm}`
    }
    if (fmt === "yyyy-MM-dd") {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    }
    if (fmt === "EEEE, MMMM d") {
      const long = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      return `${long[date.getMonth()]} ${date.getDate()}`
    }
    return date.toISOString()
  },
}))

// Import after mocks
import CalendarTabPage from "@/app/(main)/us/calendar/page"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

describe("Calendar tab page — month nav + day detail (PlanView redesign)", () => {
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
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      refreshEvents: mockRefreshEvents,
      getEventsForMonth: mockGetEventsForMonth,
    }
  })

  // ── Unit: derived state renders from mocked data ──────────────
  describe("unit", () => {
    it("renders the current month label from the displayed view state", () => {
      render(<CalendarTabPage />)
      expect(screen.getByText(`${MONTHS[MONTH]} ${YEAR}`)).toBeInTheDocument()
    })

    it("queries the domain hook for the displayed month with a 1-indexed month", () => {
      render(<CalendarTabPage />)
      // page calls getEventsForMonth(viewYear, viewMonth + 1)
      expect(mockGetEventsForMonth).toHaveBeenCalledWith(YEAR, MONTH + 1)
    })

    it("renders one day cell per day in the displayed month plus a labelled today cell", () => {
      render(<CalendarTabPage />)
      // June 2026 has 30 days → cells labelled "Day 1".."Day 30".
      expect(screen.getByRole("button", { name: /^Day 1\b/ })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /^Day 30\b/ })).toBeInTheDocument()
      // No "Day 31" in June.
      expect(screen.queryByRole("button", { name: /^Day 31\b/ })).not.toBeInTheDocument()
    })

    it("marks a day cell that has events with an event count in its accessible label", () => {
      render(<CalendarTabPage />)
      // evt-1 lands on the 18th → its cell label includes the event count.
      expect(screen.getByRole("button", { name: /^Day 18, 1 event$/ })).toBeInTheDocument()
    })

    it("renders mapped upcoming events in the 'Coming up' section", () => {
      render(<CalendarTabPage />)
      expect(screen.getByText("Coming up")).toBeInTheDocument()
      // upcomingEvents is sliced to 3 and mapped into PlanEvents.
      expect(screen.getByText("Rooftop date night")).toBeInTheDocument()
      expect(screen.getByText("Anniversary dinner")).toBeInTheDocument()
    })

    it("shows the loading skeleton when the hook reports isLoading", () => {
      mockCalendarReturn = { ...mockCalendarReturn, isLoading: true }
      render(<CalendarTabPage />)
      expect(screen.getByTestId("calendar-loading")).toBeInTheDocument()
      // Grid should not render while loading.
      expect(screen.queryByText(`${MONTHS[MONTH]} ${YEAR}`)).not.toBeInTheDocument()
    })

    it("shows the error state when the hook reports an error", () => {
      mockCalendarReturn = { ...mockCalendarReturn, error: "boom" }
      render(<CalendarTabPage />)
      expect(screen.getByTestId("calendar-error")).toBeInTheDocument()
    })
  })

  // ── Interaction: month navigation via chevrons ────────────────
  describe("interaction", () => {
    it("advances to the next month when the Next-month chevron is clicked", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByRole("button", { name: "Next month" }))
      expect(screen.getByText(`July ${YEAR}`)).toBeInTheDocument()
      // July has 31 days now → a Day 31 cell exists.
      expect(screen.getByRole("button", { name: /^Day 31\b/ })).toBeInTheDocument()
    })

    it("steps back to the previous month when the Previous-month chevron is clicked", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByRole("button", { name: "Previous month" }))
      expect(screen.getByText(`May ${YEAR}`)).toBeInTheDocument()
    })

    it("wraps December → January of the next year when paging forward", () => {
      render(<CalendarTabPage />)
      const next = () => fireEvent.click(screen.getByRole("button", { name: "Next month" }))
      // From June (idx 5) → December takes 6 clicks, then one more wraps to January.
      for (let i = 0; i < (11 - MONTH) + 1; i++) next()
      expect(screen.getByText(`January ${YEAR + 1}`)).toBeInTheDocument()
    })

    it("wraps January → December of the previous year when paging back", () => {
      render(<CalendarTabPage />)
      const prev = () => fireEvent.click(screen.getByRole("button", { name: "Previous month" }))
      // From June (idx 5) → January takes 5 clicks, then one more wraps to December prev year.
      for (let i = 0; i < MONTH + 1; i++) prev()
      expect(screen.getByText(`December ${YEAR - 1}`)).toBeInTheDocument()
    })

    it("opens the day-detail sheet for the tapped day", () => {
      render(<CalendarTabPage />)
      // Sheet is not in the DOM until a day is selected.
      expect(screen.queryByTestId("day-detail-sheet")).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole("button", { name: /^Day 18, 1 event$/ }))

      const sheet = screen.getByTestId("day-detail-sheet")
      expect(sheet).toBeInTheDocument()
      // The sheet renders the selected day's event.
      expect(within(sheet).getByText("Rooftop date night")).toBeInTheDocument()
    })

    it("closes the day-detail sheet via its close button", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByRole("button", { name: /^Day 18, 1 event$/ }))
      expect(screen.getByTestId("day-detail-sheet")).toBeInTheDocument()

      fireEvent.click(screen.getByTestId("day-sheet-close"))
      expect(screen.queryByTestId("day-detail-sheet")).not.toBeInTheDocument()
    })

    it("clears the open day-detail sheet when the month changes", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByRole("button", { name: /^Day 18, 1 event$/ }))
      expect(screen.getByTestId("day-detail-sheet")).toBeInTheDocument()

      // goNextMonth sets selectedDay back to null → sheet unmounts.
      fireEvent.click(screen.getByRole("button", { name: "Next month" }))
      expect(screen.queryByTestId("day-detail-sheet")).not.toBeInTheDocument()
    })
  })

  // ── Integration: callbacks reach the router / hook with right args ──
  describe("integration", () => {
    it("routes to the create sub-route when the FAB is tapped", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByRole("button", { name: "Add" }))
      expect(mockPush).toHaveBeenCalledWith("/us/calendar/create")
    })

    it("routes to an event's edit page when a 'Coming up' card is tapped", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByText("Rooftop date night"))
      expect(mockPush).toHaveBeenCalledWith("/us/calendar/edit/evt-1")
    })

    it("passes the current user id through to the day-detail sheet (own event routes to edit)", () => {
      render(<CalendarTabPage />)
      fireEvent.click(screen.getByRole("button", { name: /^Day 18, 1 event$/ }))
      const sheet = screen.getByTestId("day-detail-sheet")
      // creator_id ("user-1") matches the mocked userId → tapping routes to edit.
      fireEvent.click(within(sheet).getByText("Rooftop date night"))
      expect(mockPush).toHaveBeenCalledWith("/us/calendar/edit/evt-1")
    })

    it("re-queries the domain hook for the new month after navigating", () => {
      render(<CalendarTabPage />)
      mockGetEventsForMonth.mockClear()
      fireEvent.click(screen.getByRole("button", { name: "Next month" }))
      // After advancing from June → July, the hook is queried for month 7.
      expect(mockGetEventsForMonth).toHaveBeenCalledWith(YEAR, MONTH + 2)
    })

    it("shows the empty-state in the sheet for a day with no events", () => {
      render(<CalendarTabPage />)
      // Day 5 has no mock events.
      fireEvent.click(screen.getByRole("button", { name: /^Day 5$/ }))
      const sheet = screen.getByTestId("day-detail-sheet")
      expect(within(sheet).getByTestId("day-sheet-empty")).toBeInTheDocument()
    })
  })
})

/*
 * DELETED (features removed in the PlanView redesign — not faked):
 *  - Swipe gesture suite: wraps grid in motion.div drag="x", dragConstraints,
 *    dragElastic, onDragEnd={handleSwipeEnd}, absX/absY angle check, 50px threshold,
 *    swipe-left→goToNextMonth, swipe-right→goToPrevMonth, touchAction "pan-y".
 *    The redesigned page navigates months via the PlanView prev/next chevrons; there
 *    is no drag/swipe handler in the page anymore (DayDetailSheet has its own
 *    vertical dismiss-drag, which is unrelated to month nav and covered elsewhere).
 *  - "Today" button suite: isCurrentMonth-driven today-button, AnimatePresence
 *    enter/exit, goToToday resetting year/month/selectedDate, copper styling.
 *    There is no floating "Today" button in the redesign; isCurrentMonth survives
 *    only to highlight today's grid cell, which is covered by the unit tests above.
 *  - Source-grep style assertions (readFileSync + toContain on page source) were
 *    dropped entirely in favor of rendered-behavior assertions.
 */
