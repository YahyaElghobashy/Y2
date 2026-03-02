import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import OpsPage from "@/app/(main)/ops/page"

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

describe("Ops Page", () => {
  it("renders without crashing", () => {
    render(<OpsPage />)
  })

  it("PageHeader shows 'Ops'", () => {
    render(<OpsPage />)
    expect(screen.getByText("Ops")).toBeInTheDocument()
  })

  it("PageHeader back button links to '/'", () => {
    render(<OpsPage />)
    const backLink = screen.getByLabelText("Go back")
    expect(backLink).toHaveAttribute("href", "/")
  })

  it("EmptyState is visible with title text", () => {
    render(<OpsPage />)
    expect(screen.getByText("Life, organized")).toBeInTheDocument()
  })

  it("EmptyState subtitle text is displayed", () => {
    render(<OpsPage />)
    expect(
      screen.getByText(
        "Shared grocery lists, tasks, wishlists, and budgets — together"
      )
    ).toBeInTheDocument()
  })

  it("CheckSquare icon is rendered (SVG in DOM)", () => {
    const { container } = render(<OpsPage />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })
})
