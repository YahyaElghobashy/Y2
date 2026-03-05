import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, layout, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layout
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock ScoreChart to capture props
vi.mock("@/components/vision-board/ScoreChart", () => ({
  ScoreChart: ({ data, onSelectMonth, selectedMonth }: {
    data: Array<{ month: number; selfScore: number | null; partnerScore: number | null }>
    onSelectMonth?: (month: number) => void
    selectedMonth?: number | null
  }) => (
    <div data-testid="score-chart">
      {data.filter((d) => d.selfScore !== null).map((d) => (
        <button
          key={`dot-${d.month}`}
          data-testid={`chart-dot-${d.month}`}
          onClick={() => onSelectMonth?.(d.month)}
        >
          Month {d.month}: {d.selfScore}
        </button>
      ))}
    </div>
  ),
}))

import { EvaluationHistory } from "@/components/vision-board/EvaluationHistory"
import type { EvaluationWithScores } from "@/lib/types/vision-board.types"

const makeEvaluation = (month: number, overrides?: Partial<EvaluationWithScores>): EvaluationWithScores => ({
  id: `eval-${month}`,
  board_id: "board-1",
  evaluator_id: "user-1",
  month,
  year: 2026,
  overall_score: 7,
  reflection: "Good progress this month",
  created_at: "2026-01-01",
  category_scores: [
    { id: "cs-1", evaluation_id: `eval-${month}`, category_id: "cat-1", score: 8, note: null, created_at: "2026-01-01" },
    { id: "cs-2", evaluation_id: `eval-${month}`, category_id: "cat-2", score: 6, note: null, created_at: "2026-01-01" },
  ],
  ...overrides,
})

const categoryNames = {
  "cat-1": { name: "Health", icon: "💪" },
  "cat-2": { name: "Career", icon: "💼" },
}

describe("EvaluationHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === Unit tests ===

  it("renders without crashing", () => {
    render(<EvaluationHistory evaluations={[]} />)
    expect(screen.getByTestId("evaluation-history")).toBeInTheDocument()
  })

  it("renders 'Progress Over Time' heading", () => {
    render(<EvaluationHistory evaluations={[]} />)
    expect(screen.getByText("Progress Over Time")).toBeInTheDocument()
  })

  it("renders ScoreChart", () => {
    render(<EvaluationHistory evaluations={[]} />)
    expect(screen.getByTestId("score-chart")).toBeInTheDocument()
  })

  it("passes evaluation data to chart", () => {
    render(<EvaluationHistory evaluations={[makeEvaluation(1), makeEvaluation(2)]} />)
    expect(screen.getByTestId("chart-dot-1")).toBeInTheDocument()
    expect(screen.getByTestId("chart-dot-2")).toBeInTheDocument()
  })

  it("applies className prop", () => {
    render(<EvaluationHistory evaluations={[]} className="mt-4" />)
    expect(screen.getByTestId("evaluation-history")).toHaveClass("mt-4")
  })

  it("does not render month detail initially", () => {
    render(<EvaluationHistory evaluations={[makeEvaluation(1)]} />)
    expect(screen.queryByTestId("month-detail")).not.toBeInTheDocument()
  })

  // === Interaction tests ===

  it("shows month detail when a chart dot is clicked", () => {
    render(
      <EvaluationHistory
        evaluations={[makeEvaluation(1)]}
        categoryNames={categoryNames}
      />
    )
    fireEvent.click(screen.getByTestId("chart-dot-1"))
    expect(screen.getByTestId("month-detail")).toBeInTheDocument()
  })

  it("shows overall score in month detail", () => {
    render(
      <EvaluationHistory
        evaluations={[makeEvaluation(1, { overall_score: 8 })]}
        categoryNames={categoryNames}
      />
    )
    fireEvent.click(screen.getByTestId("chart-dot-1"))
    expect(screen.getByText("8/10")).toBeInTheDocument()
  })

  it("shows category scores in month detail", () => {
    render(
      <EvaluationHistory
        evaluations={[makeEvaluation(1)]}
        categoryNames={categoryNames}
      />
    )
    fireEvent.click(screen.getByTestId("chart-dot-1"))
    expect(screen.getByTestId("cat-score-cat-1")).toBeInTheDocument()
    expect(screen.getByTestId("cat-score-cat-2")).toBeInTheDocument()
  })

  it("shows category names and icons", () => {
    render(
      <EvaluationHistory
        evaluations={[makeEvaluation(1)]}
        categoryNames={categoryNames}
      />
    )
    fireEvent.click(screen.getByTestId("chart-dot-1"))
    expect(screen.getByText("Health")).toBeInTheDocument()
    expect(screen.getByText("💪")).toBeInTheDocument()
  })

  it("shows reflection text", () => {
    render(
      <EvaluationHistory
        evaluations={[makeEvaluation(1, { reflection: "Felt great" })]}
        categoryNames={categoryNames}
      />
    )
    fireEvent.click(screen.getByTestId("chart-dot-1"))
    // The reflection is wrapped in quotes
    expect(screen.getByText(/Felt great/)).toBeInTheDocument()
  })

  it("does not show reflection when null", () => {
    render(
      <EvaluationHistory
        evaluations={[makeEvaluation(1, { reflection: null })]}
        categoryNames={categoryNames}
      />
    )
    fireEvent.click(screen.getByTestId("chart-dot-1"))
    expect(screen.queryByText(/Felt great/)).not.toBeInTheDocument()
  })

  // === Integration tests ===

  it("falls back to 'Category' when name not in categoryNames", () => {
    render(
      <EvaluationHistory
        evaluations={[makeEvaluation(1)]}
        categoryNames={{}} // empty
      />
    )
    fireEvent.click(screen.getByTestId("chart-dot-1"))
    const categoryTexts = screen.getAllByText("Category")
    expect(categoryTexts.length).toBeGreaterThanOrEqual(1)
  })

  it("renders empty chart when no evaluations", () => {
    render(<EvaluationHistory evaluations={[]} />)
    expect(screen.getByTestId("score-chart")).toBeInTheDocument()
    expect(screen.queryByTestId("chart-dot-1")).not.toBeInTheDocument()
  })

  it("shows month name in detail header", () => {
    render(
      <EvaluationHistory
        evaluations={[makeEvaluation(3)]}
        categoryNames={categoryNames}
      />
    )
    fireEvent.click(screen.getByTestId("chart-dot-3"))
    expect(screen.getByText("March")).toBeInTheDocument()
  })
})
