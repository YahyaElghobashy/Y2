import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock framer-motion ──────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...domProps } = props as Record<string, unknown>
      return <div {...(domProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...domProps } = props as Record<string, unknown>
      return <button {...(domProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// ── Mock next/navigation ─────────────────────────────────────
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ── Mock data ────────────────────────────────────────────────
const MOCK_ITEMS = [
  { id: "i1", label: "Pizza" },
  { id: "i2", label: "Sushi" },
  { id: "i3", label: "Tacos" },
]

const MOCK_PRESET_1 = {
  id: "preset-1",
  user_id: "user-1",
  name: "Restaurant Picker",
  icon: "🍕",
  items: MOCK_ITEMS,
  is_shared: true,
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MOCK_PRESET_2 = {
  id: "preset-2",
  user_id: "user-1",
  name: "Movie Night",
  icon: "🎬",
  items: [
    { id: "m1", label: "Action" },
    { id: "m2", label: "Comedy" },
  ],
  is_shared: true,
  created_at: "2026-03-04T00:00:00Z",
  updated_at: "2026-03-04T00:00:00Z",
}

const MOCK_SESSION = {
  id: "session-1",
  preset_id: "preset-1",
  started_by: "user-1",
  mode: "selection" as const,
  best_of_target: null,
  best_of_rounds: 3,
  status: "completed" as const,
  winner_label: "Pizza",
  created_at: "2026-03-04T10:00:00Z",
  updated_at: "2026-03-04T10:30:00Z",
}

const mockCreatePreset = vi.fn()
const mockDeletePreset = vi.fn()

const mockUseWheel = vi.fn(() => ({
  presets: [MOCK_PRESET_1, MOCK_PRESET_2],
  isLoading: false,
  error: null as string | null,
  createPreset: mockCreatePreset,
  deletePreset: mockDeletePreset,
  sessionHistory: [] as typeof MOCK_SESSION[],
}))

vi.mock("@/lib/hooks/use-wheel", () => ({
  useWheel: () => mockUseWheel(),
}))

import WheelPresetsPage from "@/app/(main)/wheel/page"

describe("WheelPresetsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWheel.mockReturnValue({
      presets: [MOCK_PRESET_1, MOCK_PRESET_2],
      isLoading: false,
      error: null,
      createPreset: mockCreatePreset,
      deletePreset: mockDeletePreset,
      sessionHistory: [],
    })
  })

  // ── UNIT: Loading state ──────────────────────────────────────

  it("renders loading skeleton", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      isLoading: true,
    })

    render(<WheelPresetsPage />)
    expect(screen.getByTestId("wheel-loading")).toBeInTheDocument()
  })

  // ── UNIT: Error state ────────────────────────────────────────

  it("renders error message", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      error: "Something broke",
    })

    render(<WheelPresetsPage />)
    expect(screen.getByTestId("wheel-error")).toBeInTheDocument()
    expect(screen.getByText("Something broke")).toBeInTheDocument()
  })

  // ── UNIT: Page renders with presets ──────────────────────────

  it("renders the presets page with gallery", () => {
    render(<WheelPresetsPage />)

    expect(screen.getByTestId("wheel-presets-page")).toBeInTheDocument()
    expect(screen.getByTestId("presets-gallery")).toBeInTheDocument()
  })

  it("renders preset cards for each preset", () => {
    render(<WheelPresetsPage />)

    expect(screen.getByTestId("preset-card-preset-1")).toBeInTheDocument()
    expect(screen.getByTestId("preset-card-preset-2")).toBeInTheDocument()
    expect(screen.getByText("Restaurant Picker")).toBeInTheDocument()
    expect(screen.getByText("Movie Night")).toBeInTheDocument()
  })

  it("shows create new button", () => {
    render(<WheelPresetsPage />)

    expect(screen.getByTestId("new-preset-btn")).toBeInTheDocument()
    expect(screen.getByText("Create New Wheel")).toBeInTheDocument()
  })

  // ── UNIT: Empty state ────────────────────────────────────────

  it("shows empty state when no presets", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      presets: [],
    })

    render(<WheelPresetsPage />)
    expect(screen.getByText("No presets yet")).toBeInTheDocument()
  })

  // ── UNIT: Stats bar ──────────────────────────────────────────

  it("shows stats bar when session history exists", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      sessionHistory: [MOCK_SESSION],
    })

    render(<WheelPresetsPage />)
    expect(screen.getByTestId("wheel-stats")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument() // sessions count
    expect(screen.getByText("Sessions")).toBeInTheDocument()
    expect(screen.getByText("Total Rounds")).toBeInTheDocument()
  })

  it("hides stats bar when no session history", () => {
    render(<WheelPresetsPage />)

    expect(screen.queryByTestId("wheel-stats")).not.toBeInTheDocument()
  })

  it("computes total rounds from session history", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      sessionHistory: [
        { ...MOCK_SESSION, best_of_rounds: 3 },
        { ...MOCK_SESSION, id: "session-2", best_of_rounds: 5 },
      ],
    })

    render(<WheelPresetsPage />)
    expect(screen.getByText("8")).toBeInTheDocument() // 3 + 5
  })

  // ── UNIT: Session history list ───────────────────────────────

  it("renders session history items", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      sessionHistory: [MOCK_SESSION],
    })

    render(<WheelPresetsPage />)
    expect(screen.getByText("Past Sessions")).toBeInTheDocument()
    expect(screen.getByTestId("session-history")).toBeInTheDocument()
    expect(screen.getByTestId("history-session-1")).toBeInTheDocument()
  })

  it("shows winner label in session history", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      sessionHistory: [MOCK_SESSION],
    })

    render(<WheelPresetsPage />)
    expect(screen.getByText("Pizza")).toBeInTheDocument()
  })

  it("shows mode badge in session history", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      sessionHistory: [MOCK_SESSION],
    })

    render(<WheelPresetsPage />)
    expect(screen.getByText("selection")).toBeInTheDocument()
  })

  it("limits session history to 10 items", () => {
    const sessions = Array.from({ length: 15 }, (_, i) => ({
      ...MOCK_SESSION,
      id: `session-${i}`,
    }))

    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      sessionHistory: sessions,
    })

    render(<WheelPresetsPage />)
    const historyItems = screen.getByTestId("session-history").children
    expect(historyItems).toHaveLength(10)
  })

  // ── INTERACTION: Navigate to preset ──────────────────────────

  it("navigates to preset session page on card click", () => {
    render(<WheelPresetsPage />)

    fireEvent.click(screen.getByTestId("preset-card-preset-1"))
    expect(mockPush).toHaveBeenCalledWith("/wheel/preset-1")
  })

  // ── INTERACTION: Delete preset ───────────────────────────────

  it("calls deletePreset when delete button is clicked on a card", () => {
    render(<WheelPresetsPage />)

    fireEvent.click(screen.getByTestId("delete-preset-preset-1"))
    expect(mockDeletePreset).toHaveBeenCalledWith("preset-1")
  })

  // ── INTERACTION: Create preset form ──────────────────────────

  it("shows create form when new preset button is clicked", () => {
    render(<WheelPresetsPage />)

    fireEvent.click(screen.getByTestId("new-preset-btn"))
    expect(screen.getByTestId("create-preset-form")).toBeInTheDocument()
    // New preset button should be hidden
    expect(screen.queryByTestId("new-preset-btn")).not.toBeInTheDocument()
  })

  it("hides create form when cancel is clicked", () => {
    render(<WheelPresetsPage />)

    fireEvent.click(screen.getByTestId("new-preset-btn"))
    expect(screen.getByTestId("create-preset-form")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("cancel-preset-btn"))
    expect(screen.queryByTestId("create-preset-form")).not.toBeInTheDocument()
    expect(screen.getByTestId("new-preset-btn")).toBeInTheDocument()
  })

  it("calls createPreset and hides form on save", async () => {
    mockCreatePreset.mockResolvedValue("preset-new")

    render(<WheelPresetsPage />)

    // Open form
    fireEvent.click(screen.getByTestId("new-preset-btn"))

    // Fill in name and items
    fireEvent.change(screen.getByTestId("preset-name-input"), {
      target: { value: "Date Night" },
    })
    fireEvent.change(screen.getByTestId("item-input-0"), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByTestId("item-input-1"), {
      target: { value: "Movie" },
    })

    // Save
    fireEvent.click(screen.getByTestId("save-preset-btn"))

    await waitFor(() => {
      expect(mockCreatePreset).toHaveBeenCalledWith({
        name: "Date Night",
        icon: "🎯",
        items: [{ label: "Dinner" }, { label: "Movie" }],
      })
    })
  })

  // ── UNIT: Auto-create starters ───────────────────────────────

  it("calls createPreset for starter presets when no presets exist", async () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      presets: [],
    })

    render(<WheelPresetsPage />)

    await waitFor(() => {
      // Should attempt to create 4 starter presets
      expect(mockCreatePreset).toHaveBeenCalledTimes(4)
    })

    // Verify first starter preset
    expect(mockCreatePreset).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Restaurant Picker", icon: "🍕" })
    )
  })

  it("does not create starters when presets already exist", () => {
    render(<WheelPresetsPage />)

    expect(mockCreatePreset).not.toHaveBeenCalled()
  })

  // ── INTEGRATION: useWheel hook called ────────────────────────

  it("calls useWheel hook", () => {
    render(<WheelPresetsPage />)
    expect(mockUseWheel).toHaveBeenCalled()
  })
})
