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
    h2: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <h2 {...rest}>{children}</h2>
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
const mockBack = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", user_metadata: { display_name: "Yahya" } },
  }),
}))

const mockInsert = vi.fn().mockResolvedValue({ error: null })

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}))

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { GameScheduleSettings } from "@/components/game/GameScheduleSettings"

describe("GameScheduleSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Schedule Game" heading', () => {
    render(<GameScheduleSettings />)
    expect(screen.getByText("Schedule Game")).toBeInTheDocument()
  })

  it("shows mode selection cards (3 modes)", () => {
    render(<GameScheduleSettings />)
    // The component renders the first word of each mode label
    // check_in => "Alignment" => "Alignment".split(" ")[0] => "Alignment"
    // deep_dive => "Deep Dive" => "Deep"
    // date_night => "Date Night Game" => "Date"
    const buttons = screen.getAllByRole("button")
    // Three mode cards + back button + 3 recurrence + 7 days + save = 15
    // Mode emojis are present
    expect(screen.getByText(/Alignment/i)).toBeInTheDocument()
    expect(screen.getByText(/Deep/i)).toBeInTheDocument()
    expect(screen.getByText(/Date/i)).toBeInTheDocument()
  })

  it("shows recurrence options (Every week, Every 2 weeks, Monthly)", () => {
    render(<GameScheduleSettings />)
    expect(screen.getByText("Every week")).toBeInTheDocument()
    expect(screen.getByText("Every 2 weeks")).toBeInTheDocument()
    expect(screen.getByText("Monthly")).toBeInTheDocument()
  })

  it("shows day-of-week picker with 7 days (Sun-Sat)", () => {
    render(<GameScheduleSettings />)
    expect(screen.getByText("Sun")).toBeInTheDocument()
    expect(screen.getByText("Mon")).toBeInTheDocument()
    expect(screen.getByText("Tue")).toBeInTheDocument()
    expect(screen.getByText("Wed")).toBeInTheDocument()
    expect(screen.getByText("Thu")).toBeInTheDocument()
    expect(screen.getByText("Fri")).toBeInTheDocument()
    expect(screen.getByText("Sat")).toBeInTheDocument()
  })

  it("shows time input", () => {
    render(<GameScheduleSettings />)
    const timeInput = screen.getByDisplayValue("20:00")
    expect(timeInput).toBeInTheDocument()
    expect(timeInput).toHaveAttribute("type", "time")
  })

  it("shows notification preview text", () => {
    render(<GameScheduleSettings />)
    // Default mode is check_in
    expect(screen.getByText(/Monthly check-in time/)).toBeInTheDocument()
  })

  it("shows category selector when deep_dive mode selected", () => {
    render(<GameScheduleSettings />)

    // Click deep_dive mode card (the one containing "Deep" text, which is an emoji + "Deep" span)
    // Find the button with the Deep text
    const deepButton = screen.getByText(/^Deep$/i).closest("button")
    fireEvent.click(deepButton!)

    expect(screen.getByText("Category to explore")).toBeInTheDocument()
  })

  it("calls supabase insert on save with correct payload", async () => {
    render(<GameScheduleSettings />)

    // Click save
    const saveButton = screen.getByRole("button", { name: /Schedule/ })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1)
    })

    const insertPayload = mockInsert.mock.calls[0][0]
    expect(insertPayload).toMatchObject({
      created_by: "user-1",
      mode: "check_in",
      recurrence: "monthly",
      day_of_week: 5,
      preferred_time: "20:00",
      is_active: true,
    })
    expect(insertPayload.config).toEqual({})
    expect(insertPayload.next_due_at).toBeDefined()
  })

  it('shows "Scheduled!" after save', async () => {
    render(<GameScheduleSettings />)

    const saveButton = screen.getByRole("button", { name: /Schedule/ })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/Scheduled!/)).toBeInTheDocument()
    })
  })
})
