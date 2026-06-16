import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mocks must be hoisted so the vi.mock factories below can reference them.
const mockUseVisionBoard = vi.hoisted(() => vi.fn())
const mockUseAuth = vi.hoisted(() => vi.fn())

// Mock framer-motion — Proxy returns a passthrough element for any motion.* tag,
// stripping animation-only props so they don't leak to the DOM.
vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLElement>,
      ) => {
        const {
          initial, animate, exit, transition, whileHover, whileTap,
          whileInView, layout, layoutId, variants, drag, ...rest
        } = props
        void initial; void animate; void exit; void transition; void whileHover
        void whileTap; void whileInView; void layout; void layoutId; void variants; void drag
        return React.createElement(tag, { ref, ...rest }, children as React.ReactNode)
      },
    )
  const motion = new Proxy({}, { get: (_t, tag: string) => passthrough(tag) })
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock the domain hook + auth provider — both are read directly by the page.
vi.mock("@/lib/hooks/use-vision-board", () => ({
  useVisionBoard: () => mockUseVisionBoard(),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// PageTransition / PageHeader / LoadingSkeleton are presentational shells.
vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => <header data-testid="page-header">{title}</header>,
}))

vi.mock("@/components/shared/LoadingSkeleton", () => ({
  LoadingSkeleton: ({ variant }: { variant: string }) => <div data-testid="loading-skeleton">{variant}</div>,
}))

// The wizard fires onComplete with shaped data so we can assert the page's
// createBoard → addCategory orchestration.
vi.mock("@/components/vision-board/VisionBoardWizard", () => ({
  VisionBoardWizard: ({ onComplete }: { onComplete: (data: unknown) => Promise<void> }) => (
    <div data-testid="vision-board-wizard">
      <button
        data-testid="wizard-complete-test"
        onClick={() =>
          onComplete({
            title: "My 2026",
            theme: "Growth",
            categories: [{ name: "Faith", icon: "🤲" }],
          })
        }
      >
        Complete
      </button>
    </div>
  ),
}))

// The add-item bottom sheet — expose Save (with controlled payload) + Close.
vi.mock("@/components/vision-board/AddVisionItemForm", () => ({
  AddVisionItemForm: ({ categoryId, onClose, onSave }: {
    categoryId: string
    categories: unknown[]
    onClose: () => void
    onSave: (catId: string, data: { title: string }) => Promise<void>
  }) => (
    <div data-testid="add-item-form">
      <span>Category: {categoryId}</span>
      <button data-testid="close-form" onClick={onClose}>Close</button>
      <button data-testid="save-form" onClick={() => onSave(categoryId, { title: "Test item" })}>Save</button>
    </div>
  ),
}))

import VisionBoardPage from "@/app/(main)/2026/page"

// Shape that mirrors the real CategoryWithItems / VisionBoard types.
const myBoardFixture = {
  id: "board-1", title: "My 2026", theme: "Growth", hero_media_id: null,
  owner_id: "user-1", year: 2026, created_at: "2026-01-01",
}

const categoriesFixture = [
  {
    id: "cat-1", board_id: "board-1", name: "Health", icon: "💪", sort_order: 0, created_at: "2026-01-01",
    items: [
      { id: "item-1", category_id: "cat-1", title: "Run a 10k", description: null, media_id: null, is_achieved: false, sort_order: 0, created_at: "2026-01-01" },
      { id: "item-2", category_id: "cat-1", title: "Sleep 8h", description: null, media_id: null, is_achieved: true, sort_order: 1, created_at: "2026-01-01" },
    ],
  },
]

const makeHookReturn = (overrides?: Record<string, unknown>) => ({
  myBoard: myBoardFixture,
  partnerBoard: { ...myBoardFixture, id: "board-2", title: "Partner 2026", theme: "Bloom", owner_id: "user-2" },
  categories: categoriesFixture,
  evaluations: [],
  isLoading: false,
  error: null,
  activeBoard: "mine" as const,
  switchBoard: vi.fn(),
  currentBoard: myBoardFixture,
  hasEvaluatedThisMonth: false,
  createBoard: vi.fn().mockResolvedValue("board-1"),
  setHeroBanner: vi.fn(),
  addCategory: vi.fn(),
  removeCategory: vi.fn(),
  reorderCategories: vi.fn(),
  addItem: vi.fn().mockResolvedValue("item-new"),
  toggleAchieved: vi.fn(),
  removeItem: vi.fn(),
  submitEvaluation: vi.fn(),
  getEvaluations: vi.fn(),
  ...overrides,
})

