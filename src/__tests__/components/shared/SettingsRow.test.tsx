import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SettingsRow } from "@/components/shared/SettingsRow"

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

function MockIcon() {
  return (
    <svg data-testid="mock-icon" width="20" height="20">
      <circle cx="10" cy="10" r="8" />
    </svg>
  )
}

describe("SettingsRow", () => {
  it("renders icon and label", () => {
    render(<SettingsRow icon={<MockIcon />} label="Profile" />)
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument()
    expect(screen.getByText("Profile")).toBeInTheDocument()
  })

  it("shows ChevronRight when href is provided", () => {
    const { container } = render(
      <SettingsRow icon={<MockIcon />} label="Profile" href="/profile" />
    )
    // ChevronRight renders as an SVG — there should be 2 SVGs (icon + chevron)
    const svgs = container.querySelectorAll("svg")
    expect(svgs.length).toBe(2)
  })

  it("shows rightElement when provided and no chevron", () => {
    const { container } = render(
      <SettingsRow icon={<MockIcon />} label="Theme" rightElement="Light" />
    )
    expect(screen.getByText("Light")).toBeInTheDocument()
    // Only 1 SVG (the icon), no chevron
    const svgs = container.querySelectorAll("svg")
    expect(svgs.length).toBe(1)
  })

  it("applies destructive styling when destructive=true", () => {
    render(
      <SettingsRow icon={<MockIcon />} label="Delete" destructive />
    )
    const label = screen.getByText("Delete")
    expect(label).toHaveClass("text-red-500")
  })

  it("renders as a link when href is provided", () => {
    render(
      <SettingsRow icon={<MockIcon />} label="Profile" href="/profile" />
    )
    const link = screen.getByText("Profile").closest("a")
    expect(link).toHaveAttribute("href", "/profile")
  })

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn()
    render(
      <SettingsRow icon={<MockIcon />} label="Action" onClick={handleClick} />
    )
    fireEvent.click(screen.getByText("Action"))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
