import { render, screen, fireEvent } from "@testing-library/react"
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
    svg: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { animate, transition, initial, whileTap, ...domProps } = props as Record<string, unknown>
      return <svg {...(domProps as React.SVGAttributes<SVGSVGElement>)}>{children}</svg>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => true, // Instant results in tests
}))

// ── Mock next/navigation ─────────────────────────────────────
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock("next/navigation", () => ({
  useParams: () => ({ presetId: "preset-1" }),
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

// ── Mock data ────────────────────────────────────────────────
const MOCK_ITEMS = [
  { id: "i1", label: "Pizza" },
  { id: "i2", label: "Sushi" },
  { id: "i3", label: "Tacos" },
  { id: "i4", label: "Pasta" },
]

const MOCK_PRESET = {
  id: "preset-1",
  user_id: "user-1",
  name: "Restaurant Picker",
  icon: "🍕",
  items: MOCK_ITEMS,
  is_shared: true,
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MOCK_ACTIVE_SESSION = {
  id: "session-1",
  preset_id: "preset-1",
  started_by: "user-1",
  mode: "selection" as const,
  best_of_target: null,
  best_of_rounds: 0,
  status: "active" as const,
  winner_label: null,
  created_at: "2026-03-05T10:00:00Z",
  updated_at: "2026-03-05T10:00:00Z",
}

const mockUseWheel = vi.fn(() => ({
  presets: [MOCK_PRESET],
  activeSession: null as typeof MOCK_ACTIVE_SESSION | null,
  isLoading: false,
  error: null as string | null,
  startSession: vi.fn(),
  spin: vi.fn(() => ({ resultIndex: 0, angle: 1440, label: "Pizza" })),
  recordSpin: vi.fn(),
  abandonSession: vi.fn(),
  completeSession: vi.fn(),
  currentSpins: [] as unknown[],
  remainingItems: MOCK_ITEMS,
  tally: {} as Record<string, number>,
  winner: null as string | null,
}))

vi.mock("@/lib/hooks/use-wheel", () => ({
  useWheel: () => mockUseWheel(),
}))

import WheelSessionPage from "@/app/(main)/wheel/[presetId]/page"

describe("WheelSessionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWheel.mockReturnValue({
      presets: [MOCK_PRESET],
      activeSession: null,
      isLoading: false,
      error: null,
      startSession: vi.fn(),
      spin: vi.fn(() => ({ resultIndex: 0, angle: 1440, label: "Pizza" })),
      recordSpin: vi.fn(),
      abandonSession: vi.fn(),
      completeSession: vi.fn(),
      currentSpins: [],
      remainingItems: MOCK_ITEMS,
      tally: {},
      winner: null,
    })
  })

  // ── UNIT: Loading state ─────────────────────────────────────

  it("renders loading skeleton", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      isLoading: true,
    })

    render(<WheelSessionPage />)
    expect(screen.getByTestId("session-loading")).toBeInTheDocument()
  })

  // ── UNIT: Error state ───────────────────────────────────────

  it("renders error message", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      error: "Something broke",
    })

    render(<WheelSessionPage />)
    expect(screen.getByTestId("session-error")).toBeInTheDocument()
    expect(screen.getByText("Something broke")).toBeInTheDocument()
  })

  // ── UNIT: Preset not found ──────────────────────────────────

  it("shows not found when preset doesn't exist", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      presets: [],
    })

    render(<WheelSessionPage />)
    expect(screen.getByText("Preset not found")).toBeInTheDocument()
  })

  // ── UNIT: Pre-session mode selection ────────────────────────

  it("shows ModeSelector when no active session", () => {
    render(<WheelSessionPage />)
    expect(screen.getByTestId("session-pre")).toBeInTheDocument()
    expect(screen.getByTestId("mode-selector")).toBeInTheDocument()
    expect(screen.getByText("🍕 Restaurant Picker")).toBeInTheDocument()
  })

  it("shows all three mode options", () => {
    render(<WheelSessionPage />)
    expect(screen.getByTestId("mode-selection")).toBeInTheDocument()
    expect(screen.getByTestId("mode-elimination")).toBeInTheDocument()
    expect(screen.getByTestId("mode-best_of")).toBeInTheDocument()
  })

  // ── INTERACTION: Mode selection ─────────────────────────────

  it("calls startSession when selection mode is clicked", () => {
    const startSession = vi.fn()
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      startSession,
    })

    render(<WheelSessionPage />)
    fireEvent.click(screen.getByTestId("mode-selection"))

    expect(startSession).toHaveBeenCalledWith("preset-1", "selection", undefined)
  })

  it("shows best-of picker and calls startSession with target", () => {
    const startSession = vi.fn()
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      startSession,
    })

    render(<WheelSessionPage />)
    fireEvent.click(screen.getByTestId("mode-best_of"))
    expect(screen.getByTestId("best-of-picker")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("best-of-5"))
    fireEvent.click(screen.getByTestId("best-of-confirm"))

    expect(startSession).toHaveBeenCalledWith("preset-1", "best_of", 5)
  })

  // ── UNIT: Live session ──────────────────────────────────────

  it("renders live session with wheel and mode badge", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: MOCK_ACTIVE_SESSION,
    })

    render(<WheelSessionPage />)
    expect(screen.getByTestId("session-live")).toBeInTheDocument()
    expect(screen.getByTestId("spin-the-wheel")).toBeInTheDocument()
    expect(screen.getByTestId("mode-badge")).toBeInTheDocument()
    expect(screen.getByText("selection")).toBeInTheDocument()
  })

  it("shows abandon button in live session", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: MOCK_ACTIVE_SESSION,
    })

    render(<WheelSessionPage />)
    expect(screen.getByTestId("abandon-btn")).toBeInTheDocument()
  })

  // ── INTERACTION: Abandon session ────────────────────────────

  it("calls abandonSession when abandon button clicked", () => {
    const abandonSession = vi.fn()
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: MOCK_ACTIVE_SESSION,
      abandonSession,
    })

    render(<WheelSessionPage />)
    fireEvent.click(screen.getByTestId("abandon-btn"))
    expect(abandonSession).toHaveBeenCalled()
  })

  // ── UNIT: Elimination tracker shown in elimination mode ─────

  it("shows EliminationTracker in elimination mode", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: { ...MOCK_ACTIVE_SESSION, mode: "elimination" },
    })

    render(<WheelSessionPage />)
    expect(screen.getByTestId("elimination-tracker")).toBeInTheDocument()
  })

  // ── UNIT: BestOf scoreboard shown in best_of mode ──────────

  it("shows BestOfScoreboard in best_of mode", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: {
        ...MOCK_ACTIVE_SESSION,
        mode: "best_of",
        best_of_target: 3,
      },
      tally: { Pizza: 1, Sushi: 0 },
    })

    render(<WheelSessionPage />)
    expect(screen.getByTestId("best-of-scoreboard")).toBeInTheDocument()
  })

  // ── UNIT: Spin log ──────────────────────────────────────────

  it("shows spin log toggle when spins exist", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: MOCK_ACTIVE_SESSION,
      currentSpins: [
        {
          id: "spin-1",
          session_id: "session-1",
          spin_number: 1,
          spun_by: "user-1",
          result_label: "Pizza",
          result_index: 0,
          remaining_items: null,
          eliminated_item: null,
          spin_duration_ms: 3500,
          created_at: "2026-03-05T10:05:00Z",
        },
      ],
    })

    render(<WheelSessionPage />)
    expect(screen.getByTestId("toggle-log")).toBeInTheDocument()
    expect(screen.getByText("Spin Log (1)")).toBeInTheDocument()
  })

  it("toggles spin log visibility", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: MOCK_ACTIVE_SESSION,
      currentSpins: [
        {
          id: "spin-1",
          session_id: "session-1",
          spin_number: 1,
          spun_by: "user-1",
          result_label: "Pizza",
          result_index: 0,
          remaining_items: null,
          eliminated_item: null,
          spin_duration_ms: 3500,
          created_at: "2026-03-05T10:05:00Z",
        },
      ],
    })

    render(<WheelSessionPage />)
    expect(screen.queryByTestId("spin-log")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("toggle-log"))
    expect(screen.getByTestId("spin-log")).toBeInTheDocument()
  })

  // ── UNIT: Session complete ──────────────────────────────────

  it("shows winner screen when session is complete", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: {
        ...MOCK_ACTIVE_SESSION,
        status: "completed",
        winner_label: "Pizza",
      },
      winner: "Pizza",
    })

    render(<WheelSessionPage />)
    expect(screen.getByTestId("session-complete")).toBeInTheDocument()
    expect(screen.getByText("Pizza")).toBeInTheDocument()
    expect(screen.getByText("Winner")).toBeInTheDocument()
  })

  it("shows Play Again and Back buttons on complete", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: {
        ...MOCK_ACTIVE_SESSION,
        status: "completed",
        winner_label: "Pizza",
      },
      winner: "Pizza",
    })

    render(<WheelSessionPage />)
    expect(screen.getByTestId("retry-btn")).toBeInTheDocument()
    expect(screen.getByTestId("back-btn")).toBeInTheDocument()
  })

  it("navigates to /wheel when Back button clicked", () => {
    mockUseWheel.mockReturnValue({
      ...mockUseWheel(),
      activeSession: {
        ...MOCK_ACTIVE_SESSION,
        status: "completed",
        winner_label: "Tacos",
      },
      winner: "Tacos",
    })

    render(<WheelSessionPage />)
    fireEvent.click(screen.getByTestId("back-btn"))
    expect(mockPush).toHaveBeenCalledWith("/wheel")
  })

  // ── INTEGRATION: Hook called ────────────────────────────────

  it("calls useWheel hook", () => {
    render(<WheelSessionPage />)
    expect(mockUseWheel).toHaveBeenCalled()
  })
})
