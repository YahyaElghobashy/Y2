import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ReminderPicker } from "@/components/calendar/ReminderPicker"

describe("ReminderPicker", () => {
  const mockToggle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──

  it("renders the reminder picker container", () => {
    render(<ReminderPicker selected={[]} onToggle={mockToggle} />)
    expect(screen.getByTestId("reminder-picker")).toBeInTheDocument()
  })

  it("renders 'Reminders' label", () => {
    render(<ReminderPicker selected={[]} onToggle={mockToggle} />)
    expect(screen.getByText("Reminders")).toBeInTheDocument()
  })

  it("shows all 5 presets when not all-day", () => {
    render(<ReminderPicker selected={[]} onToggle={mockToggle} allDay={false} />)
    const pills = screen.getByTestId("reminder-pills")
    expect(pills.children).toHaveLength(5)
    expect(screen.getByText("At time")).toBeInTheDocument()
    expect(screen.getByText("15 min")).toBeInTheDocument()
    expect(screen.getByText("1 hour")).toBeInTheDocument()
    expect(screen.getByText("1 day")).toBeInTheDocument()
    expect(screen.getByText("1 week")).toBeInTheDocument()
  })

  it("hides 'At time' and '15 min' for all-day events", () => {
    render(<ReminderPicker selected={[]} onToggle={mockToggle} allDay={true} />)
    expect(screen.queryByText("At time")).not.toBeInTheDocument()
    expect(screen.queryByText("15 min")).not.toBeInTheDocument()
    expect(screen.getByText("1 hour")).toBeInTheDocument()
    expect(screen.getByText("1 day")).toBeInTheDocument()
    expect(screen.getByText("1 week")).toBeInTheDocument()
  })

  it("shows 3 presets for all-day events", () => {
    render(<ReminderPicker selected={[]} onToggle={mockToggle} allDay={true} />)
    const pills = screen.getByTestId("reminder-pills")
    expect(pills.children).toHaveLength(3)
  })

  it("highlights selected reminders", () => {
    render(
      <ReminderPicker
        selected={["1 hour", "1 day"]}
        onToggle={mockToggle}
        allDay={false}
      />
    )
    expect(screen.getByTestId("reminder-1-hour").getAttribute("data-active")).toBe("true")
    expect(screen.getByTestId("reminder-1-day").getAttribute("data-active")).toBe("true")
    expect(screen.getByTestId("reminder-15-minutes").getAttribute("data-active")).toBe("false")
  })

  it("supports multiple selections", () => {
    render(
      <ReminderPicker
        selected={["0 seconds", "15 minutes", "7 days"]}
        onToggle={mockToggle}
        allDay={false}
      />
    )
    expect(screen.getByTestId("reminder-0-seconds").getAttribute("data-active")).toBe("true")
    expect(screen.getByTestId("reminder-15-minutes").getAttribute("data-active")).toBe("true")
    expect(screen.getByTestId("reminder-7-days").getAttribute("data-active")).toBe("true")
  })

  // ── Interaction Tests ──

  it("calls onToggle with correct value when pill clicked", () => {
    render(
      <ReminderPicker selected={[]} onToggle={mockToggle} allDay={false} />
    )
    fireEvent.click(screen.getByText("1 hour"))
    expect(mockToggle).toHaveBeenCalledWith("1 hour")
  })

  it("calls onToggle when deselecting", () => {
    render(
      <ReminderPicker
        selected={["1 hour"]}
        onToggle={mockToggle}
        allDay={false}
      />
    )
    fireEvent.click(screen.getByText("1 hour"))
    expect(mockToggle).toHaveBeenCalledWith("1 hour")
  })

  it("does not call onToggle when disabled", () => {
    render(
      <ReminderPicker
        selected={[]}
        onToggle={mockToggle}
        allDay={false}
        disabled={true}
      />
    )
    fireEvent.click(screen.getByText("1 hour"))
    expect(mockToggle).not.toHaveBeenCalled()
  })

  // ── Integration Tests ──

  it("renders correct data-testid for each preset", () => {
    render(
      <ReminderPicker selected={[]} onToggle={mockToggle} allDay={false} />
    )
    expect(screen.getByTestId("reminder-0-seconds")).toBeInTheDocument()
    expect(screen.getByTestId("reminder-15-minutes")).toBeInTheDocument()
    expect(screen.getByTestId("reminder-1-hour")).toBeInTheDocument()
    expect(screen.getByTestId("reminder-1-day")).toBeInTheDocument()
    expect(screen.getByTestId("reminder-7-days")).toBeInTheDocument()
  })
})
