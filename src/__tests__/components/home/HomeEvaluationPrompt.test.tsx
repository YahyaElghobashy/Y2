import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const mockUseVisionBoard = vi.hoisted(() => vi.fn())

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, layout, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layout
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock("@/lib/hooks/use-vision-board", () => ({
  useVisionBoard: () => mockUseVisionBoard(),
}))

import { HomeEvaluationPrompt } from "@/components/home/HomeEvaluationPrompt"

const makeHookReturn = (overrides?: Record<string, unknown>) => ({
  myBoard: { id: "board-1", title: "My 2026" },
  hasEvaluatedThisMonth: false,
  isLoading: false,
  ...overrides,
})

describe("HomeEvaluationPrompt", () => {
  let dateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseVisionBoard.mockReturnValue(makeHookReturn())
    // Default: 28th of month (should show)
    dateSpy = vi.spyOn(globalThis, "Date").mockImplementation((...args: unknown[]) => {
      if (args.length === 0) return new (vi.importActual("vitest") as never, Date as never) ? { getDate: () => 28 } as Date : new (Object.getPrototypeOf(Date) as DateConstructor)()
      return new (Object.getPrototypeOf(Date) as DateConstructor)(...args as [])
    })
    // Simpler approach: just mock Date constructor
    dateSpy.mockRestore()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 28)) // March 28, 2026
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  // === Unit tests ===

  it("renders when conditions are met (day >= 28, board exists, not evaluated)", () => {
    render(<HomeEvaluationPrompt />)
    expect(screen.getByTestId("home-eval-prompt")).toBeInTheDocument()
  })

  it("renders 'Time to reflect' text", () => {
    render(<HomeEvaluationPrompt />)
    expect(screen.getByText("Time to reflect")).toBeInTheDocument()
  })

  it("renders subtitle", () => {
    render(<HomeEvaluationPrompt />)
    expect(screen.getByText("How did your vision progress this month?")).toBeInTheDocument()
  })

  it("renders chart emoji", () => {
    render(<HomeEvaluationPrompt />)
    expect(screen.getByText("📊")).toBeInTheDocument()
  })

  it("links to /2026/evaluate", () => {
    render(<HomeEvaluationPrompt />)
    const link = screen.getByTestId("home-eval-prompt").closest("a")
    expect(link).toHaveAttribute("href", "/2026/evaluate")
  })

  it("applies className prop", () => {
    render(<HomeEvaluationPrompt className="mt-4" />)
    expect(screen.getByTestId("home-eval-prompt")).toHaveClass("mt-4")
  })

  it("renders Later dismiss button", () => {
    render(<HomeEvaluationPrompt />)
    expect(screen.getByTestId("dismiss-eval-prompt")).toBeInTheDocument()
  })

  // === Conditional rendering tests ===

  it("returns null when day < 28", () => {
    vi.setSystemTime(new Date(2026, 2, 15)) // March 15
    const { container } = render(<HomeEvaluationPrompt />)
    expect(container.innerHTML).toBe("")
  })

  it("renders on day 28", () => {
    vi.setSystemTime(new Date(2026, 2, 28))
    render(<HomeEvaluationPrompt />)
    expect(screen.getByTestId("home-eval-prompt")).toBeInTheDocument()
  })

  it("renders on day 31", () => {
    vi.setSystemTime(new Date(2026, 0, 31)) // Jan 31
    render(<HomeEvaluationPrompt />)
    expect(screen.getByTestId("home-eval-prompt")).toBeInTheDocument()
  })

  it("returns null when isLoading", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ isLoading: true }))
    const { container } = render(<HomeEvaluationPrompt />)
    expect(container.innerHTML).toBe("")
  })

  it("returns null when no board", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ myBoard: null }))
    const { container } = render(<HomeEvaluationPrompt />)
    expect(container.innerHTML).toBe("")
  })

  it("returns null when already evaluated this month", () => {
    mockUseVisionBoard.mockReturnValue(makeHookReturn({ hasEvaluatedThisMonth: true }))
    const { container } = render(<HomeEvaluationPrompt />)
    expect(container.innerHTML).toBe("")
  })

  // === Interaction tests ===

  it("dismisses when Later button clicked", () => {
    render(<HomeEvaluationPrompt />)
    fireEvent.click(screen.getByTestId("dismiss-eval-prompt"))
    expect(screen.queryByTestId("home-eval-prompt")).not.toBeInTheDocument()
  })

  it("stores dismiss timestamp in localStorage", () => {
    render(<HomeEvaluationPrompt />)
    fireEvent.click(screen.getByTestId("dismiss-eval-prompt"))
    expect(localStorage.getItem("y2_eval_prompt_dismissed")).toBeTruthy()
  })

  it("stays dismissed on re-render within 3 days", () => {
    localStorage.setItem("y2_eval_prompt_dismissed", String(Date.now()))
    const { container } = render(<HomeEvaluationPrompt />)
    expect(container.querySelector("[data-testid='home-eval-prompt']")).not.toBeInTheDocument()
  })

  it("shows again after 3 days", () => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000 + 1000)
    localStorage.setItem("y2_eval_prompt_dismissed", String(threeDaysAgo))
    render(<HomeEvaluationPrompt />)
    expect(screen.getByTestId("home-eval-prompt")).toBeInTheDocument()
  })
})
