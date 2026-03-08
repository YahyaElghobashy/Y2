import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ── Mock Data ──

const mockEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "e1",
  creator_id: "u1",
  title: "Date Night",
  description: "Dinner out",
  event_date: "2026-04-15",
  event_time: "19:00:00",
  end_time: "21:00:00",
  recurrence: "none",
  category: "date_night",
  color: null,
  google_calendar_event_id: null,
  is_shared: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
})

let mockCalendarReturn = {
  events: [] as ReturnType<typeof mockEvent>[],
  upcomingEvents: [
    mockEvent(),
    mockEvent({ id: "e2", title: "Movie Night", event_date: "2026-04-20", event_time: null, category: "reminder" }),
    mockEvent({ id: "e3", title: "Anniversary", event_date: "2026-05-01", category: "milestone" }),
  ] as ReturnType<typeof mockEvent>[],
  milestones: [] as ReturnType<typeof mockEvent>[],
  isLoading: false,
  error: null as string | null,
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  refreshEvents: vi.fn(),
  getEventsForMonth: vi.fn().mockReturnValue([]),
}

vi.mock("@/lib/hooks/use-calendar", () => ({
  useCalendar: () => mockCalendarReturn,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com" },
    profile: { id: "u1", display_name: "Yahya", email: "test@test.com", avatar_url: null, partner_id: "u2", role: "admin", created_at: "", updated_at: "" },
    partner: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>(
      ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown> & { children?: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => {
        void initial; void animate; void exit; void transition; void whileHover; void whileTap
        return <div ref={ref} {...props}>{children}</div>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import { HomeCalendarPeek } from "@/components/home/HomeCalendarPeek"

describe("HomeCalendarPeek", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCalendarReturn = {
      ...mockCalendarReturn,
      upcomingEvents: [
        mockEvent(),
        mockEvent({ id: "e2", title: "Movie Night", event_date: "2026-04-20", event_time: null, category: "reminder" }),
        mockEvent({ id: "e3", title: "Anniversary", event_date: "2026-05-01", category: "milestone" }),
      ],
      isLoading: false,
    }
  })

  // ── Unit Tests ──

  it("returns null when loading", () => {
    mockCalendarReturn = { ...mockCalendarReturn, isLoading: true }
    const { container } = render(<HomeCalendarPeek />)
    expect(container.innerHTML).toBe("")
  })

  it("renders the widget container", () => {
    render(<HomeCalendarPeek />)
    expect(screen.getByTestId("home-calendar-peek")).toBeInTheDocument()
  })

  it("shows 'Coming Up' header", () => {
    render(<HomeCalendarPeek />)
    expect(screen.getByTestId("peek-header")).toHaveTextContent("Coming Up")
  })

  it("shows 'See All' link", () => {
    render(<HomeCalendarPeek />)
    const seeAll = screen.getByTestId("see-all-link")
    expect(seeAll).toHaveTextContent("See All")
    expect(seeAll.closest("a")).toHaveAttribute("href", "/us/calendar")
  })

  it("renders max 3 event rows", () => {
    render(<HomeCalendarPeek />)
    const rows = screen.getAllByTestId("event-row")
    expect(rows).toHaveLength(3)
  })

  it("renders only available events when fewer than 3", () => {
    mockCalendarReturn = {
      ...mockCalendarReturn,
      upcomingEvents: [mockEvent()],
    }
    render(<HomeCalendarPeek />)
    expect(screen.getAllByTestId("event-row")).toHaveLength(1)
  })

  it("displays event titles", () => {
    render(<HomeCalendarPeek />)
    expect(screen.getByText("Date Night")).toBeInTheDocument()
    expect(screen.getByText("Movie Night")).toBeInTheDocument()
    expect(screen.getByText("Anniversary")).toBeInTheDocument()
  })

  it("displays event time when present", () => {
    render(<HomeCalendarPeek />)
    const times = screen.getAllByTestId("event-time")
    expect(times).toHaveLength(2) // Date Night and Anniversary have times, Movie Night doesn't
    expect(times[0]).toHaveTextContent("7:00 PM")
  })

  it("hides time when event_time is null", () => {
    mockCalendarReturn = {
      ...mockCalendarReturn,
      upcomingEvents: [mockEvent({ event_time: null })],
    }
    render(<HomeCalendarPeek />)
    expect(screen.queryByTestId("event-time")).not.toBeInTheDocument()
  })

  it("shows date badge with day number", () => {
    render(<HomeCalendarPeek />)
    const badges = screen.getAllByTestId("date-badge")
    expect(badges[0]).toHaveTextContent("15")
    expect(badges[0]).toHaveTextContent("Apr")
  })

  it("applies className prop", () => {
    render(<HomeCalendarPeek className="mt-6" />)
    expect(screen.getByTestId("home-calendar-peek")).toHaveClass("mt-6")
  })

  // ── Empty State Tests ──

  it("shows empty state when no upcoming events", () => {
    mockCalendarReturn = {
      ...mockCalendarReturn,
      upcomingEvents: [],
    }
    render(<HomeCalendarPeek />)
    expect(screen.getByTestId("empty-message")).toHaveTextContent(
      "No upcoming events. Plan something together?"
    )
  })

  it("shows Add Event CTA in empty state", () => {
    mockCalendarReturn = {
      ...mockCalendarReturn,
      upcomingEvents: [],
    }
    render(<HomeCalendarPeek />)
    const cta = screen.getByTestId("add-event-cta")
    expect(cta).toHaveTextContent("Add Event")
    expect(cta.closest("a")).toHaveAttribute("href", "/us/calendar/create")
  })

  // ── Interaction Tests ──

  it("event row links to calendar with date", () => {
    render(<HomeCalendarPeek />)
    const firstRow = screen.getAllByTestId("event-row")[0]
    const link = firstRow.closest("a")
    expect(link).toHaveAttribute("href", "/us/calendar?date=2026-04-15")
  })

  // ── Integration Tests ──

  it("uses upcomingEvents from useCalendar", () => {
    render(<HomeCalendarPeek />)
    const titles = screen.getAllByTestId("event-title")
    expect(titles[0]).toHaveTextContent("Date Night")
    expect(titles[1]).toHaveTextContent("Movie Night")
    expect(titles[2]).toHaveTextContent("Anniversary")
  })

  it("date badge color matches category via getCategoryColor", () => {
    render(<HomeCalendarPeek />)
    const badges = screen.getAllByTestId("date-badge")
    // date_night = #B87333
    expect(badges[0].getAttribute("data-color")).toBe("#B87333")
    // reminder = #9CA3AF
    expect(badges[1].getAttribute("data-color")).toBe("#9CA3AF")
    // milestone = #DAA520
    expect(badges[2].getAttribute("data-color")).toBe("#DAA520")
  })

  it("limits to 3 events even with more available", () => {
    mockCalendarReturn = {
      ...mockCalendarReturn,
      upcomingEvents: [
        mockEvent({ id: "e1" }),
        mockEvent({ id: "e2", title: "Two" }),
        mockEvent({ id: "e3", title: "Three" }),
        mockEvent({ id: "e4", title: "Four" }),
        mockEvent({ id: "e5", title: "Five" }),
      ],
    }
    render(<HomeCalendarPeek />)
    expect(screen.getAllByTestId("event-row")).toHaveLength(3)
  })
})
