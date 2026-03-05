import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { ScoreChart } from "@/components/vision-board/ScoreChart"

const makeData = () =>
  Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    selfScore: i < 3 ? (i + 1) * 3 : null,
    partnerScore: i < 2 ? (i + 1) * 2 : null,
  }))

describe("ScoreChart", () => {
  const onSelectMonth = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === Unit tests ===

  it("renders without crashing", () => {
    render(<ScoreChart data={makeData()} />)
    expect(screen.getByTestId("score-chart")).toBeInTheDocument()
  })

  it("renders SVG element", () => {
    const { container } = render(<ScoreChart data={makeData()} />)
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("renders aria-label on SVG", () => {
    const { container } = render(<ScoreChart data={makeData()} />)
    expect(container.querySelector("svg")).toHaveAttribute("aria-label", "Monthly evaluation scores chart")
  })

  it("renders self score dots for months with data", () => {
    render(<ScoreChart data={makeData()} />)
    expect(screen.getByTestId("self-dot-1")).toBeInTheDocument()
    expect(screen.getByTestId("self-dot-2")).toBeInTheDocument()
    expect(screen.getByTestId("self-dot-3")).toBeInTheDocument()
    expect(screen.queryByTestId("self-dot-4")).not.toBeInTheDocument()
  })

  it("renders partner dots for months with partner data", () => {
    render(<ScoreChart data={makeData()} />)
    expect(screen.getByTestId("partner-dot-1")).toBeInTheDocument()
    expect(screen.getByTestId("partner-dot-2")).toBeInTheDocument()
    expect(screen.queryByTestId("partner-dot-3")).not.toBeInTheDocument()
  })

  it("renders self score line when 2+ data points", () => {
    render(<ScoreChart data={makeData()} />)
    expect(screen.getByTestId("self-score-line")).toBeInTheDocument()
  })

  it("renders partner score line when 2+ data points", () => {
    render(<ScoreChart data={makeData()} />)
    expect(screen.getByTestId("partner-score-line")).toBeInTheDocument()
  })

  it("does NOT render self line with only 1 data point", () => {
    const onePoint = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      selfScore: i === 0 ? 5 : null,
      partnerScore: null,
    }))
    render(<ScoreChart data={onePoint} />)
    expect(screen.queryByTestId("self-score-line")).not.toBeInTheDocument()
  })

  it("renders legend with 'You' and 'Partner'", () => {
    render(<ScoreChart data={makeData()} />)
    expect(screen.getByText("You")).toBeInTheDocument()
    expect(screen.getByText("Partner")).toBeInTheDocument()
  })

  it("applies className prop", () => {
    render(<ScoreChart data={makeData()} className="mt-4" />)
    expect(screen.getByTestId("score-chart")).toHaveClass("mt-4")
  })

  // === Interaction tests ===

  it("calls onSelectMonth when a dot is clicked", () => {
    render(<ScoreChart data={makeData()} onSelectMonth={onSelectMonth} />)
    fireEvent.click(screen.getByTestId("self-dot-2"))
    expect(onSelectMonth).toHaveBeenCalledWith(2)
  })

  it("enlarges selected month dot", () => {
    render(<ScoreChart data={makeData()} selectedMonth={1} />)
    const dot = screen.getByTestId("self-dot-1")
    expect(dot).toHaveAttribute("r", "5")
  })

  it("unselected dots have smaller radius", () => {
    render(<ScoreChart data={makeData()} selectedMonth={1} />)
    const dot = screen.getByTestId("self-dot-2")
    expect(dot).toHaveAttribute("r", "3.5")
  })

  // === Integration tests ===

  it("renders all 12 month labels in SVG", () => {
    const { container } = render(<ScoreChart data={makeData()} />)
    const texts = container.querySelectorAll("text")
    // Month labels (12) + Y-axis labels (5) = 17
    expect(texts.length).toBeGreaterThanOrEqual(12)
  })

  it("renders empty chart with no data", () => {
    const empty = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      selfScore: null,
      partnerScore: null,
    }))
    render(<ScoreChart data={empty} />)
    expect(screen.getByTestId("score-chart")).toBeInTheDocument()
    expect(screen.queryByTestId("self-score-line")).not.toBeInTheDocument()
  })
})
