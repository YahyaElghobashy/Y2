import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ── Mock State ──

const mockMilestone = {
  id: "m1",
  creator_id: "u1",
  title: "Anniversary",
  description: "1 Year Together",
  event_date: "2026-04-15",
  event_time: null,
  end_time: null,
  recurrence: "annual",
  category: "milestone",
  color: null,
  google_calendar_event_id: null,
  is_shared: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

let mockCalendarReturn = {
  events: [] as typeof mockMilestone[],
  upcomingEvents: [] as typeof mockMilestone[],
  milestones: [mockMilestone] as typeof mockMilestone[],
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

import { HomeCountdownWidget } from "@/components/home/HomeCountdownWidget"

/** Returns a YYYY-MM-DD string in local timezone */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

describe("HomeCountdownWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default state
    mockCalendarReturn = {
      ...mockCalendarReturn,
      milestones: [mockMilestone],
      isLoading: false,
    }
  })

  // ── Unit Tests ──

  it("returns null when loading", () => {
    mockCalendarReturn = { ...mockCalendarReturn, isLoading: true }
    const { container } = render(<HomeCountdownWidget />)
    expect(container.innerHTML).toBe("")
  })

  it("returns null when no milestones", () => {
    mockCalendarReturn = { ...mockCalendarReturn, milestones: [] }
    const { container } = render(<HomeCountdownWidget />)
    expect(container.innerHTML).toBe("")
  })

  it("renders widget when milestones exist", () => {
    render(<HomeCountdownWidget />)
    expect(screen.getByTestId("home-countdown-widget")).toBeInTheDocument()
  })

  it("displays the milestone title", () => {
    render(<HomeCountdownWidget />)
    expect(screen.getByTestId("countdown-title")).toHaveTextContent("Anniversary")
  })

  it("displays the formatted date", () => {
    render(<HomeCountdownWidget />)
    expect(screen.getByTestId("countdown-date")).toHaveTextContent("April 15, 2026")
  })

  it("shows 'Today!' when event is today", () => {
    const today = toLocalDateStr(new Date())
    mockCalendarReturn = {
      ...mockCalendarReturn,
      milestones: [{ ...mockMilestone, event_date: today }],
    }
    render(<HomeCountdownWidget />)
    expect(screen.getByTestId("countdown-days")).toHaveTextContent("Today!")
  })

  it("shows singular 'day' when 1 day away", () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = toLocalDateStr(tomorrow)
    mockCalendarReturn = {
      ...mockCalendarReturn,
      milestones: [{ ...mockMilestone, event_date: tomorrowStr }],
    }
    render(<HomeCountdownWidget />)
    const days = screen.getByTestId("countdown-days")
    expect(days).toHaveTextContent("1")
    expect(days).toHaveTextContent("day")
    expect(days.textContent).not.toContain("days")
  })

  it("shows plural 'days' when more than 1 day away", () => {
    const future = new Date()
    future.setDate(future.getDate() + 10)
    const futureStr = toLocalDateStr(future)
    mockCalendarReturn = {
      ...mockCalendarReturn,
      milestones: [{ ...mockMilestone, event_date: futureStr }],
    }
    render(<HomeCountdownWidget />)
    const days = screen.getByTestId("countdown-days")
    expect(days).toHaveTextContent("10")
    expect(days).toHaveTextContent("days")
  })

  it("applies className prop", () => {
    render(<HomeCountdownWidget className="mt-6" />)
    expect(screen.getByTestId("home-countdown-widget")).toHaveClass("mt-6")
  })

  it("has gold border styling", () => {
    render(<HomeCountdownWidget />)
    const widget = screen.getByTestId("home-countdown-widget")
    expect(widget.className).toContain("border")
  })

  // ── Interaction Tests ──

  it("links to /us/calendar with date param", () => {
    render(<HomeCountdownWidget />)
    const link = screen.getByTestId("home-countdown-widget").closest("a")
    expect(link).toHaveAttribute("href", "/us/calendar?date=2026-04-15")
  })

  // ── Integration Tests ──

  it("uses first milestone from useCalendar", () => {
    const secondMilestone = {
      ...mockMilestone,
      id: "m2",
      title: "Birthday",
      event_date: "2026-06-20",
    }
    mockCalendarReturn = {
      ...mockCalendarReturn,
      milestones: [mockMilestone, secondMilestone],
    }
    render(<HomeCountdownWidget />)
    // Should show the first milestone (nearest)
    expect(screen.getByTestId("countdown-title")).toHaveTextContent("Anniversary")
    expect(screen.queryByText("Birthday")).not.toBeInTheDocument()
  })
})
