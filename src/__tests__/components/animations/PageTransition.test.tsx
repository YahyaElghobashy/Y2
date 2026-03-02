import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { PageTransition } from "@/components/animations/PageTransition"
import { FadeIn } from "@/components/animations/FadeIn"
import { StaggerList } from "@/components/animations/StaggerList"

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      const {
        initial,
        animate,
        transition,
        variants,
        whileInView,
        viewport,
        ...domProps
      } = props
      return <div {...domProps}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe("PageTransition", () => {
  it("renders children correctly", () => {
    render(
      <PageTransition>
        <p>Page content</p>
      </PageTransition>
    )
    expect(screen.getByText("Page content")).toBeInTheDocument()
  })

  it("accepts and applies className prop", () => {
    const { container } = render(
      <PageTransition className="custom-class">
        <p>Content</p>
      </PageTransition>
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  it("renders multiple children", () => {
    render(
      <PageTransition>
        <p>First</p>
        <p>Second</p>
      </PageTransition>
    )
    expect(screen.getByText("First")).toBeInTheDocument()
    expect(screen.getByText("Second")).toBeInTheDocument()
  })

  it("renders without crashing when no className is provided", () => {
    expect(() =>
      render(
        <PageTransition>
          <p>Content</p>
        </PageTransition>
      )
    ).not.toThrow()
  })
})

describe("FadeIn", () => {
  it("renders children correctly", () => {
    render(
      <FadeIn>
        <p>Faded content</p>
      </FadeIn>
    )
    expect(screen.getByText("Faded content")).toBeInTheDocument()
  })

  it("accepts and applies className prop", () => {
    const { container } = render(
      <FadeIn className="fade-class">
        <p>Content</p>
      </FadeIn>
    )
    expect(container.firstChild).toHaveClass("fade-class")
  })

  it("accepts custom delay and duration props", () => {
    expect(() =>
      render(
        <FadeIn delay={0.2} duration={0.5}>
          <p>Content</p>
        </FadeIn>
      )
    ).not.toThrow()
  })

  it("renders without crashing with default props", () => {
    expect(() =>
      render(
        <FadeIn>
          <p>Content</p>
        </FadeIn>
      )
    ).not.toThrow()
  })
})

describe("StaggerList", () => {
  it("renders children correctly", () => {
    render(
      <StaggerList>
        <p>Item 1</p>
        <p>Item 2</p>
        <p>Item 3</p>
      </StaggerList>
    )
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(screen.getByText("Item 2")).toBeInTheDocument()
    expect(screen.getByText("Item 3")).toBeInTheDocument()
  })

  it("renders nothing with 0 children", () => {
    const { container } = render(<StaggerList>{[]}</StaggerList>)
    expect(container.innerHTML).toBe("")
  })

  it("renders single child correctly", () => {
    render(
      <StaggerList>
        <p>Only item</p>
      </StaggerList>
    )
    expect(screen.getByText("Only item")).toBeInTheDocument()
  })

  it("accepts and applies className prop", () => {
    const { container } = render(
      <StaggerList className="stagger-class">
        <p>Item</p>
      </StaggerList>
    )
    expect(container.firstChild).toHaveClass("stagger-class")
  })

  it("accepts custom staggerDelay prop", () => {
    expect(() =>
      render(
        <StaggerList staggerDelay={0.1}>
          <p>Item 1</p>
          <p>Item 2</p>
        </StaggerList>
      )
    ).not.toThrow()
  })
})

describe("Barrel export", () => {
  it("exports all three components from index", async () => {
    const animations = await import("@/components/animations")
    expect(animations.PageTransition).toBeDefined()
    expect(animations.FadeIn).toBeDefined()
    expect(animations.StaggerList).toBeDefined()
  })
})
