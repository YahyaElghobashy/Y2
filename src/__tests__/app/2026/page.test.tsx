import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mocks must be hoisted
const mockUseVisionBoard = vi.hoisted(() => vi.fn())
const mockUseAuth = vi.hoisted(() => vi.fn())

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layout; void layoutId
      return <div ref={ref} {...rest}>{children}</div>
    }),
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// Mock hooks
vi.mock("@/lib/hooks/use-vision-board", () => ({
  useVisionBoard: () => mockUseVisionBoard(),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock child components
vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => <header data-testid="page-header">{title}</header>,
}))

vi.mock("@/components/shared/LoadingSkeleton", () => ({
  LoadingSkeleton: ({ variant }: { variant: string }) => <div data-testid="loading-skeleton">{variant}</div>,
}))

vi.mock("@/components/shared/MediaImage", () => ({
  MediaImage: ({ alt, mediaId }: { alt: string; mediaId: string }) => (
    <img alt={alt} data-testid={`media-image-${mediaId}`} />
  ),
}))

vi.mock("@/components/vision-board/VisionBoardWizard", () => ({
  VisionBoardWizard: ({ onComplete }: { onComplete: (data: unknown) => Promise<void> }) => (
    <div data-testid="vision-board-wizard">
      <button data-testid="wizard-complete-test" onClick={() => onComplete({
        title: "My 2026",
        categories: [{ name: "Faith", icon: "🤲" }],
      })}>
        Complete
      </button>
    </div>
  ),
}))

vi.mock("@/components/vision-board/CategorySection", () => ({
  CategorySection: ({ category, onAddItem, readOnly }: {
    category: { id: string; name: string }
    onAddItem?: (catId: string) => void
    readOnly?: boolean
  }) => (
    <div data-testid={`category-section-${category.id}`}>
      {category.name}
      {!readOnly && <button data-testid={`add-item-trigger-${category.id}`} onClick={() => onAddItem?.(category.id)}>Add</button>}
    </div>
  ),
}))

