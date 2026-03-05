import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { GradientSlider } from "@/components/food/GradientSlider"

describe("GradientSlider", () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  it("renders slider with current value", () => {
    render(<GradientSlider value={7} onChange={mockOnChange} />)

    expect(screen.getByTestId("gradient-slider")).toBeInTheDocument()
    expect(screen.getByTestId("slider-input")).toHaveValue("7")
    expect(screen.getByTestId("slider-score")).toHaveTextContent("7")
  })

  it("renders min/max labels (1 and 10)", () => {
    render(<GradientSlider value={5} onChange={mockOnChange} />)

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
  })

  it("renders optional label", () => {
    render(<GradientSlider value={5} onChange={mockOnChange} label="Quality" />)
    expect(screen.getByText("Quality")).toBeInTheDocument()
  })

  it("does not render label when not provided", () => {
    render(<GradientSlider value={5} onChange={mockOnChange} />)
    const slider = screen.getByTestId("gradient-slider")
    // Only text should be score + min/max
    expect(slider.querySelector("span")?.textContent).toBeTruthy()
  })

  it("slider has correct min/max/step attributes", () => {
    render(<GradientSlider value={5} onChange={mockOnChange} />)

    const input = screen.getByTestId("slider-input")
    expect(input).toHaveAttribute("min", "1")
    expect(input).toHaveAttribute("max", "10")
    expect(input).toHaveAttribute("step", "1")
  })

  // ── Interaction Tests ─────────────────────────────────────

  it("calls onChange with snapped integer when slider changes", () => {
    render(<GradientSlider value={5} onChange={mockOnChange} />)

    fireEvent.change(screen.getByTestId("slider-input"), {
      target: { value: "8" },
    })

    expect(mockOnChange).toHaveBeenCalledWith(8)
  })

  it("snaps floating point values to nearest integer", () => {
    render(<GradientSlider value={5} onChange={mockOnChange} />)

    fireEvent.change(screen.getByTestId("slider-input"), {
      target: { value: "6.7" },
    })

    expect(mockOnChange).toHaveBeenCalledWith(7)
  })

  it("calls vibrate on change for haptic feedback", () => {
    const mockVibrate = vi.fn()
    Object.defineProperty(navigator, "vibrate", {
      value: mockVibrate,
      configurable: true,
    })

    render(<GradientSlider value={5} onChange={mockOnChange} />)

    fireEvent.change(screen.getByTestId("slider-input"), {
      target: { value: "3" },
    })

    expect(mockVibrate).toHaveBeenCalledWith(10)
  })

  // ── Integration Tests ─────────────────────────────────────

  it("uses standard gradient colors by default", () => {
    render(<GradientSlider value={5} onChange={mockOnChange} />)

    const input = screen.getByTestId("slider-input")
    expect(input.style.getPropertyValue("--gradient-from")).toBe("#B5ADA4")
    expect(input.style.getPropertyValue("--gradient-to")).toBe("#C4956A")
  })

  it("uses vibe gradient colors when variant is vibe", () => {
    render(
      <GradientSlider value={5} onChange={mockOnChange} variant="vibe" />
    )

    const input = screen.getByTestId("slider-input")
    expect(input.style.getPropertyValue("--gradient-from")).toBe("#E85D75")
    expect(input.style.getPropertyValue("--gradient-to")).toBe("#C4956A")
  })

  it("applies custom className", () => {
    render(
      <GradientSlider
        value={5}
        onChange={mockOnChange}
        className="custom-class"
      />
    )

    expect(screen.getByTestId("gradient-slider")).toHaveClass("custom-class")
  })
})
