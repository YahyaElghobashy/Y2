import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { BottomNav } from "@/components/shared/BottomNav"

// Mock next/navigation
const mockPathname = vi.fn(() => "/")
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}))

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...rest } = props
    return <img {...rest} />
  },
}))

// Mock framer-motion with Proxy to handle all motion elements
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        React.forwardRef(
          (
            {
              children,
              initial,
              animate,
              exit,
              transition,
              whileHover,
              whileTap,
              whileInView,
              variants,
              custom,
              layoutId,
              layout,
              onAnimationComplete,
              onAnimationStart,
              ...domProps
            }: Record<string, unknown> & { children?: React.ReactNode },
            ref: React.Ref<HTMLElement>
          ) =>
            React.createElement(
              tag,
              {
                ...domProps,
                ref,
                "data-layoutid": layoutId as string,
              },
              children
            )
        ),
    }
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe("BottomNav", () => {
  it("renders 4 side tab links plus center mascot button", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    // 4 side tab links (Home, Us, Me, More)
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(4)

    // Center mascot button
    const mascotBtn = screen.getByTestId("nav-mascot-btn")
    expect(mascotBtn).toBeInTheDocument()
  })

  it("each side tab has the correct label text", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Us")).toBeInTheDocument()
    expect(screen.getByText("Me")).toBeInTheDocument()
    expect(screen.getByText("More")).toBeInTheDocument()
  })

  it("each side tab links to the correct route", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    expect(screen.getByTestId("nav-tab-home")).toHaveAttribute("href", "/")
    expect(screen.getByTestId("nav-tab-us")).toHaveAttribute("href", "/us")
    expect(screen.getByTestId("nav-tab-me")).toHaveAttribute("href", "/me")
    expect(screen.getByTestId("nav-tab-more")).toHaveAttribute("href", "/more")
  })

  it("active tab has accent color styling when pathname is /", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    const homeLink = screen.getByText("Home").closest("a")
    expect(homeLink).toHaveAttribute("aria-current", "page")

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

  it("active tab for /me route", () => {
    mockPathname.mockReturnValue("/me")
    render(<BottomNav />)

    const link = screen.getByText("Me").closest("a")
    expect(link).toHaveAttribute("aria-current", "page")
  })

  it("active tab for /more route", () => {
    mockPathname.mockReturnValue("/more")
    render(<BottomNav />)

    const link = screen.getByText("More").closest("a")
    expect(link).toHaveAttribute("aria-current", "page")
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

  it("center mascot button renders mascot image", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    const img = screen.getByAltText("Hayah")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "/mascot.png")
  })

  it("mascot button has correct aria-label", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    const btn = screen.getByTestId("nav-mascot-btn")
    expect(btn).toHaveAttribute("aria-label", "Open quick menu")
    expect(btn).toHaveAttribute("aria-expanded", "false")
  })

  it("side tab icons render as SVG elements", () => {
    mockPathname.mockReturnValue("/")
    const { container } = render(<BottomNav />)

    // 4 side tabs have SVG icons (House, Heart, User, MoreHorizontal)
    const svgs = container.querySelectorAll("svg")
    expect(svgs).toHaveLength(4)
  })

  it("shows indicator only on the active tab", () => {
    mockPathname.mockReturnValue("/us")
    const { container } = render(<BottomNav />)

    const indicators = container.querySelectorAll(
      "[data-layoutid='bottomnav-indicator']"
    )
    expect(indicators).toHaveLength(1)
  })

  it("old routes (Health, Spirit, Ops) are NOT present", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    expect(screen.queryByText("Health")).not.toBeInTheDocument()
    expect(screen.queryByText("Spirit")).not.toBeInTheDocument()
    expect(screen.queryByText("Ops")).not.toBeInTheDocument()
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

  it("quick actions appear when mascot is clicked", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    const btn = screen.getByTestId("nav-mascot-btn")
    fireEvent.click(btn)

    // Quick action links should appear (2026, Snap, Our Table, Wheel)
    expect(screen.getByTestId("quick-action-2026")).toBeInTheDocument()
    expect(screen.getByTestId("quick-action-snap")).toBeInTheDocument()
    expect(screen.getByTestId("quick-action-our-table")).toBeInTheDocument()
    expect(screen.getByTestId("quick-action-wheel")).toBeInTheDocument()
  })

  it("returns null during onboarding", () => {
    mockPathname.mockReturnValue("/onboarding")
    const { container } = render(<BottomNav />)
    expect(container.innerHTML).toBe("")
  })
})
