import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { RatingReveal } from "@/components/food/RatingReveal"
import type { FoodRating } from "@/lib/types/food-journal.types"

// ── Mock framer-motion ──────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props }
      for (const k of ["initial", "animate", "exit", "transition", "whileTap", "custom", "layoutId"]) delete clean[k]
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

// ── Mock prefers-reduced-motion ──────────────────────────────
let reducedMotion = false
const originalMatchMedia = window.matchMedia
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})
afterEach(() => {
  window.matchMedia = originalMatchMedia
  reducedMotion = false
})

const makeRating = (overrides: Partial<FoodRating> = {}): FoodRating => ({
  id: "r1",
  visit_id: "v1",
  user_id: "u1",
  location_score: 7,
  parking_score: 6,
  service_score: 8,
  food_quality: 9,
  quantity_score: 7,
  price_score: 6,
  cuisine_score: 8,
  bathroom_score: 5,
  vibe_score: 8,
  overall_average: 7.1,
  both_reviewed: true,
  created_at: "2026-03-01",
  ...overrides,
})

describe("RatingReveal", () => {
  const mockOnClose = vi.fn()

  const myRating = makeRating({ id: "r1", user_id: "u1" })
  const partnerRating = makeRating({
    id: "r2",
    user_id: "u2",
    location_score: 6,
    parking_score: 7,
    service_score: 7,
    food_quality: 8,
    quantity_score: 8,
    price_score: 5,
    cuisine_score: 7,
    bathroom_score: 6,
    vibe_score: 7,
    overall_average: 6.8,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  it("renders the reveal container", () => {
    render(
      <RatingReveal
        myRating={myRating}
        partnerRating={partnerRating}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByTestId("rating-reveal")).toBeInTheDocument()
    expect(screen.getByText("Rating Reveal")).toBeInTheDocument()
  })

  it("shows staggered rows over time", async () => {
    render(
      <RatingReveal
        myRating={myRating}
        partnerRating={partnerRating}
        onClose={mockOnClose}
      />
    )

    // Initially 0 rows visible
    expect(screen.queryByTestId("reveal-row-location_score")).not.toBeInTheDocument()

    // After first stagger delay
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.getByTestId("reveal-row-location_score")).toBeInTheDocument()

    // After 2nd
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.getByTestId("reveal-row-parking_score")).toBeInTheDocument()
  })

  // Helper to advance timers step by step (each setTimeout needs its own tick)
  async function advanceSteps(steps: number, delayMs: number) {
    for (let i = 0; i < steps; i++) {
      await act(async () => {
        vi.advanceTimersByTime(delayMs)
      })
    }
  }

  it("shows all 8 non-vibe rows after full stagger", async () => {
    render(
      <RatingReveal
        myRating={myRating}
        partnerRating={partnerRating}
        onClose={mockOnClose}
      />
    )

    // Advance through all 8 rows one at a time
    await advanceSteps(8, 300)

    const nonVibeKeys = [
      "location_score",
      "parking_score",
      "service_score",
      "food_quality",
      "quantity_score",
      "price_score",
      "cuisine_score",
      "bathroom_score",
    ]

    for (const key of nonVibeKeys) {
      expect(screen.getByTestId(`reveal-row-${key}`)).toBeInTheDocument()
    }
  })

  it("shows vibe section after pause", async () => {
    render(
      <RatingReveal
        myRating={myRating}
        partnerRating={partnerRating}
        onClose={mockOnClose}
      />
    )

    // 8 rows + pause
    await advanceSteps(8, 300)
    await act(async () => {
      vi.advanceTimersByTime(1100)
    })

    expect(screen.getByTestId("vibe-reveal-section")).toBeInTheDocument()
  })

  it("shows vibe scores after reveal animation", async () => {
    render(
      <RatingReveal
        myRating={myRating}
        partnerRating={partnerRating}
        onClose={mockOnClose}
      />
    )

    await advanceSteps(8, 300)
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    await act(async () => {
      vi.advanceTimersByTime(700)
    })

    expect(screen.getByTestId("vibe-scores")).toBeInTheDocument()
  })

  it("shows correct vibe match message (diff <= 1)", async () => {
    render(
      <RatingReveal
        myRating={makeRating({ vibe_score: 8 })}
        partnerRating={makeRating({ vibe_score: 7 })}
        onClose={mockOnClose}
      />
    )

    await advanceSteps(8, 300)
    await act(async () => { vi.advanceTimersByTime(1000) })
    await act(async () => { vi.advanceTimersByTime(700) })

    expect(screen.getByTestId("vibe-match-msg")).toHaveTextContent("You felt the same!")
  })

  it("shows 'Close!' for vibe diff of 2", async () => {
    render(
      <RatingReveal
        myRating={makeRating({ vibe_score: 8 })}
        partnerRating={makeRating({ vibe_score: 6 })}
        onClose={mockOnClose}
      />
    )

    await advanceSteps(8, 300)
    await act(async () => { vi.advanceTimersByTime(1000) })
    await act(async () => { vi.advanceTimersByTime(700) })

    expect(screen.getByTestId("vibe-match-msg")).toHaveTextContent("Close!")
  })

  it("shows 'Interesting...' for vibe diff >= 3", async () => {
    render(
      <RatingReveal
        myRating={makeRating({ vibe_score: 9 })}
        partnerRating={makeRating({ vibe_score: 4 })}
        onClose={mockOnClose}
      />
    )

    await advanceSteps(8, 300)
    await act(async () => { vi.advanceTimersByTime(1000) })
    await act(async () => { vi.advanceTimersByTime(700) })

    expect(screen.getByTestId("vibe-match-msg")).toHaveTextContent("Interesting...")
  })

  // ── Interaction Tests ─────────────────────────────────────

  it("calls onClose when close button clicked", () => {
    render(
      <RatingReveal
        myRating={myRating}
        partnerRating={partnerRating}
        onClose={mockOnClose}
      />
    )

    fireEvent.click(screen.getByTestId("close-reveal"))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("replay button restarts animation", async () => {
    render(
      <RatingReveal
        myRating={myRating}
        partnerRating={partnerRating}
        onClose={mockOnClose}
      />
    )

    // Complete full animation
    await advanceSteps(8, 300)
    await act(async () => { vi.advanceTimersByTime(1000) })
    await act(async () => { vi.advanceTimersByTime(700) })

    expect(screen.getByTestId("replay-btn")).toBeInTheDocument()

    // Click replay
    fireEvent.click(screen.getByTestId("replay-btn"))

    // After another stagger cycle, first row should appear
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByTestId("reveal-row-location_score")).toBeInTheDocument()
  })

  // ── Integration Tests ─────────────────────────────────────

  it("skips animation with prefers-reduced-motion", () => {
    reducedMotion = true

    render(
      <RatingReveal
        myRating={myRating}
        partnerRating={partnerRating}
        onClose={mockOnClose}
      />
    )

    // All rows should be visible immediately
    expect(screen.getByTestId("reveal-row-location_score")).toBeInTheDocument()
    expect(screen.getByTestId("reveal-row-bathroom_score")).toBeInTheDocument()
    expect(screen.getByTestId("reveal-footer")).toBeInTheDocument()
    expect(screen.getByTestId("vibe-scores")).toBeInTheDocument()
  })

  it("displays overall scores in footer", async () => {
    render(
      <RatingReveal
        myRating={myRating}
        partnerRating={partnerRating}
        onClose={mockOnClose}
      />
    )

    await advanceSteps(8, 300)
    await act(async () => { vi.advanceTimersByTime(1000) })
    await act(async () => { vi.advanceTimersByTime(700) })

    expect(screen.getByTestId("my-overall")).toHaveTextContent("7.1")
    expect(screen.getByTestId("partner-overall")).toHaveTextContent("6.8")
  })
})
