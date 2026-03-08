import React, { Suspense } from "react"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock Data ──────────────────────────────────────────────────

const MOCK_EVENT = {
  id: "evt-1",
  creator_id: "user-1",
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
}

const PARTNER_EVENT = {
  ...MOCK_EVENT,
  id: "evt-2",
  creator_id: "user-2",
  title: "Partner's Event",
}

// ── Mocks ───────────────────────────────────────────────────

const mockBack = vi.fn()
const mockPush = vi.fn()
const mockCreateEvent = vi.fn().mockResolvedValue({ id: "new-1" })
const mockUpdateEvent = vi.fn().mockResolvedValue(undefined)
const mockDeleteEvent = vi.fn().mockResolvedValue(undefined)

let mockCalendarReturn = {
  events: [MOCK_EVENT, PARTNER_EVENT],
  upcomingEvents: [MOCK_EVENT],
  milestones: [],
  isLoading: false,
  error: null as string | null,
  createEvent: mockCreateEvent,
  updateEvent: mockUpdateEvent,
  deleteEvent: mockDeleteEvent,
  refreshEvents: vi.fn(),
  getEventsForMonth: vi.fn().mockReturnValue([]),
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/lib/hooks/use-calendar", () => ({
  useCalendar: () => mockCalendarReturn,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: { id: "user-1", display_name: "Yahya" },
    partner: { id: "user-2", display_name: "Yara" },
    isLoading: false,
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>(
      ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown> & { children?: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props as Record<string, unknown>
        void initial; void animate; void exit; void transition; void whileHover; void whileTap
        return <div ref={ref} {...rest}>{children}</div>
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

// Mock window.confirm
vi.stubGlobal("confirm", vi.fn(() => true))

import EditEventPage from "@/app/(main)/us/calendar/edit/[eventId]/page"

// Helper to render with params (wrapped in Suspense for use() hook)
async function renderEditPage(eventId: string) {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
        <EditEventPage params={Promise.resolve({ eventId })} />
      </Suspense>
    )
  })
  return result!
}

describe("EditEventPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCalendarReturn = {
      events: [MOCK_EVENT, PARTNER_EVENT],
      upcomingEvents: [MOCK_EVENT],
      milestones: [],
      isLoading: false,
      error: null,
      createEvent: mockCreateEvent,
      updateEvent: mockUpdateEvent,
      deleteEvent: mockDeleteEvent,
      refreshEvents: vi.fn(),
      getEventsForMonth: vi.fn().mockReturnValue([]),
    }
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("shows loading spinner when events are loading", async () => {
      mockCalendarReturn = { ...mockCalendarReturn, isLoading: true }
      await renderEditPage("evt-1")
      expect(screen.getByTestId("edit-loading")).toBeInTheDocument()
    })

    it("shows not-found state for invalid eventId", async () => {
      await renderEditPage("nonexistent-id")
      expect(screen.getByTestId("edit-not-found")).toBeInTheDocument()
      expect(screen.getByText("Event not found")).toBeInTheDocument()
    })

    it("renders CreateEventForm in edit mode for valid event", async () => {
      await renderEditPage("evt-1")
      expect(screen.getByTestId("form-title")).toHaveTextContent("Edit Event")
    })

    it("pre-fills title from event", async () => {
      await renderEditPage("evt-1")
      expect(screen.getByTestId("title-input")).toHaveValue("Date Night")
    })

    it("pre-fills date from event", async () => {
      await renderEditPage("evt-1")
      expect(screen.getByTestId("date-input")).toHaveValue("2026-04-15")
    })

    it("shows time pickers when event has time", async () => {
      await renderEditPage("evt-1")
      expect(screen.getByTestId("time-pickers")).toBeInTheDocument()
      expect(screen.getByTestId("start-time-input")).toHaveValue("19:00")
      expect(screen.getByTestId("end-time-input")).toHaveValue("21:00")
    })

    it("shows description from event", async () => {
      await renderEditPage("evt-1")
      expect(screen.getByTestId("description-input")).toHaveValue("Dinner out")
    })

    it("shows delete button for own event", async () => {
      await renderEditPage("evt-1")
      expect(screen.getByTestId("delete-button")).toBeInTheDocument()
    })

    it("shows 'Event Details' for partner event (read-only)", async () => {
      await renderEditPage("evt-2")
      expect(screen.getByTestId("form-title")).toHaveTextContent("Event Details")
    })

    it("hides submit button for partner event", async () => {
      await renderEditPage("evt-2")
      expect(screen.getByTestId("form-title")).toBeInTheDocument()
      expect(screen.queryByTestId("submit-button")).not.toBeInTheDocument()
    })

    it("submit button shows 'Save Changes'", async () => {
      await renderEditPage("evt-1")
      expect(screen.getByTestId("submit-button")).toHaveTextContent("Save Changes")
    })
  })

  // ── Interaction Tests ──────────────────────────────────────

  describe("interaction", () => {
    it("navigates back on not-found back button", async () => {
      await renderEditPage("nonexistent-id")
      expect(screen.getByTestId("not-found-back")).toBeInTheDocument()
      fireEvent.click(screen.getByTestId("not-found-back"))
      expect(mockBack).toHaveBeenCalled()
    })

    it("shows delete confirmation on delete click", async () => {
      await renderEditPage("evt-1")
      fireEvent.click(screen.getByTestId("delete-button"))
      expect(screen.getByTestId("delete-confirm")).toBeInTheDocument()
    })

    it("cancels delete on cancel click", async () => {
      await renderEditPage("evt-1")
      fireEvent.click(screen.getByTestId("delete-button"))
      fireEvent.click(screen.getByTestId("delete-cancel"))
      expect(screen.queryByTestId("delete-confirm")).not.toBeInTheDocument()
    })
  })

  // ── Integration Tests ──────────────────────────────────────

  describe("integration", () => {
    it("calls updateEvent with correct payload on submit", async () => {
      await renderEditPage("evt-1")
      expect(screen.getByTestId("title-input")).toHaveValue("Date Night")

      // Change title
      fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Updated Night" } })

      // Submit
      fireEvent.click(screen.getByTestId("submit-button"))

      await waitFor(() => {
        expect(mockUpdateEvent).toHaveBeenCalledWith("evt-1", expect.objectContaining({
          title: "Updated Night",
          event_date: "2026-04-15",
        }))
      })
    })

    it("calls deleteEvent on confirm delete", async () => {
      await renderEditPage("evt-1")
      fireEvent.click(screen.getByTestId("delete-button"))
      fireEvent.click(screen.getByTestId("delete-confirm-btn"))

      await waitFor(() => {
        expect(mockDeleteEvent).toHaveBeenCalledWith("evt-1")
      })
    })

    it("navigates back after successful update", async () => {
      await renderEditPage("evt-1")
      fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Changed" } })
      fireEvent.click(screen.getByTestId("submit-button"))

      await waitFor(() => {
        expect(mockBack).toHaveBeenCalled()
      })
    })

    it("finds event from events array by eventId param", async () => {
      await renderEditPage("evt-1")
      expect(screen.getByTestId("title-input")).toHaveValue("Date Night")
    })

    it("handles partner event correctly — read-only with no submit", async () => {
      await renderEditPage("evt-2")
      expect(screen.getByTestId("form-title")).toHaveTextContent("Event Details")
      expect(screen.queryByTestId("submit-button")).not.toBeInTheDocument()
      expect(screen.getByTestId("title-input")).toHaveValue("Partner's Event")
    })
  })
})
