import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ─── Mocks ───

const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useSearchParams: () => new URLSearchParams("session=session-pa-1"),
}))

const mockSaveCustomContent = vi.fn()
const mockStartSession = vi.fn()

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => ({
    saveCustomContent: mockSaveCustomContent,
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

const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null })
const mockFrom = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  limit: mockLimit,
})

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from: mockFrom }),
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

import { PartnerAuthoredSetup } from "@/components/game/PartnerAuthoredSetup"

describe("PartnerAuthoredSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSaveCustomContent.mockResolvedValue(undefined)
    mockStartSession.mockResolvedValue(undefined)
    mockLimit.mockResolvedValue({ data: [], error: null })
  })

  // ─── Unit: Renders correctly ───

  it("renders the header with partner name", () => {
    render(<PartnerAuthoredSetup />)
    expect(screen.getByText(/Write cards for Yara/)).toBeTruthy()
  })

  it("renders the privacy messaging", () => {
    render(<PartnerAuthoredSetup />)
    expect(screen.getByText(/won't see these until they come up/)).toBeTruthy()
  })

  it("renders questions section with counter", () => {
    render(<PartnerAuthoredSetup />)
    expect(screen.getByText(/Questions for Yara/)).toBeTruthy()
    expect(screen.getByText("0 of 5 questions")).toBeTruthy()
  })

  it("renders dares section with counter", () => {
    render(<PartnerAuthoredSetup />)
    expect(screen.getByText(/Dares for Yara/)).toBeTruthy()
    expect(screen.getByText("0 of 3 dares")).toBeTruthy()
  })

  it("renders question input placeholder with partner name", () => {
    render(<PartnerAuthoredSetup />)
    expect(screen.getByPlaceholderText(/Ask Yara something/)).toBeTruthy()
  })

  it("renders dare input placeholder", () => {
    render(<PartnerAuthoredSetup />)
    expect(screen.getByPlaceholderText(/Write a playful dare/)).toBeTruthy()
  })

  it("renders heat level buttons for dares", () => {
    render(<PartnerAuthoredSetup />)
    expect(screen.getByText("Mild")).toBeTruthy()
    expect(screen.getByText("Medium")).toBeTruthy()
    expect(screen.getByText("Intense")).toBeTruthy()
  })

  it("renders Done Writing button", () => {
    render(<PartnerAuthoredSetup />)
    expect(screen.getByText(/Done Writing/)).toBeTruthy()
  })

  // ─── Interaction: Adding questions ───

  it("adds a question when Add button is clicked", () => {
    render(<PartnerAuthoredSetup />)

    const input = screen.getByPlaceholderText(/Ask Yara something/)
    fireEvent.change(input, { target: { value: "What is your biggest dream?" } })

    const addButtons = screen.getAllByText(/^Add/)
    fireEvent.click(addButtons[0])

    expect(screen.getByText("What is your biggest dream?")).toBeTruthy()
    expect(screen.getByText("1 of 5 questions")).toBeTruthy()
  })

  it("adds a question on Enter key", () => {
    render(<PartnerAuthoredSetup />)

    const input = screen.getByPlaceholderText(/Ask Yara something/)
    fireEvent.change(input, { target: { value: "How do you feel today?" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(screen.getByText("How do you feel today?")).toBeTruthy()
  })

  it("clears input after adding a question", () => {
    render(<PartnerAuthoredSetup />)

    const input = screen.getByPlaceholderText(/Ask Yara something/) as HTMLInputElement
    fireEvent.change(input, { target: { value: "Test question" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(input.value).toBe("")
  })

  it("does not add empty question", () => {
    render(<PartnerAuthoredSetup />)

    const addButtons = screen.getAllByText(/^Add/)
    fireEvent.click(addButtons[0])

    expect(screen.getByText("0 of 5 questions")).toBeTruthy()
  })

  it("limits to 5 questions max", () => {
    render(<PartnerAuthoredSetup />)

    const input = screen.getByPlaceholderText(/Ask Yara something/)

    for (let i = 1; i <= 6; i++) {
      fireEvent.change(input, { target: { value: `Question ${i}` } })
      fireEvent.keyDown(input, { key: "Enter" })
    }

    expect(screen.getByText("5 of 5 questions")).toBeTruthy()
    expect(screen.queryByText("Question 6")).toBeNull()
  })

  it("removes a question when X is clicked", () => {
    render(<PartnerAuthoredSetup />)

    const input = screen.getByPlaceholderText(/Ask Yara something/)
    fireEvent.change(input, { target: { value: "Remove me" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(screen.getByText("Remove me")).toBeTruthy()

    // Find remove buttons by class
    const removeButtons = screen.getAllByRole("button").filter(btn =>
      btn.textContent === "" || btn.querySelector("svg")
    )
    // The remove button for the question is the last small button
    const lastSvgBtn = removeButtons[removeButtons.length - 1]
    if (lastSvgBtn) fireEvent.click(lastSvgBtn)

    expect(screen.getByText("0 of 5 questions")).toBeTruthy()
  })

  // ─── Interaction: Adding dares ───

  it("adds a dare when Add dare button is clicked", () => {
    render(<PartnerAuthoredSetup />)

    const dareInput = screen.getByPlaceholderText(/Write a playful dare/)
    fireEvent.change(dareInput, { target: { value: "Sing a song" } })

    const addDareBtn = screen.getByText(/Add 🌶️/)
    fireEvent.click(addDareBtn)

    expect(screen.getByText("Sing a song")).toBeTruthy()
    expect(screen.getByText("1 of 3 dares")).toBeTruthy()
  })

  it("limits to 3 dares max", () => {
    render(<PartnerAuthoredSetup />)

    const input = screen.getByPlaceholderText(/Write a playful dare/)

    for (let i = 1; i <= 4; i++) {
      fireEvent.change(input, { target: { value: `Dare ${i}` } })
      fireEvent.keyDown(input, { key: "Enter" })
    }

    expect(screen.getByText("3 of 3 dares")).toBeTruthy()
    expect(screen.queryByText("Dare 4")).toBeNull()
  })

  // ─── Interaction: Done writing ───

  it("calls saveCustomContent with correct data on Done Writing", async () => {
    render(<PartnerAuthoredSetup />)

    // Add a question
    const qInput = screen.getByPlaceholderText(/Ask Yara something/)
    fireEvent.change(qInput, { target: { value: "Test question?" } })
    fireEvent.keyDown(qInput, { key: "Enter" })

    // Add a dare
    const dInput = screen.getByPlaceholderText(/Write a playful dare/)
    fireEvent.change(dInput, { target: { value: "Test dare" } })
    const addDareBtn = screen.getByText(/Add 🌶️/)
    fireEvent.click(addDareBtn)

    // Click Done Writing
    fireEvent.click(screen.getByText(/Done Writing/))

    await waitFor(() => {
      expect(mockSaveCustomContent).toHaveBeenCalledWith([
        { type: "question", text: "Test question?" },
        { type: "dare", text: "Test dare", heatLevel: 1 },
      ])
    })
  })

  it("shows waiting screen after done writing", async () => {
    render(<PartnerAuthoredSetup />)

    fireEvent.click(screen.getByText(/Done Writing/))

    await waitFor(() => {
      expect(screen.getByText(/Waiting for Yara/)).toBeTruthy()
    })
  })

  it("displays written item counts on waiting screen", async () => {
    render(<PartnerAuthoredSetup />)

    // Add 2 questions
    const qInput = screen.getByPlaceholderText(/Ask Yara something/)
    fireEvent.change(qInput, { target: { value: "Q1" } })
    fireEvent.keyDown(qInput, { key: "Enter" })
    fireEvent.change(qInput, { target: { value: "Q2" } })
    fireEvent.keyDown(qInput, { key: "Enter" })

    fireEvent.click(screen.getByText(/Done Writing/))

    await waitFor(() => {
      expect(screen.getByText(/2 questions & 0 dares/)).toBeTruthy()
    })
  })

  // ─── Integration: Supabase calls ───

  it("queries session_custom_content for partner polling", async () => {
    render(<PartnerAuthoredSetup />)

    // The useEffect with setInterval polls every 3s — give it time
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("session_custom_content")
    }, { timeout: 5000 })
  })

  it("does not call saveCustomContent with empty items", async () => {
    render(<PartnerAuthoredSetup />)

    // Click Done Writing without adding any items
    fireEvent.click(screen.getByText(/Done Writing/))

    await waitFor(() => {
      // saveCustomContent should NOT be called when items.length === 0
      expect(mockSaveCustomContent).not.toHaveBeenCalled()
    })
  })
})
