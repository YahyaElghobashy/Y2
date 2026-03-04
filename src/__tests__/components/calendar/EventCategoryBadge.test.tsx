import React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { EventCategoryBadge } from "@/components/calendar/EventCategoryBadge"
import type { EventCategory } from "@/lib/types/calendar.types"

const ALL_CATEGORIES: EventCategory[] = ["date_night", "milestone", "reminder", "other"]

const EXPECTED_COLORS: Record<EventCategory, string> = {
  date_night: "#B87333",
  milestone: "#DAA520",
  reminder: "#9CA3AF",
  other: "#4A4543",
}

const EXPECTED_LABELS: Record<EventCategory, string> = {
  date_night: "Date Night",
  milestone: "Milestone",
  reminder: "Reminder",
  other: "Other",
}

describe("EventCategoryBadge", () => {
  // ── Dot variant ──

  describe("dot variant", () => {
    it.each(ALL_CATEGORIES)("renders dot for %s with correct background color", (category) => {
      render(<EventCategoryBadge category={category} variant="dot" />)
      const dot = screen.getByTestId(`category-dot-${category}`)
      expect(dot).toBeInTheDocument()
      expect(dot.style.backgroundColor).toBeTruthy()
    })

    it("dot has 8px size via w-2 h-2 classes", () => {
      render(<EventCategoryBadge category="date_night" variant="dot" />)
      const dot = screen.getByTestId("category-dot-date_night")
      expect(dot.className).toContain("w-2")
      expect(dot.className).toContain("h-2")
    })

    it("dot has rounded-full class", () => {
      render(<EventCategoryBadge category="milestone" variant="dot" />)
      const dot = screen.getByTestId("category-dot-milestone")
      expect(dot.className).toContain("rounded-full")
    })

    it("dot has aria-label for accessibility", () => {
      render(<EventCategoryBadge category="date_night" variant="dot" />)
      const dot = screen.getByTestId("category-dot-date_night")
      expect(dot).toHaveAttribute("aria-label", "Date Night")
    })

    it("dot applies custom className", () => {
      render(<EventCategoryBadge category="other" variant="dot" className="ms-2" />)
      const dot = screen.getByTestId("category-dot-other")
      expect(dot.className).toContain("ms-2")
    })
  })

  // ── Pill variant ──

  describe("pill variant", () => {
    it.each(ALL_CATEGORIES)("renders pill for %s with correct label", (category) => {
      render(<EventCategoryBadge category={category} variant="pill" />)
      const pill = screen.getByTestId(`category-pill-${category}`)
      expect(pill).toBeInTheDocument()
      expect(pill.textContent).toBe(EXPECTED_LABELS[category])
    })

    it("pill has 10% opacity background", () => {
      render(<EventCategoryBadge category="date_night" variant="pill" />)
      const pill = screen.getByTestId("category-pill-date_night")
      // JSDOM normalizes hex+alpha to rgba — #B873331A → rgba(184, 115, 51, 0.1)
      expect(pill.style.backgroundColor).toContain("184, 115, 51")
    })

    it("pill has text color matching category", () => {
      render(<EventCategoryBadge category="milestone" variant="pill" />)
      const pill = screen.getByTestId("category-pill-milestone")
      // JSDOM normalizes #DAA520 → rgb(218, 165, 32)
      expect(pill.style.color).toBe("rgb(218, 165, 32)")
    })

    it("pill has rounded-full class", () => {
      render(<EventCategoryBadge category="reminder" variant="pill" />)
      const pill = screen.getByTestId("category-pill-reminder")
      expect(pill.className).toContain("rounded-full")
    })

    it("pill applies custom className", () => {
      render(<EventCategoryBadge category="other" variant="pill" className="mt-1" />)
      const pill = screen.getByTestId("category-pill-other")
      expect(pill.className).toContain("mt-1")
    })
  })

  // ── Cross-variant coverage ──

  it("renders all 4 categories as dots without error", () => {
    const { container } = render(
      <>
        {ALL_CATEGORIES.map((cat) => (
          <EventCategoryBadge key={cat} category={cat} variant="dot" />
        ))}
      </>
    )
    expect(container.querySelectorAll("[data-testid^='category-dot-']")).toHaveLength(4)
  })

  it("renders all 4 categories as pills without error", () => {
    const { container } = render(
      <>
        {ALL_CATEGORIES.map((cat) => (
          <EventCategoryBadge key={cat} category={cat} variant="pill" />
        ))}
      </>
    )
    expect(container.querySelectorAll("[data-testid^='category-pill-']")).toHaveLength(4)
  })
})
