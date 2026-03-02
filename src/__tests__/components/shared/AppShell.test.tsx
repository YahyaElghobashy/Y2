import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { AppShell } from "@/components/shared/AppShell"

// Mock next/navigation (required by BottomNav)
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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

describe("AppShell", () => {
  it("renders children content", () => {
    render(
      <AppShell>
        <p>Test content</p>
      </AppShell>
    )
    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("BottomNav component is present in the rendered output", () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>
    )
    const nav = screen.getByRole("navigation", { name: "Main navigation" })
    expect(nav).toBeInTheDocument()
  })

  it("main content area has bottom padding class", () => {
    const { container } = render(
      <AppShell>
        <p>Content</p>
      </AppShell>
    )
    const main = container.querySelector("main")
    expect(main).toHaveClass("pb-24")
  })

  it("outer container has min-height set", () => {
    const { container } = render(
      <AppShell>
        <p>Content</p>
      </AppShell>
    )
    const outerDiv = container.firstElementChild
    expect(outerDiv).toHaveClass("min-h-[100dvh]")
  })

  it("background color class is applied", () => {
    const { container } = render(
      <AppShell>
        <p>Content</p>
      </AppShell>
    )
    const outerDiv = container.firstElementChild
    expect(outerDiv).toHaveClass("bg-bg-primary")
  })
})
