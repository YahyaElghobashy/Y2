import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"

// Mock date-fns format to avoid time-zone flakiness
vi.mock("date-fns", () => ({
  format: () => "Monday, March 2",
}))

// Mock useAuth
const mockAuthReturn = {
  user: { id: "user-1" },
  profile: {
    id: "user-1",
    display_name: "Yahya",
    email: "yahya@test.com",
    avatar_url: null,
    partner_id: "user-2",
    role: "user",
    created_at: "",
    updated_at: "",
  },
  partner: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuthReturn,
}))

import { HomeGreeting } from "@/components/home/HomeGreeting"

describe("HomeGreeting", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders greeting with profile.display_name from useAuth()", () => {
    render(<HomeGreeting />)
    expect(screen.getByText(/Yahya/)).toBeInTheDocument()
  })

  it('renders "Good morning, there" when profile is null', () => {
    mockAuthReturn.profile = null as never
    render(<HomeGreeting />)
    expect(screen.getByText(/there/)).toBeInTheDocument()
    // Restore
    mockAuthReturn.profile = {
      id: "user-1",
      display_name: "Yahya",
      email: "yahya@test.com",
      avatar_url: null,
      partner_id: "user-2",
      role: "user",
      created_at: "",
      updated_at: "",
    }
  })

  it('renders "Good morning, there" when profile.display_name is undefined', () => {
    mockAuthReturn.profile = {
      id: "user-1",
      display_name: undefined as never,
      email: "yahya@test.com",
      avatar_url: null,
      partner_id: "user-2",
      role: "user",
      created_at: "",
      updated_at: "",
    }
    render(<HomeGreeting />)
    expect(screen.getByText(/there/)).toBeInTheDocument()
    // Restore
    mockAuthReturn.profile = {
      id: "user-1",
      display_name: "Yahya",
      email: "yahya@test.com",
      avatar_url: null,
      partner_id: "user-2",
      role: "user",
      created_at: "",
      updated_at: "",
    }
  })

  it("renders a time-aware greeting containing Good", () => {
    render(<HomeGreeting />)
    expect(screen.getByText(/Good/)).toBeInTheDocument()
  })

  it("renders formatted date", () => {
    render(<HomeGreeting />)
    expect(screen.getByText("Monday, March 2")).toBeInTheDocument()
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
})
