import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { BottomNavPreview } from "@/components/onboarding/BottomNavPreview"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe("BottomNavPreview", () => {
  // --- Unit: renders all 5 tabs ---

  it("renders all 5 nav tabs", () => {
    render(<BottomNavPreview />)
    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Us")).toBeInTheDocument()
    expect(screen.getByText("2026")).toBeInTheDocument()
    expect(screen.getByText("Me")).toBeInTheDocument()
    expect(screen.getByText("More")).toBeInTheDocument()
  })

  it("each tab has correct data-testid", () => {
    render(<BottomNavPreview />)
    expect(screen.getByTestId("nav-tab-home")).toBeInTheDocument()
    expect(screen.getByTestId("nav-tab-us")).toBeInTheDocument()
    expect(screen.getByTestId("nav-tab-2026")).toBeInTheDocument()
    expect(screen.getByTestId("nav-tab-me")).toBeInTheDocument()
    expect(screen.getByTestId("nav-tab-more")).toBeInTheDocument()
  })

  it("is aria-hidden", () => {
    render(<BottomNavPreview />)
    const nav = screen.getByTestId("bottom-nav-preview")
    expect(nav).toHaveAttribute("aria-hidden", "true")
  })

  it("has pointer-events-none", () => {
    render(<BottomNavPreview />)
    const nav = screen.getByTestId("bottom-nav-preview")
    expect(nav.className).toContain("pointer-events-none")
  })

  it("does not render Links (uses divs)", () => {
    const { container } = render(<BottomNavPreview />)
    const links = container.querySelectorAll("a")
    expect(links.length).toBe(0)
  })

  // --- Unit: highlight ---

  it("highlights the specified tab", () => {
    render(<BottomNavPreview highlightLabel="Us" />)
    // The Us tab text should have accent-primary class
    const usText = screen.getByText("Us")
    expect(usText.className).toContain("text-accent-primary")
  })

  it("does not highlight other tabs when one is specified", () => {
    render(<BottomNavPreview highlightLabel="Us" />)
    const homeText = screen.getByText("Home")
    expect(homeText.className).toContain("text-text-secondary")
  })

  it("renders indicator bar under highlighted tab", () => {
    const { container } = render(<BottomNavPreview highlightLabel="Home" />)
    // The highlighted tab should have the indicator bar (absolute -bottom-1.5)
    const indicator = container.querySelector(".bg-accent-primary.-bottom-1\\.5")
    expect(indicator).toBeInTheDocument()
  })

  // --- Unit: no highlight ---

  it("shows no highlight bar when no highlightLabel", () => {
    const { container } = render(<BottomNavPreview />)
    const indicator = container.querySelector(".-bottom-1\\.5.bg-accent-primary")
    // 2026 tab is always accent-primary but no indicator bar
    expect(indicator).not.toBeInTheDocument()
  })
})
