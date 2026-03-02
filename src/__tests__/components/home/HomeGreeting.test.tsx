import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import { HomeGreeting } from "@/components/home/HomeGreeting"

// Mock date-fns format to avoid time-zone flakiness
vi.mock("date-fns", () => ({
  format: () => "Monday, March 2",
}))

describe("HomeGreeting", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders greeting with default name Yahya", () => {
    render(<HomeGreeting />)
    expect(screen.getByText(/Yahya/)).toBeInTheDocument()
  })

  it("renders a time-aware greeting containing Good", () => {
    render(<HomeGreeting />)
    expect(screen.getByText(/Good/)).toBeInTheDocument()
  })

  it("renders formatted date", () => {
    render(<HomeGreeting />)
    expect(screen.getByText("Monday, March 2")).toBeInTheDocument()
  })

  it("accepts custom name prop", () => {
    render(<HomeGreeting name="Yara" />)
    expect(screen.getByText(/Yara/)).toBeInTheDocument()
  })

  it("shows Good morning between 5am and noon", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 2, 8, 0, 0))
    render(<HomeGreeting />)
    expect(screen.getByText(/Good morning/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it("shows Good afternoon between noon and 5pm", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 2, 14, 0, 0))
    render(<HomeGreeting />)
    expect(screen.getByText(/Good afternoon/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it("shows Good evening between 5pm and 9pm", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 2, 19, 0, 0))
    render(<HomeGreeting />)
    expect(screen.getByText(/Good evening/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it("shows Good night after 9pm", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 2, 23, 0, 0))
    render(<HomeGreeting />)
    expect(screen.getByText(/Good night/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it("shows Good night between midnight and 5am", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 2, 2, 0, 0))
    render(<HomeGreeting />)
    expect(screen.getByText(/Good night/)).toBeInTheDocument()
    vi.useRealTimers()
  })
})
