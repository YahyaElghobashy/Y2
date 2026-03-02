import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { BottomNav } from "@/components/shared/BottomNav"

// Mock next/navigation
const mockPathname = vi.fn(() => "/")
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileTap, layoutId, transition, ...domProps } = props
      return <div data-layoutid={layoutId as string} {...domProps}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe("BottomNav", () => {
  it("renders exactly 5 tab items", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(5)
  })

  it("each tab has the correct label text", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Us")).toBeInTheDocument()
    expect(screen.getByText("Health")).toBeInTheDocument()
    expect(screen.getByText("Spirit")).toBeInTheDocument()
    expect(screen.getByText("Ops")).toBeInTheDocument()
  })

  it("each tab links to the correct route", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    const links = screen.getAllByRole("link")
    expect(links[0]).toHaveAttribute("href", "/")
    expect(links[1]).toHaveAttribute("href", "/us")
    expect(links[2]).toHaveAttribute("href", "/health")
    expect(links[3]).toHaveAttribute("href", "/spirit")
    expect(links[4]).toHaveAttribute("href", "/ops")
  })

  it("active tab has accent color styling when pathname is /", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    const homeLink = screen.getByText("Home").closest("a")
    expect(homeLink).toHaveAttribute("aria-current", "page")

    // Inactive tabs should not have aria-current
    const usLink = screen.getByText("Us").closest("a")
    expect(usLink).not.toHaveAttribute("aria-current")
  })

  it("active tab has accent color styling when pathname is /us", () => {
    mockPathname.mockReturnValue("/us")
    render(<BottomNav />)

    const usLink = screen.getByText("Us").closest("a")
    expect(usLink).toHaveAttribute("aria-current", "page")

    const homeLink = screen.getByText("Home").closest("a")
    expect(homeLink).not.toHaveAttribute("aria-current")
  })

  it("inactive tabs have secondary color styling", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    const usLabel = screen.getByText("Us")
    expect(usLabel.className).toContain("text-text-secondary")
  })

  it("active tab label has accent color styling", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    const homeLabel = screen.getByText("Home")
    expect(homeLabel.className).toContain("text-accent-primary")
  })

  it("all Lucide icons render as SVG elements", () => {
    mockPathname.mockReturnValue("/")
    const { container } = render(<BottomNav />)

    const svgs = container.querySelectorAll("svg")
    expect(svgs).toHaveLength(5)
  })

  it("renders without crashing when pathname is /", () => {
    mockPathname.mockReturnValue("/")
    expect(() => render(<BottomNav />)).not.toThrow()
  })

  it("renders without crashing when pathname is /us", () => {
    mockPathname.mockReturnValue("/us")
    expect(() => render(<BottomNav />)).not.toThrow()
  })

  it("shows indicator only on the active tab", () => {
    mockPathname.mockReturnValue("/health")
    const { container } = render(<BottomNav />)

    const indicators = container.querySelectorAll("[data-layoutid='bottomnav-indicator']")
    expect(indicators).toHaveLength(1)
  })

  it("no tab is highlighted on non-nav routes", () => {
    mockPathname.mockReturnValue("/settings")
    render(<BottomNav />)

    const links = screen.getAllByRole("link")
    links.forEach((link) => {
      expect(link).not.toHaveAttribute("aria-current")
    })
  })

  it("has proper navigation role and label", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    const nav = screen.getByRole("navigation")
    expect(nav).toHaveAttribute("aria-label", "Main navigation")
  })
})
