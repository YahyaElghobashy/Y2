import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import SpiritPage from "@/app/spirit/page"

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

describe("Spirit Page", () => {
  it("renders without crashing", () => {
    render(<SpiritPage />)
  })

  it("PageHeader shows 'Spirit'", () => {
    render(<SpiritPage />)
    expect(screen.getByText("Spirit")).toBeInTheDocument()
  })

  it("PageHeader back button links to '/'", () => {
    render(<SpiritPage />)
    const backLink = screen.getByLabelText("Go back")
    expect(backLink).toHaveAttribute("href", "/")
  })

  it("EmptyState is visible with title text", () => {
    render(<SpiritPage />)
    expect(screen.getByText("Your daily practice")).toBeInTheDocument()
  })

  it("EmptyState subtitle text is displayed", () => {
    render(<SpiritPage />)
    expect(
      screen.getByText(
        "Prayer times, Quran progress, and morning azkar — a quiet space for what matters"
      )
    ).toBeInTheDocument()
  })

  it("Sun icon is rendered (SVG in DOM)", () => {
    const { container } = render(<SpiritPage />)
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })
})
