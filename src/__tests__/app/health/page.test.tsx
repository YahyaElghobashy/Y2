import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import HealthPage from "@/app/health/page"

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    className?: string
    [key: string]: unknown
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}))

describe("Health Page", () => {
  it("renders without crashing", () => {
    render(<HealthPage />)
  })

  it("PageHeader shows 'Health'", () => {
    render(<HealthPage />)
    expect(screen.getByText("Health")).toBeInTheDocument()
  })

  it("PageHeader back button links to '/'", () => {
    render(<HealthPage />)
    const backLink = screen.getByLabelText("Go back")
    expect(backLink).toHaveAttribute("href", "/")
  })

  it("EmptyState is visible with title text", () => {
    render(<HealthPage />)
    expect(screen.getByText("Your wellness, tracked")).toBeInTheDocument()
  })

  it("EmptyState subtitle text is displayed", () => {
    render(<HealthPage />)
    expect(
      screen.getByText(
        "Fitness goals, health reminders, and wellness insights — all in one place"
      )
    ).toBeInTheDocument()
  })

  it("Activity icon is rendered (SVG in DOM)", () => {
    const { container } = render(<HealthPage />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })
})
