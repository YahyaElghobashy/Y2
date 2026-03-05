import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { RatingCarousel } from "@/components/food/RatingCarousel"
import { RATING_DIMENSIONS } from "@/lib/types/food-journal.types"

// ── Mock framer-motion ──────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props }
      for (const k of ["initial", "animate", "exit", "transition", "whileTap", "custom"]) delete clean[k]
      return <div {...(clean as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props }
      for (const k of ["initial", "animate", "exit", "transition", "whileTap", "custom"]) delete clean[k]
      return <button {...(clean as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe("RatingCarousel", () => {
  const mockOnSubmit = vi.fn()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock navigator.vibrate
    Object.defineProperty(navigator, "vibrate", {
      value: vi.fn(),
      configurable: true,
    })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  it("renders the carousel with first dimension card", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    expect(screen.getByTestId("rating-carousel")).toBeInTheDocument()
    expect(screen.getByTestId(`card-${RATING_DIMENSIONS[0].key}`)).toBeInTheDocument()
    expect(screen.getByText(RATING_DIMENSIONS[0].label)).toBeInTheDocument()
  })

  it("renders 9 dot indicators", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    expect(screen.getByTestId("dot-indicators")).toBeInTheDocument()
    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`dot-${i}`)).toBeInTheDocument()
    }
  })

  it("shows prev and next buttons", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    expect(screen.getByTestId("prev-btn")).toBeInTheDocument()
    expect(screen.getByTestId("next-btn")).toBeInTheDocument()
  })

  it("shows 'Back' text on prev button when on first card", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)
    expect(screen.getByTestId("prev-btn")).toHaveTextContent("Back")
  })

  // ── Interaction Tests ─────────────────────────────────────

  it("navigates to next card when next button clicked", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    fireEvent.click(screen.getByTestId("next-btn"))

    expect(
      screen.getByTestId(`card-${RATING_DIMENSIONS[1].key}`)
    ).toBeInTheDocument()
    expect(screen.getByText(RATING_DIMENSIONS[1].label)).toBeInTheDocument()
  })

  it("navigates backward with prev button", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    // Go to card 2
    fireEvent.click(screen.getByTestId("next-btn"))
    expect(screen.getByText(RATING_DIMENSIONS[1].label)).toBeInTheDocument()

    // Go back to card 1
    fireEvent.click(screen.getByTestId("prev-btn"))
    expect(screen.getByText(RATING_DIMENSIONS[0].label)).toBeInTheDocument()
  })

  it("calls onBack when prev on first card", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    fireEvent.click(screen.getByTestId("prev-btn"))
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it("navigates to card when dot indicator clicked", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    fireEvent.click(screen.getByTestId("dot-4"))

    expect(
      screen.getByTestId(`card-${RATING_DIMENSIONS[4].key}`)
    ).toBeInTheDocument()
  })

  it("shows summary after last card next click", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    // Navigate to last card
    for (let i = 0; i < 8; i++) {
      fireEvent.click(screen.getByTestId("next-btn"))
    }

    // Should show vibe card (last)
    expect(screen.getByTestId("card-vibe_score")).toBeInTheDocument()
    expect(screen.getByTestId("next-btn")).toHaveTextContent("Review")

    // Click to show summary
    fireEvent.click(screen.getByTestId("next-btn"))

    expect(screen.getByTestId("rating-summary")).toBeInTheDocument()
    expect(screen.getByTestId("score-grid")).toBeInTheDocument()
    expect(screen.getByTestId("overall-score")).toBeInTheDocument()
  })

  it("shows all 9 scores in summary grid", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    // Go to summary
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getByTestId("next-btn"))
    }

    for (const dim of RATING_DIMENSIONS) {
      expect(screen.getByTestId(`grid-${dim.key}`)).toBeInTheDocument()
    }
  })

  it("edit button returns to carousel from summary", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    // Go to summary
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getByTestId("next-btn"))
    }

    fireEvent.click(screen.getByTestId("edit-ratings-btn"))

    expect(screen.getByTestId("rating-carousel")).toBeInTheDocument()
    expect(
      screen.getByTestId(`card-${RATING_DIMENSIONS[0].key}`)
    ).toBeInTheDocument()
  })

  // ── Integration Tests ─────────────────────────────────────

  it("calls onSubmit with all 9 ratings on submit", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    // Navigate to summary
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getByTestId("next-btn"))
    }

    fireEvent.click(screen.getByTestId("submit-ratings-btn"))

    expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    const submittedRatings = mockOnSubmit.mock.calls[0][0]

    // Should have all 9 dimensions
    for (const dim of RATING_DIMENSIONS) {
      expect(submittedRatings).toHaveProperty(dim.key)
      expect(typeof submittedRatings[dim.key]).toBe("number")
    }
  })

  it("slider changes update the rating value", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    // Change first slider value
    const slider = screen.getByTestId("slider-input")
    fireEvent.change(slider, { target: { value: "8" } })

    // Navigate to summary to see the value
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getByTestId("next-btn"))
    }

    const firstDimGrid = screen.getByTestId(`grid-${RATING_DIMENSIONS[0].key}`)
    expect(firstDimGrid).toHaveTextContent("8")
  })

  it("computes correct overall average in summary", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    // Default value is 5 for all → avg = 5
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getByTestId("next-btn"))
    }

    expect(screen.getByTestId("overall-score")).toHaveTextContent("5")
  })

  it("shows Review text on next button at last card", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    // Go to last card
    for (let i = 0; i < 8; i++) {
      fireEvent.click(screen.getByTestId("next-btn"))
    }

    expect(screen.getByTestId("next-btn")).toHaveTextContent("Review")
  })

  it("last card renders VibeCard instead of standard card", () => {
    render(<RatingCarousel onSubmit={mockOnSubmit} onBack={mockOnBack} />)

    // Go to last card (vibe)
    for (let i = 0; i < 8; i++) {
      fireEvent.click(screen.getByTestId("next-btn"))
    }

    expect(screen.getByTestId("vibe-card")).toBeInTheDocument()
  })
})
