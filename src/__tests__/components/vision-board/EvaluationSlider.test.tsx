import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { EvaluationSlider } from "@/components/vision-board/EvaluationSlider"

describe("EvaluationSlider", () => {
  const onChange = vi.fn()
  const onNoteChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === Unit tests ===

  it("renders without crashing", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} />)
    expect(screen.getByTestId("eval-slider-health")).toBeInTheDocument()
  })

  it("renders label text", () => {
    render(<EvaluationSlider label="Career" value={7} onChange={onChange} />)
    expect(screen.getByText("Career")).toBeInTheDocument()
  })

  it("renders icon when provided", () => {
    render(<EvaluationSlider label="Health" icon="💪" value={5} onChange={onChange} />)
    expect(screen.getByText("💪")).toBeInTheDocument()
  })

  it("renders current value", () => {
    render(<EvaluationSlider label="Health" value={8} onChange={onChange} />)
    expect(screen.getByText("8")).toBeInTheDocument()
  })

  it("renders /10 suffix", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} />)
    expect(screen.getByText("/10")).toBeInTheDocument()
  })

  it("renders score label 'Needs work' for low scores", () => {
    render(<EvaluationSlider label="Health" value={2} onChange={onChange} />)
    expect(screen.getByText("Needs work")).toBeInTheDocument()
  })

  it("renders score label 'Getting there' for scores 3-4", () => {
    render(<EvaluationSlider label="Health" value={4} onChange={onChange} />)
    expect(screen.getByText("Getting there")).toBeInTheDocument()
  })

  it("renders score label 'On track' for scores 5-6", () => {
    render(<EvaluationSlider label="Health" value={6} onChange={onChange} />)
    expect(screen.getByText("On track")).toBeInTheDocument()
  })

  it("renders score label 'Strong' for scores 7-8", () => {
    render(<EvaluationSlider label="Health" value={8} onChange={onChange} />)
    expect(screen.getByText("Strong")).toBeInTheDocument()
  })

  it("renders score label 'Excellent' for scores 9-10", () => {
    render(<EvaluationSlider label="Health" value={10} onChange={onChange} />)
    expect(screen.getByText("Excellent")).toBeInTheDocument()
  })

  it("renders slider input with correct value", () => {
    render(<EvaluationSlider label="Health" value={7} onChange={onChange} />)
    const slider = screen.getByTestId("slider-input-health") as HTMLInputElement
    expect(slider.value).toBe("7")
  })

  it("applies className prop", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} className="mt-4" />)
    expect(screen.getByTestId("eval-slider-health")).toHaveClass("mt-4")
  })

  it("does not show note button when onNoteChange is not provided", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} />)
    expect(screen.queryByTestId("toggle-note-health")).not.toBeInTheDocument()
  })

  it("shows '+ Note' button when onNoteChange is provided", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} onNoteChange={onNoteChange} />)
    expect(screen.getByTestId("toggle-note-health")).toHaveTextContent("+ Note")
  })

  // === Interaction tests ===

  it("calls onChange when slider value changes", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} />)
    fireEvent.change(screen.getByTestId("slider-input-health"), { target: { value: "8" } })
    expect(onChange).toHaveBeenCalledWith(8)
  })

  it("toggles note textarea when toggle button clicked", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} onNoteChange={onNoteChange} />)
    expect(screen.queryByTestId("note-input-health")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("toggle-note-health"))
    expect(screen.getByTestId("note-input-health")).toBeInTheDocument()
  })

  it("shows 'Hide note' when note is visible", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} onNoteChange={onNoteChange} />)
    fireEvent.click(screen.getByTestId("toggle-note-health"))
    expect(screen.getByTestId("toggle-note-health")).toHaveTextContent("Hide note")
  })

  it("calls onNoteChange when note text changes", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} onNoteChange={onNoteChange} />)
    fireEvent.click(screen.getByTestId("toggle-note-health"))
    fireEvent.change(screen.getByTestId("note-input-health"), { target: { value: "Good progress" } })
    expect(onNoteChange).toHaveBeenCalledWith("Good progress")
  })

  it("shows existing note and auto-opens note textarea", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} note="My note" onNoteChange={onNoteChange} />)
    expect(screen.getByTestId("note-input-health")).toBeInTheDocument()
    expect(screen.getByTestId("note-input-health")).toHaveValue("My note")
  })

  // === Integration tests ===

  it("slider has min=1 and max=10", () => {
    render(<EvaluationSlider label="Health" value={5} onChange={onChange} />)
    const slider = screen.getByTestId("slider-input-health")
    expect(slider).toHaveAttribute("min", "1")
    expect(slider).toHaveAttribute("max", "10")
  })

  it("handles multi-word labels in data-testid", () => {
    render(<EvaluationSlider label="Overall Score" value={5} onChange={onChange} />)
    expect(screen.getByTestId("eval-slider-overall-score")).toBeInTheDocument()
  })
})
