import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { BottomNavPreview } from "@/components/onboarding/BottomNavPreview"
import { NAV_WORLDS } from "@/components/shared/BottomNav"

// Mock framer-motion with Proxy to handle all motion elements.
// BottomNavPreview imports NAV_WORLDS from BottomNav, whose module pulls in
// framer-motion at load time, so the mock is required for the import chain.
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
              { ...domProps, ref, "data-layoutid": layoutId as string },
              children
            )
        ),
    }
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock next/navigation + next/link in case the import chain touches them.
vi.mock("next/navigation", () => ({
  usePathname: () => "/onboarding",
}))
vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}))

const INK_SOFT = "var(--color-ink-soft)"

describe("BottomNavPreview", () => {
  // --- Unit: renders the 4 worlds (Home / Us / Treasury / Keepsake) ---

  it("renders all 4 world tabs from NAV_WORLDS", () => {
    render(<BottomNavPreview />)
    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Us")).toBeInTheDocument()
    expect(screen.getByText("Treasury")).toBeInTheDocument()
    expect(screen.getByText("Keepsake")).toBeInTheDocument()
  })

  it("derives a tab from every NAV_WORLDS entry (no extras, no omissions)", () => {
    render(<BottomNavPreview />)
    const labels = NAV_WORLDS.map((w) => w.label)
    expect(labels).toEqual(["Home", "Us", "Treasury", "Keepsake"])
    labels.forEach((label) => {
      expect(
        screen.getByTestId(`nav-${label.toLowerCase()}`)
      ).toBeInTheDocument()
    })
    // Exactly 4 world tabs render (testids prefixed nav-, excluding the wrapper).
    const tabs = screen
      .getAllByTestId(/^nav-/)
      .filter((el) => el.getAttribute("data-testid") !== "bottom-nav-preview")
    expect(tabs).toHaveLength(4)
  })

  it("each tab has the correct lowercase data-testid", () => {
    render(<BottomNavPreview />)
    expect(screen.getByTestId("nav-home")).toBeInTheDocument()
    expect(screen.getByTestId("nav-us")).toBeInTheDocument()
    expect(screen.getByTestId("nav-treasury")).toBeInTheDocument()
    expect(screen.getByTestId("nav-keepsake")).toBeInTheDocument()
  })

  // --- Unit: center Create (Plus) button ---

  it("renders a center Create button with a Plus icon", () => {
    const { container } = render(<BottomNavPreview />)
    // The center create chip is a terracotta circle holding a lucide Plus svg.
    const createChip = container.querySelector(".rounded-full")
    expect(createChip).toBeInTheDocument()
    expect(createChip).toHaveStyle({ background: "var(--color-terracotta)" })
    // The Plus icon is the lucide-plus svg.
    expect(container.querySelector("svg.lucide-plus")).toBeInTheDocument()
  })

  it("renders exactly 5 icons: 4 world icons + 1 create Plus", () => {
    const { container } = render(<BottomNavPreview />)
    const svgs = container.querySelectorAll("svg")
    expect(svgs).toHaveLength(5)
  })

  // --- Unit: highlight logic (inline-style accent, NOT className) ---

  it("highlights the named world with its accent color and bold weight", () => {
    render(<BottomNavPreview highlightLabel="Us" />)
    const usLabel = screen.getByText("Us")
    const usWorld = NAV_WORLDS.find((w) => w.label === "Us")!
    expect(usLabel).toHaveStyle({ color: usWorld.accent })
    expect(usLabel.style.fontWeight).toBe("700")
  })

  it("uses the Home world accent (amber) when Home is highlighted", () => {
    render(<BottomNavPreview highlightLabel="Home" />)
    expect(screen.getByText("Home")).toHaveStyle({ color: "var(--color-amber)" })
  })

  it("uses the Keepsake world accent (teal) when Keepsake is highlighted", () => {
    render(<BottomNavPreview highlightLabel="Keepsake" />)
    expect(screen.getByText("Keepsake")).toHaveStyle({
      color: "var(--color-teal)",
    })
  })

  it("highlights the icon of the named world with the world accent color", () => {
    const { container } = render(<BottomNavPreview highlightLabel="Treasury" />)
    const treasuryWorld = NAV_WORLDS.find((w) => w.label === "Treasury")!
    const treasuryTab = screen.getByTestId("nav-treasury")
    const icon = treasuryTab.querySelector("svg")
    expect(icon).toBeInTheDocument()
    expect(icon!.style.color).toBe(treasuryWorld.accent)
    expect(container).toBeTruthy()
  })

  it("leaves non-highlighted tabs at the muted ink-soft color and normal weight", () => {
    render(<BottomNavPreview highlightLabel="Us" />)
    const homeLabel = screen.getByText("Home")
    expect(homeLabel).toHaveStyle({ color: INK_SOFT })
    expect(homeLabel.style.fontWeight).toBe("500")

    const treasuryLabel = screen.getByText("Treasury")
    expect(treasuryLabel).toHaveStyle({ color: INK_SOFT })
  })

  it("highlights exactly one tab when a highlightLabel is given", () => {
    render(<BottomNavPreview highlightLabel="Keepsake" />)
    const bold = ["Home", "Us", "Treasury", "Keepsake"].filter(
      (label) => screen.getByText(label).style.fontWeight === "700"
    )
    expect(bold).toEqual(["Keepsake"])
  })

  it("highlights nothing when highlightLabel is omitted", () => {
    render(<BottomNavPreview />)
    ;["Home", "Us", "Treasury", "Keepsake"].forEach((label) => {
      const span = screen.getByText(label)
      expect(span).toHaveStyle({ color: INK_SOFT })
      expect(span.style.fontWeight).toBe("500")
    })
  })

  it("highlights nothing when highlightLabel does not match any world", () => {
    render(<BottomNavPreview highlightLabel="Nonexistent" />)
    ;["Home", "Us", "Treasury", "Keepsake"].forEach((label) => {
      expect(screen.getByText(label).style.fontWeight).toBe("500")
    })
  })

  // --- Unit: non-interactive preview semantics ---

  it("is aria-hidden and non-interactive (pointer-events-none)", () => {
    render(<BottomNavPreview />)
    const nav = screen.getByTestId("bottom-nav-preview")
    expect(nav).toHaveAttribute("aria-hidden", "true")
    expect(nav.className).toContain("pointer-events-none")
  })

  it("renders no real links or buttons (static mirror, not real nav)", () => {
    const { container } = render(<BottomNavPreview />)
    expect(container.querySelectorAll("a")).toHaveLength(0)
    expect(container.querySelectorAll("button")).toHaveLength(0)
  })
})
