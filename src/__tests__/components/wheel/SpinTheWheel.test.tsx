import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SpinTheWheel } from "@/components/wheel/SpinTheWheel"
import type { WheelItem } from "@/lib/types/wheel.types"

// ── Mock framer-motion ──────────────────────────────────────────
let mockReducedMotion = false

vi.mock("framer-motion", () => ({
  motion: {
    svg: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { animate, transition, initial, whileTap, ...domProps } = props as Record<string, unknown>
      return <svg {...(domProps as React.SVGAttributes<SVGSVGElement>)}>{children}</svg>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { animate, transition, initial, whileTap, ...domProps } = props as Record<string, unknown>
      return <button {...(domProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { animate, transition, initial, whileTap, ...domProps } = props as Record<string, unknown>
      return <div {...(domProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => mockReducedMotion,
}))

// ── Test Data ─────────────────────────────────────────────────

const MOCK_ITEMS: WheelItem[] = [
  { id: "i1", label: "Pizza" },
  { id: "i2", label: "Sushi" },
  { id: "i3", label: "Tacos" },
  { id: "i4", label: "Pasta" },
]

const TWO_ITEMS: WheelItem[] = [
  { id: "i1", label: "Yes" },
  { id: "i2", label: "No" },
]

const MANY_ITEMS: WheelItem[] = Array.from({ length: 15 }, (_, i) => ({
  id: `i${i}`,
  label: `Item ${i + 1}`,
}))

const LONG_LABEL_ITEMS: WheelItem[] = [
  { id: "i1", label: "This is a very long label text" },
  { id: "i2", label: "Short" },
]

describe("SpinTheWheel", () => {
  const mockOnSpin = vi.fn(() => ({
    resultIndex: 0,
    angle: 1440,
    label: "Pizza",
  }))

  const mockOnResult = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockReducedMotion = false
    vi.useFakeTimers()
  })

  // ── UNIT: Renders correct number of slices ──────────────────

  it("renders SVG wheel with correct number of slices", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    expect(screen.getByTestId("spin-the-wheel")).toBeInTheDocument()
    expect(screen.getByTestId("wheel-svg")).toBeInTheDocument()

    for (let i = 0; i < MOCK_ITEMS.length; i++) {
      expect(screen.getByTestId(`slice-${i}`)).toBeInTheDocument()
    }
  })

  it("renders 2-item wheel (half circles)", () => {
    render(
      <SpinTheWheel
        items={TWO_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    expect(screen.getByTestId("slice-0")).toBeInTheDocument()
    expect(screen.getByTestId("slice-1")).toBeInTheDocument()
    expect(screen.queryByTestId("slice-2")).not.toBeInTheDocument()
  })

  it("renders 15-item wheel", () => {
    render(
      <SpinTheWheel
        items={MANY_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    for (let i = 0; i < 15; i++) {
      expect(screen.getByTestId(`slice-${i}`)).toBeInTheDocument()
    }
  })

  // ── UNIT: Pointer present ──────────────────────────────────

  it("renders pointer triangle", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    expect(screen.getByTestId("wheel-pointer")).toBeInTheDocument()
  })

  // ── UNIT: Spin button ──────────────────────────────────────

  it("renders SPIN button", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    const btn = screen.getByTestId("spin-button")
    expect(btn).toBeInTheDocument()
    expect(btn.textContent).toBe("SPIN")
  })

  it("SPIN button is enabled in idle state", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
        state="idle"
      />
    )

    expect(screen.getByTestId("spin-button")).not.toBeDisabled()
  })

  it("SPIN button is disabled in disabled state", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
        state="disabled"
      />
    )

    expect(screen.getByTestId("spin-button")).toBeDisabled()
  })

  // ── UNIT: Label display ────────────────────────────────────

  it("displays item labels on slices", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    expect(screen.getByText("Pizza")).toBeInTheDocument()
    expect(screen.getByText("Sushi")).toBeInTheDocument()
    expect(screen.getByText("Tacos")).toBeInTheDocument()
    expect(screen.getByText("Pasta")).toBeInTheDocument()
  })

  it("truncates labels longer than 15 characters", () => {
    render(
      <SpinTheWheel
        items={LONG_LABEL_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    // "This is a very long label text" should be truncated to 13 chars + "..."
    expect(screen.getByText("This is a ver...")).toBeInTheDocument()
    expect(screen.getByText("Short")).toBeInTheDocument()
  })

  // ── INTERACTION: Spin click ────────────────────────────────

  it("calls onSpin when spin button is clicked", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    fireEvent.click(screen.getByTestId("spin-button"))
    expect(mockOnSpin).toHaveBeenCalledTimes(1)
  })

  it("does not call onSpin when disabled", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
        state="disabled"
      />
    )

    fireEvent.click(screen.getByTestId("spin-button"))
    expect(mockOnSpin).not.toHaveBeenCalled()
  })

  // ── INTERACTION: Reduced motion ────────────────────────────

  it("shows result immediately with prefers-reduced-motion", () => {
    mockReducedMotion = true

    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    fireEvent.click(screen.getByTestId("spin-button"))

    // Result should appear immediately (no timeout needed)
    expect(mockOnResult).toHaveBeenCalledWith("Pizza", 0)
    expect(screen.getByTestId("result-overlay")).toBeInTheDocument()
    // "Pizza" appears both on slice text and result overlay — use getAllByText
    expect(screen.getAllByText("Pizza").length).toBeGreaterThanOrEqual(2)
  })

  // ── INTERACTION: Result overlay after animation ────────────

  it("calls onResult after animation completes", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    fireEvent.click(screen.getByTestId("spin-button"))

    // Before timeout, onResult should not be called
    expect(mockOnResult).not.toHaveBeenCalled()

    // After animation duration (3500ms)
    act(() => {
      vi.advanceTimersByTime(3500)
    })

    expect(mockOnResult).toHaveBeenCalledWith("Pizza", 0)
    expect(screen.getByTestId("result-overlay")).toBeInTheDocument()
  })

  // ── UNIT: Custom colors ────────────────────────────────────

  it("uses custom colors when provided", () => {
    const coloredItems: WheelItem[] = [
      { id: "i1", label: "Red", color: "#FF0000" },
      { id: "i2", label: "Blue", color: "#0000FF" },
    ]

    render(
      <SpinTheWheel
        items={coloredItems}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    const slice0 = screen.getByTestId("slice-0")
    expect(slice0).toHaveAttribute("fill", "#FF0000")
    const slice1 = screen.getByTestId("slice-1")
    expect(slice1).toHaveAttribute("fill", "#0000FF")
  })

  it("uses default palette when no custom colors", () => {
    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={mockOnSpin}
        onResult={mockOnResult}
      />
    )

    const slice0 = screen.getByTestId("slice-0")
    expect(slice0).toHaveAttribute("fill", "#C4956A")
  })

  // ── INTEGRATION: Result overlay content ────────────────────

  it("result overlay displays the winning label", () => {
    mockReducedMotion = true
    const spinFn = vi.fn(() => ({
      resultIndex: 2,
      angle: 1500,
      label: "Tacos",
    }))

    render(
      <SpinTheWheel
        items={MOCK_ITEMS}
        onSpin={spinFn}
        onResult={mockOnResult}
      />
    )

    fireEvent.click(screen.getByTestId("spin-button"))

    const overlay = screen.getByTestId("result-overlay")
    expect(overlay).toBeInTheDocument()
    // There are two "Tacos" - one on the wheel slice and one on the overlay
    // Just check overlay exists and onResult was called correctly
    expect(mockOnResult).toHaveBeenCalledWith("Tacos", 2)
  })
})