vi.mock("@/components/vision-board/AddVisionItemForm", () => ({
  AddVisionItemForm: ({ categoryId, onClose, onSave }: {
    categoryId: string
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

const makeHookReturn = (overrides?: Record<string, unknown>) => ({
  myBoard: { id: "board-1", title: "My 2026", theme: "Growth", hero_media_id: null, owner_id: "user-1", year: 2026, created_at: "2026-01-01" },
  partnerBoard: null,
  categories: [
    {
      id: "cat-1", board_id: "board-1", name: "Health", icon: "💪", sort_order: 0, created_at: "2026-01-01",
      items: [{ id: "item-1", category_id: "cat-1", title: "Run", description: null, media_id: null, is_achieved: false, sort_order: 0, created_at: "2026-01-01" }],
    },
  ],
  evaluations: [],
  isLoading: false,
  error: null,
  activeBoard: "mine" as const,
  switchBoard: vi.fn(),
  currentBoard: { id: "board-1", title: "My 2026", theme: "Growth", hero_media_id: null, owner_id: "user-1", year: 2026, created_at: "2026-01-01" },
  hasEvaluatedThisMonth: false,
  createBoard: vi.fn().mockResolvedValue("board-1"),
  setHeroBanner: vi.fn(),
  addCategory: vi.fn(),
  removeCategory: vi.fn(),
  reorderCategories: vi.fn(),
  addItem: vi.fn(),
  toggleAchieved: vi.fn(),
  removeItem: vi.fn(),
  submitEvaluation: vi.fn(),
  getEvaluations: vi.fn(),
  ...overrides,
})

describe("VisionBoardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ partner: { display_name: "Yara" } })
    mockUseVisionBoard.mockReturnValue(makeHookReturn())
  })

  // === Unit tests ===

  it("renders page header with '2026'", () => {
    render(<VisionBoardPage />)
    expect(screen.getByTestId("page-header")).toHaveTextContent("2026")
  })

  it("renders loading skeleton when isLoading", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ isLoading: true }))
    render(<VisionBoardPage />)
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument()
  })

  it("renders wizard when no myBoard and activeBoard is mine", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ myBoard: null, currentBoard: null }))
    render(<VisionBoardPage />)
    expect(screen.getByTestId("vision-board-wizard")).toBeInTheDocument()
  })

  it("renders board switcher tabs", () => {
    render(<VisionBoardPage />)
    expect(screen.getByTestId("board-tab-mine")).toBeInTheDocument()
    expect(screen.getByTestId("board-tab-partner")).toBeInTheDocument()
  })

  it("renders partner name in tab label", () => {
    render(<VisionBoardPage />)
    expect(screen.getByTestId("board-tab-partner")).toHaveTextContent("Yara's Board")
  })

  it("renders fallback 'Partner' when partner is null", () => {
    mockUseAuth.mockReturnValue({ partner: null })
    render(<VisionBoardPage />)
    expect(screen.getByTestId("board-tab-partner")).toHaveTextContent("Partner's Board")
  })

  it("renders board title in hero banner", () => {
    render(<VisionBoardPage />)
    expect(screen.getByText("My 2026")).toBeInTheDocument()
  })

  it("renders board theme in hero banner", () => {
    render(<VisionBoardPage />)
    expect(screen.getByText("Growth")).toBeInTheDocument()
  })

  it("renders gradient placeholder when no hero_media_id", () => {
    const { container } = render(<VisionBoardPage />)
    expect(container.querySelector(".bg-gradient-to-br")).toBeInTheDocument()
  })

  it("renders MediaImage when hero_media_id exists", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({
      currentBoard: { id: "board-1", title: "My 2026", theme: null, hero_media_id: "hero-media-1", owner_id: "user-1", year: 2026, created_at: "2026-01-01" },
    }))
    render(<VisionBoardPage />)
    expect(screen.getByTestId("media-image-hero-media-1")).toBeInTheDocument()
  })

  it("renders category sections", () => {
    render(<VisionBoardPage />)
    expect(screen.getByTestId("category-section-cat-1")).toBeInTheDocument()
  })

  it("renders evaluation prompt when hasEvaluatedThisMonth is false", () => {
    render(<VisionBoardPage />)
    expect(screen.getByTestId("eval-prompt")).toBeInTheDocument()
    expect(screen.getByText("Monthly reflection due")).toBeInTheDocument()
  })

  it("does NOT render evaluation prompt when hasEvaluatedThisMonth is true", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ hasEvaluatedThisMonth: true }))
    render(<VisionBoardPage />)
    expect(screen.queryByTestId("eval-prompt")).not.toBeInTheDocument()
  })

  it("eval prompt links to /2026/evaluate", () => {
    render(<VisionBoardPage />)
    const link = screen.getByTestId("eval-prompt").closest("a")
    expect(link).toHaveAttribute("href", "/2026/evaluate")
  })

  it("renders empty state when categories are empty", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ categories: [] }))
    render(<VisionBoardPage />)
    expect(screen.getByText("Add categories to start building your vision")).toBeInTheDocument()
  })

  it("renders partner empty state when viewing partner with no categories", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({
      categories: [],
      activeBoard: "partner",
      currentBoard: { id: "board-2", title: "Partner Board", theme: null, hero_media_id: null, owner_id: "user-2", year: 2026, created_at: "2026-01-01" },
    }))
    render(<VisionBoardPage />)
    expect(screen.getByText("Yara hasn't added categories yet")).toBeInTheDocument()
  })

  // === Interaction tests ===

  it("calls switchBoard when tab is clicked", () => {
    const switchBoard = vi.fn()
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ switchBoard }))
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByTestId("board-tab-partner"))
    expect(switchBoard).toHaveBeenCalledWith("partner")
  })

  it("opens add item form when add button clicked in category", () => {
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByTestId("add-item-trigger-cat-1"))
    expect(screen.getByTestId("add-item-form")).toBeInTheDocument()
    expect(screen.getByText("Category: cat-1")).toBeInTheDocument()
  })

  it("closes add item form when close button clicked", () => {
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByTestId("add-item-trigger-cat-1"))
    expect(screen.getByTestId("add-item-form")).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("close-form"))
    expect(screen.queryByTestId("add-item-form")).not.toBeInTheDocument()
  })

  it("calls addItem when form saved", async () => {
    const addItem = vi.fn()
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ addItem }))
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByTestId("add-item-trigger-cat-1"))
    fireEvent.click(screen.getByTestId("save-form"))
    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith("cat-1", { title: "Test item" })
    })
  })

  it("hides add button in category sections when viewing partner board", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({
      activeBoard: "partner",
      currentBoard: { id: "board-2", title: "Partner Board", theme: null, hero_media_id: null, owner_id: "user-2", year: 2026, created_at: "2026-01-01" },
    }))
    render(<VisionBoardPage />)
    expect(screen.queryByTestId("add-item-trigger-cat-1")).not.toBeInTheDocument()
  })

  it("does NOT show eval prompt when viewing partner board", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({
      activeBoard: "partner",
      currentBoard: { id: "board-2", title: "Partner Board", theme: null, hero_media_id: null, owner_id: "user-2", year: 2026, created_at: "2026-01-01" },
    }))
    render(<VisionBoardPage />)
    expect(screen.queryByTestId("eval-prompt")).not.toBeInTheDocument()
  })

  // === Integration tests ===

  it("wizard calls createBoard then addCategory on complete", async () => {
    const createBoard = vi.fn().mockResolvedValue("new-board-1")
    const addCategory = vi.fn()
    mockUseVisionBoard.mockReturnValue(makeHookReturn({
      myBoard: null,
      currentBoard: null,
      createBoard,
      addCategory,
    }))
    render(<VisionBoardPage />)
    fireEvent.click(screen.getByTestId("wizard-complete-test"))
    await waitFor(() => {
      expect(createBoard).toHaveBeenCalledWith({ title: "My 2026", theme: undefined })
    })
    await waitFor(() => {
      expect(addCategory).toHaveBeenCalledWith("new-board-1", "Faith", "🤲")
    })
  })

  it("does not show add-item-form initially", () => {
    render(<VisionBoardPage />)
    expect(screen.queryByTestId("add-item-form")).not.toBeInTheDocument()
  })

  it("renders theme text only when theme is set", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({
      currentBoard: { id: "board-1", title: "My 2026", theme: null, hero_media_id: null, owner_id: "user-1", year: 2026, created_at: "2026-01-01" },
    }))
    render(<VisionBoardPage />)
    expect(screen.queryByText("Growth")).not.toBeInTheDocument()
  })
})
