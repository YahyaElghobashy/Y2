import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"

describe("LoadingSkeleton", () => {
  it("card variant renders without error", () => {
    const { container } = render(<LoadingSkeleton variant="card" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("list-item variant renders correct number of rows (count=5)", () => {
    const { container } = render(
      <LoadingSkeleton variant="list-item" count={5} />
    )
    const rows = container.querySelectorAll(".rounded-lg")
    expect(rows).toHaveLength(5)
  })

  it("list-item default count is 3", () => {
    const { container } = render(<LoadingSkeleton variant="list-item" />)
    const rows = container.querySelectorAll(".rounded-lg")
    expect(rows).toHaveLength(3)
  })

  it("list-item with count=0 renders nothing", () => {
    const { container } = render(
      <LoadingSkeleton variant="list-item" count={0} />
    )
    expect(container.innerHTML).toBe("")
  })

  it("header variant renders two bars (title + subtitle)", () => {
    const { container } = render(<LoadingSkeleton variant="header" />)
    const bars = container.querySelectorAll(".animate-pulse")
    expect(bars).toHaveLength(2)
  })

  it("full-page variant renders header + cards", () => {
    const { container } = render(<LoadingSkeleton variant="full-page" />)
    // Header has 2 pulse bars, 3 cards each have 1 pulse container = 5
    const pulseBars = container.querySelectorAll(".animate-pulse")
    expect(pulseBars.length).toBeGreaterThanOrEqual(5)
    // 3 card containers
    const cards = container.querySelectorAll(".rounded-xl")
    expect(cards).toHaveLength(3)
  })

  it("all variants accept className prop", () => {
    const { container: cardContainer } = render(
      <LoadingSkeleton variant="card" className="mt-4" />
    )
    expect(cardContainer.firstChild).toHaveClass("mt-4")

    const { container: listContainer } = render(
      <LoadingSkeleton variant="list-item" className="mx-2" />
    )
    expect(listContainer.firstChild).toHaveClass("mx-2")

    const { container: headerContainer } = render(
      <LoadingSkeleton variant="header" className="pb-6" />
    )
    expect(headerContainer.firstChild).toHaveClass("pb-6")

    const { container: fullContainer } = render(
      <LoadingSkeleton variant="full-page" className="bg-white" />
    )
    expect(fullContainer.firstChild).toHaveClass("bg-white")
  })

  it("animate-pulse class is present on skeleton elements", () => {
    const { container } = render(<LoadingSkeleton variant="card" />)
    const pulseElements = container.querySelectorAll(".animate-pulse")
    expect(pulseElements.length).toBeGreaterThan(0)
  })
})
