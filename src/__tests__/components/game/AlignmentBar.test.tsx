import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AlignmentBar, getAlignmentLabel } from "@/components/game/AlignmentBar"

// ─── Mocks ───
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layout, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
}))

describe("getAlignmentLabel", () => {
  it("returns 'aligned' for gap ≤ 1", () => {
    expect(getAlignmentLabel(0)).toBe("aligned")
    expect(getAlignmentLabel(1)).toBe("aligned")
  })

  it("returns 'close' for gap 2-3", () => {
    expect(getAlignmentLabel(2)).toBe("close")
    expect(getAlignmentLabel(3)).toBe("close")
  })

  it("returns 'talk_about_it' for gap ≥ 4", () => {
    expect(getAlignmentLabel(4)).toBe("talk_about_it")
    expect(getAlignmentLabel(9)).toBe("talk_about_it")
  })
})

describe("AlignmentBar", () => {
  it("renders alignment badge for aligned answers", () => {
    render(<AlignmentBar myAnswer={7} partnerAnswer={7} />)
    expect(screen.getByText(/Aligned!/)).toBeTruthy()
  })

  it("renders 'Close but different' for moderate gap", () => {
    render(<AlignmentBar myAnswer={7} partnerAnswer={5} />)
    expect(screen.getByText(/Close but different/)).toBeTruthy()
  })

  it("renders 'Let's talk about this' for large gap", () => {
    render(<AlignmentBar myAnswer={2} partnerAnswer={9} />)
    expect(screen.getByText(/talk about this/)).toBeTruthy()
  })

  it("shows answer values on markers", () => {
    render(<AlignmentBar myAnswer={3} partnerAnswer={8} />)
    // Markers AND scale ticks both show these values, so use getAllByText
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("8").length).toBeGreaterThanOrEqual(1)
  })

  it("shows custom labels", () => {
    render(<AlignmentBar myAnswer={5} partnerAnswer={6} myLabel="Yahya" partnerLabel="Yara" />)
    expect(screen.getByText("Yahya")).toBeTruthy()
    expect(screen.getByText("Yara")).toBeTruthy()
  })

  it("hides labels when showLabels is false", () => {
    render(<AlignmentBar myAnswer={5} partnerAnswer={6} showLabels={false} />)
    expect(screen.queryByText("You")).toBeNull()
    expect(screen.queryByText("Partner")).toBeNull()
  })

  it("renders scale ticks from 1 to 10", () => {
    render(<AlignmentBar myAnswer={5} partnerAnswer={5} />)
    // Values like 5 appear on both markers and ticks; use getAllByText
    for (let i = 1; i <= 10; i++) {
      expect(screen.getAllByText(String(i)).length).toBeGreaterThanOrEqual(1)
    }
  })
})
