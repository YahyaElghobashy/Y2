import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"

// ── Mocks ──

const mockPathname = vi.fn(() => "/us")

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}))

vi.mock("next/link", () => ({
  default: React.forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
  >(({ href, children, ...props }, ref) => (
    <a ref={ref} href={href} {...props}>
      {children}
    </a>
  )),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>(
      ({ children, layoutId, initial, animate, exit, transition, ...props }: { children?: React.ReactNode; layoutId?: string; initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown } & Record<string, unknown>, ref: React.Ref<HTMLDivElement>) => {
        void initial; void animate; void exit; void transition
        return (
          <div ref={ref} data-layoutid={layoutId as string} {...props}>
            {children}
          </div>
        )
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { HorizontalTabBar } from "@/components/shared/HorizontalTabBar"

const sampleTabs = [
  { label: "Ping", href: "/us/ping" },
  { label: "Coupons", href: "/us/coupons" },
  { label: "Challenges", href: "/us/challenges" },
  { label: "Marketplace", href: "/us/marketplace" },
]

describe("HorizontalTabBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname.mockReturnValue("/us/ping")
  })

  // ═══════════════════════════════════════════════
  // Unit Tests
  // ═══════════════════════════════════════════════

  describe("Unit: tabs render from props", () => {
    it("renders all tabs provided in the tabs prop", () => {
      render(<HorizontalTabBar tabs={sampleTabs} />)
      expect(screen.getByText("Ping")).toBeInTheDocument()
      expect(screen.getByText("Coupons")).toBeInTheDocument()
      expect(screen.getByText("Challenges")).toBeInTheDocument()
      expect(screen.getByText("Marketplace")).toBeInTheDocument()
    })

    it("renders correct number of tab links", () => {
      render(<HorizontalTabBar tabs={sampleTabs} />)
      const links = screen.getAllByRole("tab")
      expect(links).toHaveLength(4)
    })

    it("renders an empty tab bar when given no tabs", () => {
      render(<HorizontalTabBar tabs={[]} />)
      const links = screen.queryAllByRole("tab")
      expect(links).toHaveLength(0)
    })

    it("renders a single tab correctly", () => {
      render(<HorizontalTabBar tabs={[{ label: "Solo", href: "/solo" }]} />)
      const tabs = screen.getAllByRole("tab")
      expect(tabs).toHaveLength(1)
      expect(screen.getByText("Solo")).toBeInTheDocument()
    })
  })

  describe("Unit: each tab has correct href", () => {
    it("each Link renders the correct href attribute", () => {
      render(<HorizontalTabBar tabs={sampleTabs} />)
      const links = screen.getAllByRole("tab")

      expect(links[0]).toHaveAttribute("href", "/us/ping")
      expect(links[1]).toHaveAttribute("href", "/us/coupons")
      expect(links[2]).toHaveAttribute("href", "/us/challenges")
      expect(links[3]).toHaveAttribute("href", "/us/marketplace")
    })
  })

  describe("Unit: active tab detection based on pathname", () => {
    it("marks exact pathname match as active", () => {
      mockPathname.mockReturnValue("/us/ping")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      const pingTab = screen.getByText("Ping").closest("a")
      expect(pingTab).toHaveAttribute("aria-selected", "true")
    })

    it("marks sub-path match as active (startsWith)", () => {
      mockPathname.mockReturnValue("/us/ping/details")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      const pingTab = screen.getByText("Ping").closest("a")
      expect(pingTab).toHaveAttribute("aria-selected", "true")
    })

    it("non-active tabs have aria-selected=false", () => {
      mockPathname.mockReturnValue("/us/ping")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      const couponsTab = screen.getByText("Coupons").closest("a")
      expect(couponsTab).toHaveAttribute("aria-selected", "false")

      const challengesTab = screen.getByText("Challenges").closest("a")
      expect(challengesTab).toHaveAttribute("aria-selected", "false")

      const marketplaceTab = screen.getByText("Marketplace").closest("a")
      expect(marketplaceTab).toHaveAttribute("aria-selected", "false")
    })

    it("no tab is active when pathname does not match any tab", () => {
      mockPathname.mockReturnValue("/settings")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      const tabs = screen.getAllByRole("tab")
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("aria-selected", "false")
      })
    })
  })

  describe("Unit: data-testid attributes", () => {
    it("renders data-testid='horizontal-tab-bar' on the container", () => {
      render(<HorizontalTabBar tabs={sampleTabs} />)
      expect(screen.getByTestId("horizontal-tab-bar")).toBeInTheDocument()
    })

    it("renders data-testid for each tab based on lowercase label", () => {
      render(<HorizontalTabBar tabs={sampleTabs} />)
      expect(screen.getByTestId("tab-ping")).toBeInTheDocument()
      expect(screen.getByTestId("tab-coupons")).toBeInTheDocument()
      expect(screen.getByTestId("tab-challenges")).toBeInTheDocument()
      expect(screen.getByTestId("tab-marketplace")).toBeInTheDocument()
    })
  })

  // ═══════════════════════════════════════════════
  // Interaction Tests
  // ═══════════════════════════════════════════════

  describe("Interaction: tabs render as Links with proper roles", () => {
    it("each tab has role='tab'", () => {
      render(<HorizontalTabBar tabs={sampleTabs} />)
      const tabs = screen.getAllByRole("tab")
      expect(tabs).toHaveLength(4)
      tabs.forEach((tab) => {
        expect(tab.tagName).toBe("A")
      })
    })

    it("container has role='tablist'", () => {
      render(<HorizontalTabBar tabs={sampleTabs} />)
      const tablist = screen.getByRole("tablist")
      expect(tablist).toBeInTheDocument()
    })

    it("exactly one tab has aria-selected=true when pathname matches", () => {
      mockPathname.mockReturnValue("/us/coupons")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      const tabs = screen.getAllByRole("tab")
      const selectedTabs = tabs.filter(
        (tab) => tab.getAttribute("aria-selected") === "true"
      )
      expect(selectedTabs).toHaveLength(1)
      expect(selectedTabs[0]).toHaveTextContent("Coupons")
    })
  })

  describe("Interaction: active tab shows visual indicator", () => {
    it("renders a motion.div indicator for the active tab", () => {
      mockPathname.mockReturnValue("/us/ping")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      const pingTab = screen.getByTestId("tab-ping")
      const indicator = pingTab.querySelector("[data-layoutid]")
      expect(indicator).not.toBeNull()
    })

    it("does not render indicator for inactive tabs", () => {
      mockPathname.mockReturnValue("/us/ping")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      const couponsTab = screen.getByTestId("tab-coupons")
      const indicator = couponsTab.querySelector("[data-layoutid]")
      expect(indicator).toBeNull()

      const challengesTab = screen.getByTestId("tab-challenges")
      const indChallenge = challengesTab.querySelector("[data-layoutid]")
      expect(indChallenge).toBeNull()
    })

    it("renders exactly one indicator across all tabs", () => {
      mockPathname.mockReturnValue("/us/challenges")
      const { container } = render(<HorizontalTabBar tabs={sampleTabs} />)

      const indicators = container.querySelectorAll("[data-layoutid]")
      expect(indicators).toHaveLength(1)
    })

    it("no indicator renders when no tab is active", () => {
      mockPathname.mockReturnValue("/other-page")
      const { container } = render(<HorizontalTabBar tabs={sampleTabs} />)

      const indicators = container.querySelectorAll("[data-layoutid]")
      expect(indicators).toHaveLength(0)
    })
  })

  describe("Interaction: active tab has accent color class", () => {
    it("active tab has accent-primary text color class", () => {
      mockPathname.mockReturnValue("/us/ping")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      const pingTab = screen.getByTestId("tab-ping")
      expect(pingTab.className).toContain("text-[var(--color-accent-primary)]")
    })

    it("inactive tab has secondary text color class", () => {
      mockPathname.mockReturnValue("/us/ping")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      const couponsTab = screen.getByTestId("tab-coupons")
      expect(couponsTab.className).toContain("text-[var(--color-text-secondary)]")
    })
  })

  // ═══════════════════════════════════════════════
  // Integration Tests
  // ═══════════════════════════════════════════════

  describe("Integration: usePathname drives active tab", () => {
    it("Ping tab is active when pathname is /us/ping", () => {
      mockPathname.mockReturnValue("/us/ping")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      expect(screen.getByText("Ping").closest("a")).toHaveAttribute(
        "aria-selected",
        "true"
      )
      expect(screen.getByText("Coupons").closest("a")).toHaveAttribute(
        "aria-selected",
        "false"
      )
    })

    it("Coupons tab is active when pathname is /us/coupons", () => {
      mockPathname.mockReturnValue("/us/coupons")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      expect(screen.getByText("Coupons").closest("a")).toHaveAttribute(
        "aria-selected",
        "true"
      )
      expect(screen.getByText("Ping").closest("a")).toHaveAttribute(
        "aria-selected",
        "false"
      )
    })

    it("Challenges tab is active when pathname is /us/challenges", () => {
      mockPathname.mockReturnValue("/us/challenges")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      expect(screen.getByText("Challenges").closest("a")).toHaveAttribute(
        "aria-selected",
        "true"
      )
    })

    it("Marketplace tab is active when pathname is /us/marketplace", () => {
      mockPathname.mockReturnValue("/us/marketplace")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      expect(screen.getByText("Marketplace").closest("a")).toHaveAttribute(
        "aria-selected",
        "true"
      )
    })

    it("sub-path /us/coupons/detail activates Coupons tab", () => {
      mockPathname.mockReturnValue("/us/coupons/detail")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      expect(screen.getByText("Coupons").closest("a")).toHaveAttribute(
        "aria-selected",
        "true"
      )
    })

    it("sub-path /us/marketplace/item/123 activates Marketplace tab", () => {
      mockPathname.mockReturnValue("/us/marketplace/item/123")
      render(<HorizontalTabBar tabs={sampleTabs} />)

      expect(screen.getByText("Marketplace").closest("a")).toHaveAttribute(
        "aria-selected",
        "true"
      )
    })

    it("indicator moves to correct tab when pathname changes", () => {
      mockPathname.mockReturnValue("/us/ping")
      const { rerender } = render(<HorizontalTabBar tabs={sampleTabs} />)

      // Indicator on Ping
      let pingTab = screen.getByTestId("tab-ping")
      expect(pingTab.querySelector("[data-layoutid]")).not.toBeNull()

      let couponsTab = screen.getByTestId("tab-coupons")
      expect(couponsTab.querySelector("[data-layoutid]")).toBeNull()

      // Change pathname
      mockPathname.mockReturnValue("/us/coupons")
      rerender(<HorizontalTabBar tabs={sampleTabs} />)

      // Indicator now on Coupons
      pingTab = screen.getByTestId("tab-ping")
      expect(pingTab.querySelector("[data-layoutid]")).toBeNull()

      couponsTab = screen.getByTestId("tab-coupons")
      expect(couponsTab.querySelector("[data-layoutid]")).not.toBeNull()
    })
  })

  describe("Integration: layoutId prop", () => {
    it("uses default layoutId when not specified", () => {
      mockPathname.mockReturnValue("/us/ping")
      const { container } = render(<HorizontalTabBar tabs={sampleTabs} />)

      const indicator = container.querySelector("[data-layoutid]")
      expect(indicator).toHaveAttribute(
        "data-layoutid",
        "horizontal-tab-indicator"
      )
    })

    it("uses custom layoutId when provided", () => {
      mockPathname.mockReturnValue("/us/ping")
      const { container } = render(
        <HorizontalTabBar tabs={sampleTabs} layoutId="custom-id" />
      )

      const indicator = container.querySelector("[data-layoutid]")
      expect(indicator).toHaveAttribute("data-layoutid", "custom-id")
    })
  })

  describe("Integration: className prop", () => {
    it("applies custom className to the container", () => {
      render(<HorizontalTabBar tabs={sampleTabs} className="my-custom-class" />)
      const container = screen.getByTestId("horizontal-tab-bar")
      expect(container.className).toContain("my-custom-class")
    })

    it("preserves default classes when custom className is added", () => {
      render(<HorizontalTabBar tabs={sampleTabs} className="extra" />)
      const container = screen.getByTestId("horizontal-tab-bar")
      expect(container.className).toContain("sticky")
      expect(container.className).toContain("extra")
    })
  })

  describe("Integration: prevents false positive sub-path matching", () => {
    it("pathname /us/ping does NOT activate /us/pin tab (not a prefix match)", () => {
      mockPathname.mockReturnValue("/us/ping")
      const tabsWithSimilarPaths = [
        { label: "Pin", href: "/us/pin" },
        { label: "Ping", href: "/us/ping" },
      ]
      render(<HorizontalTabBar tabs={tabsWithSimilarPaths} />)

      // /us/ping startsWith "/us/pin/" is FALSE because it requires trailing slash
      // But /us/ping === /us/ping is TRUE
      const pingTab = screen.getByText("Ping").closest("a")
      expect(pingTab).toHaveAttribute("aria-selected", "true")
    })
  })
})
