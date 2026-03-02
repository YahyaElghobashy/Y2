import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import Home from "@/app/(main)/page"

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

// Mock date-fns to avoid timezone flakiness
vi.mock("date-fns", () => ({
  format: () => "Monday, March 2",
}))

describe("Home Page", () => {
  it("renders without crashing", () => {
    render(<Home />)
  })

  it("greeting text contains Good", () => {
    render(<Home />)
    expect(screen.getByText(/Good/)).toBeInTheDocument()
  })

  it("greeting text contains Yahya", () => {
    render(<Home />)
    expect(screen.getByText(/Yahya/)).toBeInTheDocument()
  })

  it("date text is present and formatted", () => {
    render(<Home />)
    expect(screen.getByText("Monday, March 2")).toBeInTheDocument()
  })

  it("renders all 4 QuickActionCards", () => {
    render(<Home />)
    expect(screen.getByText("Us")).toBeInTheDocument()
    expect(screen.getByText("Health")).toBeInTheDocument()
    expect(screen.getByText("Spirit")).toBeInTheDocument()
    expect(screen.getByText("Ops")).toBeInTheDocument()
  })

  it("QuickActionCards link to correct routes", () => {
    render(<Home />)
    const links = screen.getAllByRole("link")
    const hrefs = links.map((link) => link.getAttribute("href"))
    expect(hrefs).toContain("/us")
    expect(hrefs).toContain("/health")
    expect(hrefs).toContain("/spirit")
    expect(hrefs).toContain("/ops")
  })

  it("renders at least 2 WidgetSlot elements", () => {
    render(<Home />)
    const widgets = screen.getAllByText("Widget coming soon")
    expect(widgets.length).toBeGreaterThanOrEqual(2)
  })
})
