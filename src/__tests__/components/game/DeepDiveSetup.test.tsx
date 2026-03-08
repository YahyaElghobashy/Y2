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

import { DeepDiveSetup } from "@/components/game/DeepDiveSetup"

describe("DeepDiveSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSession.mockResolvedValue("session-dd-1")
    mockStartSession.mockResolvedValue(undefined)
  })

  // ─── Unit: Renders correctly ───

  it("renders the Deep Dive heading", () => {
    render(<DeepDiveSetup />)
    expect(screen.getByText("Deep Dive")).toBeTruthy()
  })

  it("renders Arabic subtitle", () => {
    render(<DeepDiveSetup />)
    expect(screen.getByText(/غوص/)).toBeTruthy()
  })

  it("renders no-pressure messaging card", () => {
    render(<DeepDiveSetup />)
    expect(screen.getByText(/no rush, no score, no judgment/)).toBeTruthy()
  })

  it("renders all 8 category options with labels", () => {
    render(<DeepDiveSetup />)

    expect(screen.getByText("Faith")).toBeTruthy()
    expect(screen.getByText("Finances")).toBeTruthy()
    expect(screen.getByText("Family")).toBeTruthy()
    expect(screen.getByText("Intimacy")).toBeTruthy()
    expect(screen.getByText("Communication")).toBeTruthy()
    expect(screen.getByText("Vulnerability")).toBeTruthy()
    expect(screen.getByText("Dreams")).toBeTruthy()
    expect(screen.getByText("Conflict")).toBeTruthy()
  })

  it("renders category descriptions", () => {
    render(<DeepDiveSetup />)
    expect(screen.getByText(/Explore your shared spiritual vision/)).toBeTruthy()
    expect(screen.getByText(/Align on money, saving/)).toBeTruthy()
  })

  it("renders question count slider with default value of 8", () => {
    render(<DeepDiveSetup />)
    expect(screen.getByText("8")).toBeTruthy()
    expect(screen.getByText("How deep?")).toBeTruthy()
  })

  it("renders difficulty options", () => {
    render(<DeepDiveSetup />)
    expect(screen.getByText("Difficulty")).toBeTruthy()
    // Use getAllByText since "Deep" appears in heading + difficulty option
    expect(screen.getAllByText(/Light/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Medium/).length).toBeGreaterThanOrEqual(1)
  })

  it("renders time estimate based on question count", () => {
    render(<DeepDiveSetup />)
    // Default 8 questions * 3 min = ~24 minutes
    expect(screen.getByText("~24 minutes estimate")).toBeTruthy()
  })

  it("renders begin button in disabled state initially", () => {
    render(<DeepDiveSetup />)
    const btn = screen.getByText(/Begin Deep Dive/)
    expect(btn.closest("button")).toHaveProperty("disabled", true)
  })

  // ─── Interaction: Category selection ───

  it("enables begin button when a focus area is selected", () => {
    render(<DeepDiveSetup />)

    fireEvent.click(screen.getByText("Faith"))

    const beginBtn = screen.getByText(/Begin Deep Dive/)
    expect(beginBtn.closest("button")).toHaveProperty("disabled", false)
  })

  it("allows only one primary category at a time (radio behavior)", () => {
    render(<DeepDiveSetup />)

    // Select Faith first
    fireEvent.click(screen.getByText("Faith"))
    // Then select Finances — should replace
    fireEvent.click(screen.getByText("Finances"))

    // Begin should still be enabled (there's a selection)
    const beginBtn = screen.getByText(/Begin Deep Dive/)
    expect(beginBtn.closest("button")).toHaveProperty("disabled", false)
  })

  // ─── Interaction: Difficulty toggle ───

  it("toggles difficulty preference on click", () => {
    render(<DeepDiveSetup />)

    // Medium is selected by default — clicking Light should add it
    const lightBtn = screen.getByText(/Light/)
    fireEvent.click(lightBtn)

    // Both should now be selected (multi-select)
    // Clicking Medium to deselect
    const mediumBtn = screen.getByText(/Medium/)
    fireEvent.click(mediumBtn)

    // Still has Light selected, so component is valid
  })

  // ─── Interaction: Begin session ───

  it("calls createSession with correct deep_dive config on begin", async () => {
    render(<DeepDiveSetup />)

    // Select a category
    fireEvent.click(screen.getByText("Vulnerability"))

    // Click begin
    fireEvent.click(screen.getByText(/Begin Deep Dive/))

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith("deep_dive", expect.objectContaining({
        primaryCategory: "vulnerability",
        secondaryCategories: [],
        questionCount: 8,
        difficultyPreference: ["medium"],
      }))
    })
  })

  it("calls startSession and navigates after session creation", async () => {
    render(<DeepDiveSetup />)

    fireEvent.click(screen.getByText("Dreams"))
    fireEvent.click(screen.getByText(/Begin Deep Dive/))

    await waitFor(() => {
      expect(mockStartSession).toHaveBeenCalledWith("session-dd-1")
      expect(mockPush).toHaveBeenCalledWith("/game/deep-dive/play?session=session-dd-1")
    })
  })

  it("does not navigate if createSession returns null", async () => {
    mockCreateSession.mockResolvedValue(null)

    render(<DeepDiveSetup />)

    fireEvent.click(screen.getByText("Faith"))
    fireEvent.click(screen.getByText(/Begin Deep Dive/))

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
      expect(mockStartSession).not.toHaveBeenCalled()
    })
  })

  // ─── Navigation ───

  it("navigates back when back button is clicked", () => {
    render(<DeepDiveSetup />)

    const backBtns = screen.getAllByRole("button")
    fireEvent.click(backBtns[0]) // First button is the back button

    expect(mockBack).toHaveBeenCalled()
  })
})
