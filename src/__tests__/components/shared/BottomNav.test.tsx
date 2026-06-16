import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { BottomNav } from "@/components/shared/BottomNav"

// Mock next/navigation
const mockPathname = vi.fn(() => "/")
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
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
  beforeEach(() => {
    mockPathname.mockReturnValue("/")
  })

  // ── UNIT: derived rendered structure ──

  it("renders exactly 4 world tab links plus the center Create button", () => {
    render(<BottomNav />)

    // 4 world links: Home, Us, Treasury, Keepsake
    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(4)

    // Center terracotta Create button (not a link)
    const createBtn = screen.getByTestId("nav-create-btn")
    expect(createBtn).toBeInTheDocument()
    expect(createBtn.tagName).toBe("BUTTON")
  })

  it("each world tab renders its label from NAV_WORLDS", () => {
    render(<BottomNav />)

    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Us")).toBeInTheDocument()
    expect(screen.getByText("Treasury")).toBeInTheDocument()
    expect(screen.getByText("Keepsake")).toBeInTheDocument()
  })

  it("each world tab links to the correct href", () => {
    render(<BottomNav />)

    expect(screen.getByTestId("nav-home")).toHaveAttribute("href", "/")
    expect(screen.getByTestId("nav-us")).toHaveAttribute("href", "/us")
    expect(screen.getByTestId("nav-treasury")).toHaveAttribute(
      "href",
      "/treasury"
    )
    expect(screen.getByTestId("nav-keepsake")).toHaveAttribute(
      "href",
      "/keepsake"
    )
  })

  it("renders 4 world-tab icons as SVG elements (one per tab)", () => {
    const { container } = render(<BottomNav />)

    // House, Heart, Coins, BookHeart on the tabs + the Plus inside the
    // Create button = 5 SVGs total when the sheet is closed.
    const svgs = container.querySelectorAll("svg")
    expect(svgs.length).toBe(5)
  })

  it("Create button is collapsed by default (aria-expanded false, Create label)", () => {
    render(<BottomNav />)

    const btn = screen.getByTestId("nav-create-btn")
    expect(btn).toHaveAttribute("aria-expanded", "false")
    expect(btn).toHaveAttribute("aria-label", "Create")
    // Sheet actions are not in the DOM until opened
    expect(screen.queryByTestId("create-snap")).not.toBeInTheDocument()
  })

  it("exposes navigation role with accessible label", () => {
    render(<BottomNav />)

    const nav = screen.getByRole("navigation")
    expect(nav).toHaveAttribute("aria-label", "Main navigation")
  })

  // ── UNIT: active state per route ──

  it("marks Home active (aria-current) on the / route and leaves others inactive", () => {
    mockPathname.mockReturnValue("/")
    render(<BottomNav />)

    expect(screen.getByTestId("nav-home")).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByTestId("nav-us")).not.toHaveAttribute("aria-current")
    expect(screen.getByTestId("nav-treasury")).not.toHaveAttribute(
      "aria-current"
    )
    expect(screen.getByTestId("nav-keepsake")).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("marks Us active on /us and on nested Us-world routes (/game, /our-table, /wheel)", () => {
    for (const route of ["/us", "/us/list", "/game", "/our-table", "/wheel"]) {
      mockPathname.mockReturnValue(route)
      const { unmount } = render(<BottomNav />)
      expect(screen.getByTestId("nav-us")).toHaveAttribute(
        "aria-current",
        "page"
      )
      // Home must NOT be active on these (it only matches exact "/")
      expect(screen.getByTestId("nav-home")).not.toHaveAttribute(
        "aria-current"
      )
      unmount()
    }
  })

  it("marks Treasury active on /treasury and its sub-routes", () => {
    mockPathname.mockReturnValue("/treasury/coupons")
    render(<BottomNav />)

    expect(screen.getByTestId("nav-treasury")).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByTestId("nav-keepsake")).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("marks Keepsake active on /keepsake and nested Keepsake-world routes (/snap, /garden, /2026)", () => {
    for (const route of ["/keepsake", "/snap/capture", "/garden", "/2026"]) {
      mockPathname.mockReturnValue(route)
      const { unmount } = render(<BottomNav />)
      expect(screen.getByTestId("nav-keepsake")).toHaveAttribute(
        "aria-current",
        "page"
      )
      unmount()
    }
  })

  it("highlights no tab on routes outside any world (e.g. /settings)", () => {
    mockPathname.mockReturnValue("/settings")
    render(<BottomNav />)

    screen.getAllByRole("link").forEach((link) => {
      expect(link).not.toHaveAttribute("aria-current")
    })
  })

  // ── INTERACTION: Create button opens the 6-action sheet ──

  it("opens the Create sheet with all 6 actions when the Create button is clicked", () => {
    render(<BottomNav />)

    // Closed first
    expect(screen.queryByTestId("create-snap")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("nav-create-btn"))

    // 6 actions: Snap, Coupon, Letter, List, Mood, Ping
    expect(screen.getByTestId("create-snap")).toBeInTheDocument()
    expect(screen.getByTestId("create-coupon")).toBeInTheDocument()
    expect(screen.getByTestId("create-letter")).toBeInTheDocument()
    expect(screen.getByTestId("create-list")).toBeInTheDocument()
    expect(screen.getByTestId("create-mood")).toBeInTheDocument()
    expect(screen.getByTestId("create-ping")).toBeInTheDocument()

    // Labels visible
    expect(screen.getByText("Snap")).toBeInTheDocument()
    expect(screen.getByText("Coupon")).toBeInTheDocument()
    expect(screen.getByText("Letter")).toBeInTheDocument()
    expect(screen.getByText("List")).toBeInTheDocument()
    expect(screen.getByText("Mood")).toBeInTheDocument()
    expect(screen.getByText("Ping")).toBeInTheDocument()
  })

  it("each Create action links to its correct destination href", () => {
    render(<BottomNav />)
    fireEvent.click(screen.getByTestId("nav-create-btn"))

    expect(screen.getByTestId("create-snap")).toHaveAttribute(
      "href",
      "/snap/capture"
    )
    expect(screen.getByTestId("create-coupon")).toHaveAttribute(
      "href",
      "/create-coupon"
    )
    expect(screen.getByTestId("create-letter")).toHaveAttribute(
      "href",
      "/me/rituals"
    )
    expect(screen.getByTestId("create-list")).toHaveAttribute(
      "href",
      "/us/list"
    )
    expect(screen.getByTestId("create-mood")).toHaveAttribute("href", "/")
    expect(screen.getByTestId("create-ping")).toHaveAttribute(
      "href",
      "/us/ping"
    )
  })

  it("toggles aria-expanded and aria-label as the Create sheet opens and closes", () => {
    render(<BottomNav />)

    // Re-query after each toggle: the motion.button mock re-creates the node.
    expect(screen.getByTestId("nav-create-btn")).toHaveAttribute(
      "aria-expanded",
      "false"
    )
    expect(screen.getByTestId("nav-create-btn")).toHaveAttribute(
      "aria-label",
      "Create"
    )

    fireEvent.click(screen.getByTestId("nav-create-btn"))
    expect(screen.getByTestId("nav-create-btn")).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    expect(screen.getByTestId("nav-create-btn")).toHaveAttribute(
      "aria-label",
      "Close create menu"
    )
    expect(screen.getByTestId("create-snap")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("nav-create-btn"))
    expect(screen.getByTestId("nav-create-btn")).toHaveAttribute(
      "aria-expanded",
      "false"
    )
    expect(screen.getByTestId("nav-create-btn")).toHaveAttribute(
      "aria-label",
      "Create"
    )
    expect(screen.queryByTestId("create-snap")).not.toBeInTheDocument()
  })

  // ── INTERACTION: active indicator dot ──

  it("renders the active indicator dot only on the active tab", () => {
    mockPathname.mockReturnValue("/treasury")
    const { container } = render(<BottomNav />)

    const indicators = container.querySelectorAll(
      "[data-layoutid='nav-indicator']"
    )
    expect(indicators).toHaveLength(1)
  })

  // ── INTEGRATION / removed-feature guards ──

  it("hides the nav entirely during onboarding", () => {
    mockPathname.mockReturnValue("/onboarding")
    const { container } = render(<BottomNav />)
    expect(container.innerHTML).toBe("")
  })

  it("does not render the removed mascot / old 5-tab scheme", () => {
    render(<BottomNav />)

    // No mascot button or image (removed in redesign)
    expect(screen.queryByTestId("nav-mascot-btn")).not.toBeInTheDocument()
    expect(screen.queryByAltText("Hayah")).not.toBeInTheDocument()

    // Old tab labels are gone
    expect(screen.queryByText("Me")).not.toBeInTheDocument()
    expect(screen.queryByText("More")).not.toBeInTheDocument()
    expect(screen.queryByText("Health")).not.toBeInTheDocument()
    expect(screen.queryByText("Spirit")).not.toBeInTheDocument()
    expect(screen.queryByText("Ops")).not.toBeInTheDocument()

    // Old mascot-driven quick-action testids are gone
    expect(screen.queryByTestId("quick-action-2026")).not.toBeInTheDocument()
    expect(screen.queryByTestId("quick-action-snap")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("quick-action-our-table")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("quick-action-wheel")).not.toBeInTheDocument()
  })
})
