import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ───────────────────────────────────────────────────
const mockBack = vi.fn()
const mockCreateEvent = vi.fn().mockResolvedValue({ id: "new-1" })
const mockUpdateEvent = vi.fn().mockResolvedValue(undefined)
const mockDeleteEvent = vi.fn().mockResolvedValue(undefined)

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/lib/hooks/use-calendar", () => ({
  useCalendar: () => ({
    events: [],
    upcomingEvents: [],
    milestones: [],
    isLoading: false,
    error: null,
    createEvent: mockCreateEvent,
    updateEvent: mockUpdateEvent,
    deleteEvent: mockDeleteEvent,
    refreshEvents: vi.fn(),
    getEventsForMonth: vi.fn().mockReturnValue([]),
  }),
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

// Mock window.confirm
vi.stubGlobal("confirm", vi.fn(() => true))

import { CreateEventForm } from "@/components/calendar/CreateEventForm"

const MOCK_EVENT = {
  id: "evt-1",
  creator_id: "user-1",
  title: "Date Night",
  description: "Dinner at that place",
  event_date: "2026-04-15",
  event_time: "19:00:00",
  end_time: "21:00:00",
  recurrence: "none" as const,
  category: "date_night" as const,
  color: null,
  google_calendar_event_id: null,
  is_shared: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

describe("CreateEventForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit — create mode", () => {
    it("renders with 'New Event' title", () => {
      render(<CreateEventForm />)
      expect(screen.getByTestId("form-title")).toHaveTextContent("New Event")
    })

    it("renders all form fields", () => {
      render(<CreateEventForm />)
      expect(screen.getByTestId("title-input")).toBeInTheDocument()
      expect(screen.getByTestId("date-input")).toBeInTheDocument()
      expect(screen.getByTestId("allday-toggle")).toBeInTheDocument()
      expect(screen.getByTestId("description-input")).toBeInTheDocument()
      expect(screen.getByTestId("recurrence-pills")).toBeInTheDocument()
      expect(screen.getByTestId("category-cards")).toBeInTheDocument()
      expect(screen.getByTestId("share-toggle")).toBeInTheDocument()
      expect(screen.getByTestId("submit-button")).toBeInTheDocument()
    })

    it("defaults to all-day (time pickers hidden)", () => {
      render(<CreateEventForm />)
      expect(screen.queryByTestId("time-pickers")).not.toBeInTheDocument()
    })

    it("shows time pickers when all-day is toggled off", () => {
      render(<CreateEventForm />)
      fireEvent.click(screen.getByTestId("allday-toggle"))
      expect(screen.getByTestId("time-pickers")).toBeInTheDocument()
      expect(screen.getByTestId("start-time-input")).toBeInTheDocument()
      expect(screen.getByTestId("end-time-input")).toBeInTheDocument()
    })

    it("defaults to 'other' category", () => {
      render(<CreateEventForm />)
      const otherBtn = screen.getByTestId("category-other")
      expect(otherBtn.style.backgroundColor).toBeTruthy()
    })

    it("defaults to 'One-time' recurrence", () => {
      render(<CreateEventForm />)
      const noneBtn = screen.getByTestId("recurrence-none")
      expect(noneBtn.className).toContain("bg-[var(--accent-copper")
    })

    it("submit button shows 'Create Event'", () => {
      render(<CreateEventForm />)
      expect(screen.getByTestId("submit-button")).toHaveTextContent("Create Event")
    })

    it("submit button is disabled when title is empty", () => {
      render(<CreateEventForm />)
      expect(screen.getByTestId("submit-button")).toBeDisabled()
    })

    it("submit button is enabled when title is filled", () => {
      render(<CreateEventForm />)
      fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Test" } })
      expect(screen.getByTestId("submit-button")).not.toBeDisabled()
    })

    it("uses defaultDate prop to pre-fill date", () => {
      render(<CreateEventForm defaultDate="2026-06-15" />)
      expect(screen.getByTestId("date-input")).toHaveValue("2026-06-15")
    })

    it("limits description to 500 characters", () => {
      render(<CreateEventForm />)
      const desc = screen.getByTestId("description-input")
      const longText = "a".repeat(600)
      fireEvent.change(desc, { target: { value: longText } })
      // Should not update beyond 500
      expect((desc as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(500)
    })

    it("does not show delete button in create mode", () => {
      render(<CreateEventForm />)
      expect(screen.queryByTestId("delete-button")).not.toBeInTheDocument()
    })
  })

  describe("unit — edit mode", () => {
    it("renders with 'Edit Event' title", () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      expect(screen.getByTestId("form-title")).toHaveTextContent("Edit Event")
    })

    it("pre-fills title from initialEvent", () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      expect(screen.getByTestId("title-input")).toHaveValue("Date Night")
    })

    it("pre-fills date from initialEvent", () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      expect(screen.getByTestId("date-input")).toHaveValue("2026-04-15")
    })

    it("shows time pickers when event has time", () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      expect(screen.getByTestId("time-pickers")).toBeInTheDocument()
      expect(screen.getByTestId("start-time-input")).toHaveValue("19:00")
      expect(screen.getByTestId("end-time-input")).toHaveValue("21:00")
    })

    it("pre-fills description", () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      expect(screen.getByTestId("description-input")).toHaveValue("Dinner at that place")
    })

    it("submit button shows 'Save Changes'", () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      expect(screen.getByTestId("submit-button")).toHaveTextContent("Save Changes")
    })

    it("shows delete button for own events", () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      expect(screen.getByTestId("delete-button")).toBeInTheDocument()
    })

    it("shows 'Event Details' title for partner events (read-only)", () => {
      const partnerEvent = { ...MOCK_EVENT, creator_id: "user-2" }
      render(<CreateEventForm initialEvent={partnerEvent} mode="edit" />)
      expect(screen.getByTestId("form-title")).toHaveTextContent("Event Details")
    })

    it("hides submit button for partner events", () => {
      const partnerEvent = { ...MOCK_EVENT, creator_id: "user-2" }
      render(<CreateEventForm initialEvent={partnerEvent} mode="edit" />)
      expect(screen.queryByTestId("submit-button")).not.toBeInTheDocument()
    })
  })

  // ── Interaction Tests ────────────────────────────────────────

  describe("interaction", () => {
    it("toggles category on click", () => {
      render(<CreateEventForm />)
      const milestoneBtn = screen.getByTestId("category-milestone")
      fireEvent.click(milestoneBtn)
      // Check it gets active styling (has background color)
      expect(milestoneBtn.style.backgroundColor).toBeTruthy()
    })

    it("toggles recurrence on click", () => {
      render(<CreateEventForm />)
      const weeklyBtn = screen.getByTestId("recurrence-weekly")
      fireEvent.click(weeklyBtn)
      expect(weeklyBtn.className).toContain("bg-[var(--accent-copper")
    })

    it("clicking back navigates back", () => {
      render(<CreateEventForm />)
      fireEvent.click(screen.getByTestId("back-button"))
      expect(mockBack).toHaveBeenCalled()
    })

    it("shows delete confirmation on delete click", () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      fireEvent.click(screen.getByTestId("delete-button"))
      expect(screen.getByTestId("delete-confirm")).toBeInTheDocument()
    })

    it("cancels delete on cancel click", () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      fireEvent.click(screen.getByTestId("delete-button"))
      fireEvent.click(screen.getByTestId("delete-cancel"))
      expect(screen.queryByTestId("delete-confirm")).not.toBeInTheDocument()
    })
  })

  // ── Integration Tests ────────────────────────────────────────

  describe("integration", () => {
    it("calls createEvent with correct payload on submit", async () => {
      render(<CreateEventForm defaultDate="2026-06-15" />)

      // Fill title
      fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Test Event" } })

      // Select milestone category
      fireEvent.click(screen.getByTestId("category-milestone"))

      // Select monthly recurrence
      fireEvent.click(screen.getByTestId("recurrence-monthly"))

      // Submit
      fireEvent.click(screen.getByTestId("submit-button"))

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalledWith({
          title: "Test Event",
          event_date: "2026-06-15",
          event_time: null,
          end_time: null,
          description: null,
          recurrence: "monthly",
          category: "milestone",
          is_shared: true,
        })
      })
    })

    it("calls updateEvent on edit submit", async () => {
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)

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
      render(<CreateEventForm initialEvent={MOCK_EVENT} mode="edit" />)
      fireEvent.click(screen.getByTestId("delete-button"))
      fireEvent.click(screen.getByTestId("delete-confirm-btn"))

      await waitFor(() => {
        expect(mockDeleteEvent).toHaveBeenCalledWith("evt-1")
      })
    })

    it("navigates back after successful create", async () => {
      render(<CreateEventForm />)
      fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Test" } })
      fireEvent.click(screen.getByTestId("submit-button"))

      await waitFor(() => {
        expect(mockBack).toHaveBeenCalled()
      })
    })

    it("sends event_time when not all-day", async () => {
      render(<CreateEventForm />)
      fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Timed Event" } })
      fireEvent.click(screen.getByTestId("allday-toggle"))
      fireEvent.change(screen.getByTestId("start-time-input"), { target: { value: "14:30" } })
      fireEvent.click(screen.getByTestId("submit-button"))

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            event_time: "14:30:00",
          })
        )
      })
    })

    it("sends null event_time when all-day", async () => {
      render(<CreateEventForm />)
      fireEvent.change(screen.getByTestId("title-input"), { target: { value: "All Day" } })
      fireEvent.click(screen.getByTestId("submit-button"))

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            event_time: null,
            end_time: null,
          })
        )
      })
    })
  })
})
