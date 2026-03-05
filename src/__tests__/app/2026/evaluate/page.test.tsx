import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockUseVisionBoard = vi.hoisted(() => vi.fn())
const mockPush = vi.hoisted(() => vi.fn())

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, layout, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layout
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/hooks/use-vision-board", () => ({
  useVisionBoard: () => mockUseVisionBoard(),
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title, backHref }: { title: string; backHref?: string }) => (
    <header data-testid="page-header" data-back={backHref}>{title}</header>
  ),
}))

vi.mock("@/components/shared/LoadingSkeleton", () => ({
  LoadingSkeleton: () => <div data-testid="loading-skeleton" />,
}))

import EvaluatePage from "@/app/(main)/2026/evaluate/page"

const makeCategories = () => [
  { id: "cat-1", board_id: "board-1", name: "Health", icon: "💪", sort_order: 0, created_at: "2026-01-01", items: [] },
  { id: "cat-2", board_id: "board-1", name: "Career", icon: "💼", sort_order: 1, created_at: "2026-01-01", items: [] },
]

const makeHookReturn = (overrides?: Record<string, unknown>) => ({
  categories: makeCategories(),
  isLoading: false,
  hasEvaluatedThisMonth: false,
  submitEvaluation: vi.fn().mockResolvedValue(undefined),
  myBoard: { id: "board-1", title: "My 2026", owner_id: "user-1" },
  ...overrides,
})

describe("EvaluatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseVisionBoard.mockReturnValue(makeHookReturn())
  })

  // === Unit tests ===

  it("renders page header with 'Evaluate'", () => {
    render(<EvaluatePage />)
    expect(screen.getByTestId("page-header")).toHaveTextContent("Evaluate")
  })

  it("renders page header with backHref to /2026", () => {
    render(<EvaluatePage />)
    expect(screen.getByTestId("page-header")).toHaveAttribute("data-back", "/2026")
  })

  it("renders loading skeleton when isLoading", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ isLoading: true }))
    render(<EvaluatePage />)
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument()
  })

  it("renders 'Already evaluated' message when hasEvaluatedThisMonth", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ hasEvaluatedThisMonth: true }))
    render(<EvaluatePage />)
    expect(screen.getByText("Already evaluated")).toBeInTheDocument()
  })

  it("renders month header", () => {
    render(<EvaluatePage />)
    expect(screen.getByTestId("eval-month-header")).toBeInTheDocument()
  })

  it("renders evaluation sliders for each category", () => {
    render(<EvaluatePage />)
    expect(screen.getByTestId("eval-slider-health")).toBeInTheDocument()
    expect(screen.getByTestId("eval-slider-career")).toBeInTheDocument()
  })

  it("renders overall score slider", () => {
    render(<EvaluatePage />)
    expect(screen.getByTestId("eval-slider-overall-score")).toBeInTheDocument()
  })

  it("renders reflection textarea", () => {
    render(<EvaluatePage />)
    expect(screen.getByTestId("reflection-input")).toBeInTheDocument()
  })

  it("renders submit button", () => {
    render(<EvaluatePage />)
    expect(screen.getByTestId("submit-evaluation")).toBeInTheDocument()
    expect(screen.getByText("Submit Reflection")).toBeInTheDocument()
  })

  it("renders category average", () => {
    render(<EvaluatePage />)
    expect(screen.getByTestId("category-average")).toBeInTheDocument()
  })

  it("renders char count for reflection", () => {
    render(<EvaluatePage />)
    expect(screen.getByText("0/1000")).toBeInTheDocument()
  })

  // === Interaction tests ===

  it("updates reflection char count as user types", () => {
    render(<EvaluatePage />)
    fireEvent.change(screen.getByTestId("reflection-input"), { target: { value: "Good month" } })
    expect(screen.getByText("10/1000")).toBeInTheDocument()
  })

  it("updates category score when slider changes", () => {
    render(<EvaluatePage />)
    const healthSlider = screen.getByTestId("slider-input-health")
    fireEvent.change(healthSlider, { target: { value: "9" } })
    // The value display should update
    const sliderContainer = screen.getByTestId("eval-slider-health")
    expect(sliderContainer).toHaveTextContent("9")
  })

  it("calls submitEvaluation with correct data", async () => {
    const submitEvaluation = vi.fn().mockResolvedValue(undefined)
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ submitEvaluation }))
    render(<EvaluatePage />)

    // Change overall score
    fireEvent.change(screen.getByTestId("slider-input-overall-score"), { target: { value: "8" } })
    // Change a category score
    fireEvent.change(screen.getByTestId("slider-input-health"), { target: { value: "7" } })
    // Add reflection
    fireEvent.change(screen.getByTestId("reflection-input"), { target: { value: "Great progress" } })
    // Submit
    fireEvent.click(screen.getByTestId("submit-evaluation"))

    await waitFor(() => {
      expect(submitEvaluation).toHaveBeenCalledWith(expect.objectContaining({
        overall_score: 8,
        reflection: "Great progress",
        category_scores: expect.arrayContaining([
          expect.objectContaining({ category_id: "cat-1", score: 7 }),
          expect.objectContaining({ category_id: "cat-2", score: 5 }),
        ]),
      }))
    })
  })

  it("navigates to /2026 after submission", async () => {
    render(<EvaluatePage />)
    fireEvent.click(screen.getByTestId("submit-evaluation"))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/2026")
    })
  })

  it("shows 'Submitting...' during submission", async () => {
    let resolvePromise: () => void
    const slowSubmit = vi.fn().mockReturnValue(new Promise<void>((r) => { resolvePromise = r }))
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ submitEvaluation: slowSubmit }))
    render(<EvaluatePage />)
    fireEvent.click(screen.getByTestId("submit-evaluation"))
    expect(screen.getByText("Submitting...")).toBeInTheDocument()
    resolvePromise!()
  })

  it("sends null reflection when empty", async () => {
    const submitEvaluation = vi.fn().mockResolvedValue(undefined)
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ submitEvaluation }))
    render(<EvaluatePage />)
    fireEvent.click(screen.getByTestId("submit-evaluation"))
    await waitFor(() => {
      expect(submitEvaluation).toHaveBeenCalledWith(
        expect.objectContaining({ reflection: null })
      )
    })
  })

  // === Integration tests ===

  it("does not submit when myBoard is null", async () => {
    const submitEvaluation = vi.fn()
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ myBoard: null, submitEvaluation }))
    render(<EvaluatePage />)
    fireEvent.click(screen.getByTestId("submit-evaluation"))
    expect(submitEvaluation).not.toHaveBeenCalled()
  })

  it("prevents double submission", async () => {
    let resolvePromise: () => void
    const slowSubmit = vi.fn().mockReturnValue(new Promise<void>((r) => { resolvePromise = r }))
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ submitEvaluation: slowSubmit }))
    render(<EvaluatePage />)
    fireEvent.click(screen.getByTestId("submit-evaluation"))
    fireEvent.click(screen.getByTestId("submit-evaluation"))
    resolvePromise!()
    await waitFor(() => {
      expect(slowSubmit).toHaveBeenCalledTimes(1)
    })
  })

  it("does not show evaluation form when already evaluated", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ hasEvaluatedThisMonth: true }))
    render(<EvaluatePage />)
    expect(screen.queryByTestId("submit-evaluation")).not.toBeInTheDocument()
    expect(screen.queryByTestId("reflection-input")).not.toBeInTheDocument()
  })
})
