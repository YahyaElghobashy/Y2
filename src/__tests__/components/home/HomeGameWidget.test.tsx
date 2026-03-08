import { vi, describe, it, expect, beforeEach } from "vitest"

// ─── Mocks (before component imports) ───

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, ...rest } = props
      return <button {...rest}>{children}</button>
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <p {...rest}>{children}</p>
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <span {...rest}>{children}</span>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

let mockUser: any = { id: "user-1", user_metadata: { display_name: "Yahya" } }

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}))

let mockSchedulesData: any[] | null = null
let mockSessionsData: any[] | null = null
let mockNeverResolve = false

const createChain = (table: string) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() => {
      if (mockNeverResolve) return new Promise(() => {})
      if (table === "game_schedules") {
        return Promise.resolve({ data: mockSchedulesData })
      }
      if (table === "game_sessions") {
        return Promise.resolve({ data: mockSessionsData })
      }
      return Promise.resolve({ data: null })
    }),
  }
  return chain
}

const mockFrom = vi.fn().mockImplementation((table: string) => createChain(table))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: mockFrom,
  }),
}))

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { HomeGameWidget } from "@/components/home/HomeGameWidget"

describe("HomeGameWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: "user-1", user_metadata: { display_name: "Yahya" } }
    mockSchedulesData = null
    mockSessionsData = null
    mockNeverResolve = false
    // Restore original mockFrom implementation
    mockFrom.mockImplementation((table: string) => createChain(table))
  })

  it("returns null when loading", () => {
    // Loading state: supabase calls never resolve
    mockNeverResolve = true

    const { container } = render(<HomeGameWidget />)
    expect(container.innerHTML).toBe("")
  })

  it("returns null when no schedule and no active session", async () => {
    mockSchedulesData = []
    mockSessionsData = []

    const { container } = render(<HomeGameWidget />)

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("game_schedules")
    })

    // After loading, still null
    await waitFor(() => {
      expect(container.innerHTML).toBe("")
    })
  })

  it('shows active session with "Resume" and mode name', async () => {
    mockSchedulesData = []
    mockSessionsData = [
      {
        id: "session-1",
        mode: "check_in" as const,
        status: "playing",
        completed_rounds: 2,
        total_rounds: 5,
        created_by: "user-1",
        updated_at: "2026-03-01T10:00:00Z",
      },
    ]

    render(<HomeGameWidget />)

    await waitFor(() => {
      expect(screen.getByText(/Resume/)).toBeInTheDocument()
    })
    expect(screen.getByText("Alignment Check-In")).toBeInTheDocument()
  })

  it('shows "In Progress" for playing session', async () => {
    mockSchedulesData = []
    mockSessionsData = [
      {
        id: "session-1",
        mode: "deep_dive" as const,
        status: "playing",
        completed_rounds: 1,
        total_rounds: 5,
        created_by: "user-1",
        updated_at: "2026-03-01T10:00:00Z",
      },
    ]

    render(<HomeGameWidget />)

    await waitFor(() => {
      expect(screen.getByText("In Progress")).toBeInTheDocument()
    })
  })

  it('shows "Paused" for paused session', async () => {
    mockSchedulesData = []
    mockSessionsData = [
      {
        id: "session-1",
        mode: "date_night" as const,
        status: "paused",
        completed_rounds: 3,
        total_rounds: 5,
        created_by: "user-1",
        updated_at: "2026-03-01T10:00:00Z",
      },
    ]

    render(<HomeGameWidget />)

    await waitFor(() => {
      expect(screen.getByText("Paused")).toBeInTheDocument()
    })
  })

  it('shows round progress (e.g. "Round 2/5")', async () => {
    mockSchedulesData = []
    mockSessionsData = [
      {
        id: "session-1",
        mode: "check_in" as const,
        status: "playing",
        completed_rounds: 2,
        total_rounds: 5,
        created_by: "user-1",
        updated_at: "2026-03-01T10:00:00Z",
      },
    ]

    render(<HomeGameWidget />)

    await waitFor(() => {
      expect(screen.getByText("Round 2/5")).toBeInTheDocument()
    })
  })

  it("shows scheduled game with due time text", async () => {
    // Schedule due in 2 days from now
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 2)

    mockSchedulesData = [
      {
        id: "sched-1",
        mode: "check_in" as const,
        recurrence: "monthly",
        day_of_week: 5,
        preferred_time: "20:00",
        config: {},
        is_active: true,
        next_due_at: futureDate.toISOString(),
        created_by: "user-1",
      },
    ]
    mockSessionsData = []

    render(<HomeGameWidget />)

    await waitFor(() => {
      expect(screen.getByText(/Monthly Check-In due/)).toBeInTheDocument()
    })
  })

  it("shows overdue message for past-due schedules", async () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 3)

    mockSchedulesData = [
      {
        id: "sched-1",
        mode: "check_in" as const,
        recurrence: "monthly",
        day_of_week: 5,
        preferred_time: "20:00",
        config: {},
        is_active: true,
        next_due_at: pastDate.toISOString(),
        created_by: "user-1",
      },
    ]
    mockSessionsData = []

    render(<HomeGameWidget />)

    await waitFor(() => {
      expect(screen.getByText(/overdue/)).toBeInTheDocument()
    })
  })

  it("navigates to play page when active session clicked", async () => {
    mockSchedulesData = []
    mockSessionsData = [
      {
        id: "session-abc",
        mode: "check_in" as const,
        status: "playing",
        completed_rounds: 1,
        total_rounds: 5,
        created_by: "user-1",
        updated_at: "2026-03-01T10:00:00Z",
      },
    ]

    render(<HomeGameWidget />)

    await waitFor(() => {
      expect(screen.getByText(/Resume/)).toBeInTheDocument()
    })

    // The whole widget is a button; click it
    const resumeButton = screen.getByText(/Resume/).closest("button")
    fireEvent.click(resumeButton!)

    expect(mockPush).toHaveBeenCalledWith("/game/check-in/play?session=session-abc")
  })
})
