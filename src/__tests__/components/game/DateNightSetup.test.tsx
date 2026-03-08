import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ─── Mocks ───

const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}))

const mockCreateSession = vi.fn()

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => ({
    createSession: mockCreateSession,
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

import { DateNightSetup } from "@/components/game/DateNightSetup"

describe("DateNightSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateSession.mockResolvedValue("session-dn-1")
  })

  // ─── Unit: Step 1 renders correctly ───

  it("renders the Date Night Game heading", () => {
    render(<DateNightSetup />)
    expect(screen.getByText("Date Night Game")).toBeTruthy()
  })

  it("renders Arabic subtitle", () => {
    render(<DateNightSetup />)
    expect(screen.getByText(/لعبة/)).toBeTruthy()
  })

  it("renders progress dots for 3 steps", () => {
    const { container } = render(<DateNightSetup />)
    // Progress dots are in a flex container with gap-2 py-3
    const dotsContainer = container.querySelector(".flex.items-center.justify-center.gap-2.py-3")
    const dots = dotsContainer?.children
    expect(dots?.length).toBe(3)
  })

  it("renders category grid with 8 categories on step 1", () => {
    render(<DateNightSetup />)

    expect(screen.getByText("Love")).toBeTruthy()
    expect(screen.getByText("Communication")).toBeTruthy()
    expect(screen.getByText("Faith")).toBeTruthy()
    expect(screen.getByText("Family")).toBeTruthy()
    expect(screen.getByText("Lifestyle")).toBeTruthy()
    expect(screen.getByText("Dreams")).toBeTruthy()
    expect(screen.getByText("Vulnerability")).toBeTruthy()
    expect(screen.getByText("Travel")).toBeTruthy()
  })

  it("renders questions-per-category slider with default of 3", () => {
    render(<DateNightSetup />)
    expect(screen.getByText("Questions per category")).toBeTruthy()
    expect(screen.getByText("3")).toBeTruthy()
  })

  it("renders Next button disabled when no categories selected", () => {
    render(<DateNightSetup />)
    const nextBtn = screen.getByText(/Next/)
    expect(nextBtn.closest("button")).toHaveProperty("disabled", true)
  })

  // ─── Interaction: Category toggle ───

  it("enables Next button when a category is selected", () => {
    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love"))

    const nextBtn = screen.getByText(/Next/)
    expect(nextBtn.closest("button")).toHaveProperty("disabled", false)
  })

  it("toggles category off on repeated click", () => {
    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love")) // Select
    fireEvent.click(screen.getByText("Love")) // Deselect

    const nextBtn = screen.getByText(/Next/)
    expect(nextBtn.closest("button")).toHaveProperty("disabled", true)
  })

  it("allows multiple categories to be selected", () => {
    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText("Faith"))
    fireEvent.click(screen.getByText("Dreams"))

    const nextBtn = screen.getByText(/Next/)
    expect(nextBtn.closest("button")).toHaveProperty("disabled", false)
  })

  // ─── Interaction: Wizard step navigation ───

  it("advances to step 2 when Next is clicked", () => {
    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText(/Next/))

    // Step 2 should show dares section
    expect(screen.getByText(/Enable Dares/)).toBeTruthy()
  })

  it("renders step 2 dare controls", () => {
    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText(/Next/))

    expect(screen.getByText(/Enable Dares/)).toBeTruthy()
    expect(screen.getByText(/Max heat level/)).toBeTruthy()
    expect(screen.getByText("Mild")).toBeTruthy()
    expect(screen.getByText("Medium")).toBeTruthy()
    expect(screen.getByText("Intense")).toBeTruthy()
    expect(screen.getByText("Dare rounds")).toBeTruthy()
    expect(screen.getByText(/Truth or Dare rounds/)).toBeTruthy()
  })

  it("advances to step 3 from step 2", () => {
    render(<DateNightSetup />)

    // Step 1 → 2
    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText(/Next/))

    // Step 2 → 3
    fireEvent.click(screen.getByText(/Next/))

    // Step 3 should show custom questions toggle and game preview
    expect(screen.getByText(/Write for each other/)).toBeTruthy()
    expect(screen.getByText("Game Preview")).toBeTruthy()
  })

  it("renders game preview summary on step 3", () => {
    render(<DateNightSetup />)

    // Select 2 categories (Love, Faith)
    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText("Faith"))

    // Step 1 → 2 → 3
    fireEvent.click(screen.getByText(/Next/))
    fireEvent.click(screen.getByText(/Next/))

    // 2 categories * 3 questions + 3 wildcard dares = 9 total rounds
    expect(screen.getByText("9")).toBeTruthy() // Total Rounds
    expect(screen.getByText("2")).toBeTruthy() // Categories
    expect(screen.getByText("Total Rounds")).toBeTruthy()
    expect(screen.getByText("Categories")).toBeTruthy()
  })

  it("navigates back through wizard steps", () => {
    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText(/Next/)) // Go to step 2

    // Click the back arrow (first button)
    const backBtns = screen.getAllByRole("button")
    fireEvent.click(backBtns[0])

    // Should be back on step 1 with categories visible
    expect(screen.getByText("Choose categories")).toBeTruthy()
  })

  it("calls router.back() when back is pressed on step 1", () => {
    render(<DateNightSetup />)

    const backBtns = screen.getAllByRole("button")
    fireEvent.click(backBtns[0])

    expect(mockBack).toHaveBeenCalled()
  })

  // ─── Interaction: Session creation (step 3) ───

  it("shows 'Write Cards for Partner' when custom questions enabled", () => {
    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText(/Next/))
    fireEvent.click(screen.getByText(/Next/))

    // Custom questions enabled by default
    expect(screen.getByText(/Write Cards for Partner/)).toBeTruthy()
  })

  it("navigates to author page when custom questions are enabled", async () => {
    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText(/Next/))
    fireEvent.click(screen.getByText(/Next/))

    fireEvent.click(screen.getByText(/Write Cards for Partner/))

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith("date_night", expect.objectContaining({
        categories: ["love"],
        questionsPerCategory: 3,
        daresEnabled: true,
        maxHeatLevel: 2,
        customQuestionsEnabled: true,
      }))
      expect(mockPush).toHaveBeenCalledWith("/game/date-night/author?session=session-dn-1")
    })
  })

  it("navigates to play page when custom questions are disabled", async () => {
    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText(/Next/))
    fireEvent.click(screen.getByText(/Next/))

    // Toggle off custom questions — find the card wrapping "Write for each other"
    // The toggle button is inside the same flex container
    const writeLabel = screen.getByText(/Write for each other/)
    // Go up to the card container (the flex div that has both label and toggle)
    const cardContainer = writeLabel.closest(".flex.items-center.justify-between")
      ?? writeLabel.parentElement?.parentElement
    const toggleBtn = cardContainer?.querySelector("button")
    if (toggleBtn) fireEvent.click(toggleBtn)

    // Now the button should say "Start Game" since custom is off
    await waitFor(() => {
      const startBtn = screen.getByText(/Start Game/)
      expect(startBtn).toBeTruthy()
    })

    fireEvent.click(screen.getByText(/Start Game/))

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith("date_night", expect.objectContaining({
        customQuestionsEnabled: false,
      }))
      expect(mockPush).toHaveBeenCalledWith("/game/date-night/play?session=session-dn-1")
    })
  })

  it("does not navigate when createSession returns null", async () => {
    mockCreateSession.mockResolvedValue(null)

    render(<DateNightSetup />)

    fireEvent.click(screen.getByText("Love"))
    fireEvent.click(screen.getByText(/Next/))
    fireEvent.click(screen.getByText(/Next/))
    fireEvent.click(screen.getByText(/Write Cards for Partner/))

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
