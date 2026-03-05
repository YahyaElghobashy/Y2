import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PreferenceDot } from "@/components/food/PreferenceDot"

describe("PreferenceDot", () => {
  // ── Unit Tests ──────────────────────────────────────────────

  it("renders with 'me' color (red)", () => {
    render(<PreferenceDot color="me" />)

    const dot = screen.getByTestId("preference-dot")
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveAttribute("data-color", "me")
    expect(dot).toHaveClass("bg-[#E85D75]")
  })

  it("renders with 'partner' color (blue)", () => {
    render(<PreferenceDot color="partner" />)

    const dot = screen.getByTestId("preference-dot")
    expect(dot).toHaveAttribute("data-color", "partner")
    expect(dot).toHaveClass("bg-[#7EC8E3]")
  })

  it("renders with 'similar' color (pulsing gradient)", () => {
    render(<PreferenceDot color="similar" />)

    const dot = screen.getByTestId("preference-dot")
    expect(dot).toHaveAttribute("data-color", "similar")
    expect(dot).toHaveClass("preference-dot-pulse")
  })

  it("has correct aria-label for 'me'", () => {
    render(<PreferenceDot color="me" />)
    expect(screen.getByTestId("preference-dot")).toHaveAttribute(
      "aria-label",
      "You rated higher"
    )
  })

  it("has correct aria-label for 'partner'", () => {
    render(<PreferenceDot color="partner" />)
    expect(screen.getByTestId("preference-dot")).toHaveAttribute(
      "aria-label",
      "Partner rated higher"
    )
  })

  it("has correct aria-label for 'similar'", () => {
    render(<PreferenceDot color="similar" />)
    expect(screen.getByTestId("preference-dot")).toHaveAttribute(
      "aria-label",
      "Similar rating"
    )
  })

  // ── Interaction Tests ─────────────────────────────────────

  it("shows tooltip on pointer down with scores", () => {
    render(<PreferenceDot color="me" myScore={8} partnerScore={6} />)

    const dot = screen.getByTestId("preference-dot")
    fireEvent.pointerDown(dot)

    const tooltip = screen.getByTestId("preference-tooltip")
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveTextContent("You: 8")
    expect(tooltip).toHaveTextContent("Partner: 6")
  })

  it("hides tooltip on pointer up", () => {
    render(<PreferenceDot color="me" myScore={8} partnerScore={6} />)

    const dot = screen.getByTestId("preference-dot")
    fireEvent.pointerDown(dot)
    expect(screen.getByTestId("preference-tooltip")).toBeInTheDocument()

    fireEvent.pointerUp(dot)
    expect(screen.queryByTestId("preference-tooltip")).not.toBeInTheDocument()
  })

  it("does not show tooltip when scores are not provided", () => {
    render(<PreferenceDot color="similar" />)

    const dot = screen.getByTestId("preference-dot")
    fireEvent.pointerDown(dot)

    expect(screen.queryByTestId("preference-tooltip")).not.toBeInTheDocument()
  })

  // ── Integration Tests ─────────────────────────────────────

  it("applies custom className", () => {
    const { container } = render(
      <PreferenceDot color="me" className="custom-cls" />
    )
    expect(container.firstChild).toHaveClass("custom-cls")
  })
})
