import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { AppShell } from "@/components/shared/AppShell"

// Mock next/navigation (required by BottomNav)
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...rest } = props
    return <img {...rest} />
  },
}))

// Mock SectionBackground
vi.mock("@/components/animations/SectionBackground", () => ({
  SectionBackground: () => <div data-testid="section-background" />,
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

  it("renders SectionBackground component", () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>
    )
    expect(screen.getByTestId("section-background")).toBeInTheDocument()
  })
})
