import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { QuickActionCard } from "@/components/home/QuickActionCard"

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

// Stub icon component
function MockIcon() {
  return (
    <svg data-testid="mock-icon" width="20" height="20">
      <circle cx="10" cy="10" r="8" />
    </svg>
  )
}

describe("QuickActionCard", () => {
  const defaultProps = {
    icon: <MockIcon />,
    label: "Health",
    description: "Track your wellness",
    href: "/health",
  }

  it("renders the icon", () => {
    render(<QuickActionCard {...defaultProps} />)
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument()
  })

  it("renders the label text", () => {
    render(<QuickActionCard {...defaultProps} />)
    expect(screen.getByText("Health")).toBeInTheDocument()
  })

  it("renders the description text", () => {
    render(<QuickActionCard {...defaultProps} />)
    expect(screen.getByText("Track your wellness")).toBeInTheDocument()
  })

  it("links to the correct href", () => {
    render(<QuickActionCard {...defaultProps} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/health")
  })

  it("accepts className prop", () => {
    render(<QuickActionCard {...defaultProps} className="mt-4" />)
    const link = screen.getByRole("link")
    expect(link).toHaveClass("mt-4")
  })

  it("card has white background (bg-elevated class)", () => {
    const { container } = render(<QuickActionCard {...defaultProps} />)
    const card = container.querySelector("[class*='bg-[var(--color-bg-elevated)]']")
    expect(card).toBeInTheDocument()
  })

  it("card has rounded corners (rounded-xl class)", () => {
    const { container } = render(<QuickActionCard {...defaultProps} />)
    const card = container.querySelector("[class*='rounded-xl']")
    expect(card).toBeInTheDocument()
  })
})