describe("VisionBoardPage (2026)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ partner: { display_name: "Yara" } })
    mockUseVisionBoard.mockReturnValue(makeHookReturn())
  })

  // ── Unit: state-driven rendering ──────────────────────────────────────────

  it("renders the loading skeleton (variant 'card') while isLoading", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ isLoading: true }))
    render(<VisionBoardPage />)
    expect(screen.getByTestId("loading-skeleton")).toHaveTextContent("card")
    // The board view + eval prompt must NOT be on screen during loading.
    expect(screen.queryByTestId("eval-prompt")).not.toBeInTheDocument()
  })

  it("renders the wizard when the user has no board and is on the 'mine' tab", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ myBoard: null, currentBoard: null, categories: [] }))
    render(<VisionBoardPage />)
    expect(screen.getByTestId("vision-board-wizard")).toBeInTheDocument()
    expect(screen.getByTestId("page-header")).toHaveTextContent("2026")
  })

  it("renders the board theme and the '2026' heading from VisionView", () => {
    render(<VisionBoardPage />)
    expect(screen.getByRole("heading", { name: "2026" })).toBeInTheDocument()
    expect(screen.getByText("Growth")).toBeInTheDocument()
  })

  it("renders the partner's display name in the tab label", () => {
    render(<VisionBoardPage />)
    // Pill tab label is "{partnerName}'s"
    expect(screen.getByRole("button", { name: /Yara's/ })).toBeInTheDocument()
  })

  it("falls back to 'Partner' in the tab label when no partner profile exists", () => {
    mockUseAuth.mockReturnValue({ partner: null })
    render(<VisionBoardPage />)
    expect(screen.getByRole("button", { name: /Partner's/ })).toBeInTheDocument()
  })

  it("renders category goals from the mocked data", () => {
    render(<VisionBoardPage />)
    expect(screen.getByText("Health")).toBeInTheDocument()
    expect(screen.getByText("Run a 10k")).toBeInTheDocument()
    expect(screen.getByText("Sleep 8h")).toBeInTheDocument()
  })

  it("derives the done/total progress count from item.is_achieved", () => {
    // 2 items, 1 achieved → "1 of 2 so far this year"
    render(<VisionBoardPage />)
    const counter = screen.getByText(/so far this year/)
    expect(counter).toHaveTextContent("1")
    expect(counter).toHaveTextContent("of 2")
  })

  it("shows the monthly evaluation prompt linking to /2026/evaluate when not yet evaluated", () => {
    render(<VisionBoardPage />)
    const prompt = screen.getByTestId("eval-prompt")
    expect(prompt).toHaveTextContent("Time for your monthly check-in")
    expect(prompt.closest("a")).toHaveAttribute("href", "/2026/evaluate")
  })

  it("hides the evaluation prompt once hasEvaluatedThisMonth is true", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ hasEvaluatedThisMonth: true }))
    render(<VisionBoardPage />)
    expect(screen.queryByTestId("eval-prompt")).not.toBeInTheDocument()
  })

  it("hides the evaluation prompt while viewing the partner board", () => {
    mockUseVisionBoard.mockReturnValue(
      makeHookReturn({
        activeBoard: "partner",
        currentBoard: { ...myBoardFixture, id: "board-2", owner_id: "user-2", theme: "Bloom" },
      }),
    )
    render(<VisionBoardPage />)
    expect(screen.queryByTestId("eval-prompt")).not.toBeInTheDocument()
  })

  it("does not render the add-item form until the add control is used", () => {
    render(<VisionBoardPage />)
    expect(screen.queryByTestId("add-item-form")).not.toBeInTheDocument()
  })

  // ── Interaction: user flows ───────────────────────────────────────────────

  it("calls switchBoard('partner') when the partner tab is clicked", () => {
    const switchBoard = vi.fn()
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ switchBoard }))
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByRole("button", { name: /Yara's/ }))
    expect(switchBoard).toHaveBeenCalledWith("partner")
  })

  it("calls switchBoard('mine') when the Mine tab is clicked", () => {
    const switchBoard = vi.fn()
    mockUseVisionBoard.mockReturnValue(
      makeHookReturn({
        switchBoard,
        activeBoard: "partner",
        currentBoard: { ...myBoardFixture, id: "board-2", owner_id: "user-2", theme: "Bloom" },
      }),
    )
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByRole("button", { name: "Mine" }))
    expect(switchBoard).toHaveBeenCalledWith("mine")
  })

  it("calls toggleAchieved(itemId) when an own-board goal checkbox is toggled", () => {
    const toggleAchieved = vi.fn()
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ toggleAchieved }))
    render(<VisionBoardPage />)
    // The un-done item ("Run a 10k", id "item-1") has an accessible toggle button.
    fireEvent.click(screen.getByRole("button", { name: "Mark done" }))
    expect(toggleAchieved).toHaveBeenCalledWith("item-1")
  })

  it("opens the add-item bottom sheet (seeded with the first category) via the Add goal FAB", () => {
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByRole("button", { name: "Add goal" }))
    expect(screen.getByTestId("add-item-form")).toBeInTheDocument()
    expect(screen.getByText("Category: cat-1")).toBeInTheDocument()
  })

  it("closes the add-item form when its close button is clicked", () => {
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByRole("button", { name: "Add goal" }))
    expect(screen.getByTestId("add-item-form")).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("close-form"))
    expect(screen.queryByTestId("add-item-form")).not.toBeInTheDocument()
  })

  it("does not show the Add goal FAB while viewing the partner board", () => {
    mockUseVisionBoard.mockReturnValue(
      makeHookReturn({
        activeBoard: "partner",
        currentBoard: { ...myBoardFixture, id: "board-2", owner_id: "user-2", theme: "Bloom" },
      }),
    )
    render(<VisionBoardPage />)
    expect(screen.queryByRole("button", { name: "Add goal" })).not.toBeInTheDocument()
  })

  it("does not offer item toggling on the partner board (read-only)", () => {
    mockUseVisionBoard.mockReturnValue(
      makeHookReturn({
        activeBoard: "partner",
        currentBoard: { ...myBoardFixture, id: "board-2", owner_id: "user-2", theme: "Bloom" },
      }),
    )
    render(<VisionBoardPage />)
    // On the partner board the goals render but the toggle buttons are absent.
    expect(screen.getByText("Run a 10k")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Mark done" })).not.toBeInTheDocument()
  })

  // ── Integration: mocked hook receives the correct calls ───────────────────

  it("saving the add-item form forwards the payload to addItem(categoryId, data)", async () => {
    const addItem = vi.fn().mockResolvedValue("item-new")
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ addItem }))
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByRole("button", { name: "Add goal" }))
    fireEvent.click(screen.getByTestId("save-form"))
    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith("cat-1", { title: "Test item" })
    })
  })

  it("completing the wizard calls createBoard then addCategory with the boardId", async () => {
    const createBoard = vi.fn().mockResolvedValue("new-board-1")
    const addCategory = vi.fn().mockResolvedValue("cat-new")
    mockUseVisionBoard.mockReturnValue(
      makeHookReturn({ myBoard: null, currentBoard: null, categories: [], createBoard, addCategory }),
    )
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByTestId("wizard-complete-test"))
    await waitFor(() => {
      expect(createBoard).toHaveBeenCalledWith({ title: "My 2026", theme: "Growth" })
    })
    await waitFor(() => {
      expect(addCategory).toHaveBeenCalledWith("new-board-1", "Faith", "🤲")
    })
  })

  it("does not call addCategory when createBoard returns no id", async () => {
    const createBoard = vi.fn().mockResolvedValue(null)
    const addCategory = vi.fn()
    mockUseVisionBoard.mockReturnValue(
      makeHookReturn({ myBoard: null, currentBoard: null, categories: [], createBoard, addCategory }),
    )
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByTestId("wizard-complete-test"))
    await waitFor(() => {
      expect(createBoard).toHaveBeenCalled()
    })
    expect(addCategory).not.toHaveBeenCalled()
  })
})
