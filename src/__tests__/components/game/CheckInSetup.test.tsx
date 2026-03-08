import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ─── Mocks ───

const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}))

const mockCreateSession = vi.fn()
const mockStartSession = vi.fn()

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => ({
    createSession: mockCreateSession,
    startSession: mockStartSession,
  }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    partner: { id: "user-2", display_name: "Yara" },
    isLoading: false,
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: any) => children,
}))

import { CheckInSetup } from "@/components/game/CheckInSetup"

describe("CheckInSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSession.mockResolvedValue("session-1")
    mockStartSession.mockResolvedValue(undefined)
  })

  // ─── Unit: Renders correctly ───

  it("renders the Monthly Check-In heading", () => {
    render(<CheckInSetup />)
    expect(screen.getByText("Monthly Check-In")).toBeTruthy()
  })

  it("renders Arabic subtitle", () => {
    render(<CheckInSetup />)
    expect(screen.getByText(/الميزان/)).toBeTruthy()
  })

  it("renders all 8 category buttons", () => {
    render(<CheckInSetup />)

    expect(screen.getByText("Communication")).toBeTruthy()
    expect(screen.getByText("Intimacy")).toBeTruthy()
    expect(screen.getByText("Finances")).toBeTruthy()
    expect(screen.getByText("Faith")).toBeTruthy()
    expect(screen.getByText("Family")).toBeTruthy()
    expect(screen.getByText("Lifestyle")).toBeTruthy()
    expect(screen.getByText("Dreams")).toBeTruthy()
    expect(screen.getByText("Conflict")).toBeTruthy()
  })

  it("renders question count slider with default value", () => {
    render(<CheckInSetup />)
    expect(screen.getByText("10")).toBeTruthy()
    expect(screen.getByText("How many questions?")).toBeTruthy()
  })

  it("renders relationship pulse section", () => {
    render(<CheckInSetup />)
    expect(screen.getByText("Relationship Pulse")).toBeTruthy()
  })

  it("renders open discussion toggle", () => {
    render(<CheckInSetup />)
    expect(screen.getByText("Include open discussion?")).toBeTruthy()
  })

  it("renders begin button in disabled state initially", () => {
    render(<CheckInSetup />)
    const btn = screen.getByText(/Begin Check-In/)
    expect(btn.closest("button")).toHaveProperty("disabled", true)
  })

  // ─── Interaction: Category selection ───

  it("enables begin button when categories are selected", () => {
    render(<CheckInSetup />)

    const commBtn = screen.getByText("Communication")
    fireEvent.click(commBtn)

    const beginBtn = screen.getByText(/Begin Check-In/)
    expect(beginBtn.closest("button")).toHaveProperty("disabled", false)
  })

  it("toggles category on repeated click", () => {
    render(<CheckInSetup />)

    const commBtn = screen.getByText("Communication")
    fireEvent.click(commBtn) // Select
    fireEvent.click(commBtn) // Deselect

    const beginBtn = screen.getByText(/Begin Check-In/)
    expect(beginBtn.closest("button")).toHaveProperty("disabled", true)
  })

  // ─── Interaction: Question count slider ───

  it("shows time estimate based on question count", () => {
    render(<CheckInSetup />)
    // Default 10 questions * 2 min = ~20 minutes
    expect(screen.getByText("~20 minutes estimate")).toBeTruthy()
  })

  // ─── Interaction: Begin session ───

  it("calls createSession with correct config on begin", async () => {
    render(<CheckInSetup />)

    // Select a category
    fireEvent.click(screen.getByText("Communication"))

    // Click begin
    fireEvent.click(screen.getByText(/Begin Check-In/))

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith("check_in", expect.objectContaining({
        categories: ["communication"],
        questionCount: 10,
        includeOpenDiscussion: false,
        relationshipPulse: 7,
      }))
    })
  })

  it("navigates to play screen after session creation", async () => {
    render(<CheckInSetup />)

    fireEvent.click(screen.getByText("Faith"))
    fireEvent.click(screen.getByText(/Begin Check-In/))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/game/check-in/play?session=session-1")
    })
  })

  it("does not navigate if createSession returns null", async () => {
    mockCreateSession.mockResolvedValue(null)

    render(<CheckInSetup />)

    fireEvent.click(screen.getByText("Faith"))
    fireEvent.click(screen.getByText(/Begin Check-In/))

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  // ─── Navigation ───

  it("navigates back when back button is clicked", () => {
    render(<CheckInSetup />)

    // Find the back button (contains ArrowLeft icon)
    const backBtns = screen.getAllByRole("button")
    fireEvent.click(backBtns[0]) // First button is the back button

    expect(mockBack).toHaveBeenCalled()
  })
})
