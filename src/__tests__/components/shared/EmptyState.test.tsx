import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { EmptyState } from "@/components/shared/EmptyState"

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
    <svg data-testid="mock-icon" width="48" height="48">
      <circle cx="24" cy="24" r="20" />
    </svg>
  )
}

describe("EmptyState", () => {
  it("renders icon element", () => {
    render(<EmptyState icon={<MockIcon />} title="No items" />)
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument()
  })

  it("renders title text", () => {
    render(<EmptyState icon={<MockIcon />} title="No notes yet" />)
    expect(screen.getByText("No notes yet")).toBeInTheDocument()
  })

  it("renders subtitle when provided", () => {
    render(
      <EmptyState
        icon={<MockIcon />}
        title="No notes yet"
        subtitle="Write your first love note"
      />
    )
    expect(screen.getByText("Write your first love note")).toBeInTheDocument()
  })

  it("does NOT render subtitle when omitted", () => {
    const { container } = render(
      <EmptyState icon={<MockIcon />} title="No notes yet" />
    )
    const paragraphs = container.querySelectorAll("p")
    expect(paragraphs).toHaveLength(0)
  })

  it("renders CTA button when actionLabel and onAction provided", () => {
    render(
      <EmptyState
        icon={<MockIcon />}
        title="No notes yet"
        actionLabel="Write a note"
        onAction={() => {}}
      />
    )
    expect(screen.getByText("Write a note")).toBeInTheDocument()
  })

  it("CTA links to actionHref when provided", () => {
    render(
      <EmptyState
        icon={<MockIcon />}
        title="No notes yet"
        actionLabel="Write a note"
        actionHref="/notes/new"
      />
    )
    const link = screen.getByText("Write a note").closest("a")
    expect(link).toHaveAttribute("href", "/notes/new")
  })

  it("CTA button fires onAction callback when clicked", () => {
    const handleAction = vi.fn()
    render(
      <EmptyState
        icon={<MockIcon />}
        title="No notes yet"
        actionLabel="Write a note"
        onAction={handleAction}
      />
    )
    fireEvent.click(screen.getByText("Write a note"))
    expect(handleAction).toHaveBeenCalledOnce()
  })

  it("does NOT render button when no actionLabel", () => {
    const { container } = render(
      <EmptyState icon={<MockIcon />} title="No notes yet" />
    )
    const buttons = container.querySelectorAll("button")
    const links = container.querySelectorAll("a")
    expect(buttons).toHaveLength(0)
    expect(links).toHaveLength(0)
  })

  it("accepts className prop", () => {
    const { container } = render(
      <EmptyState icon={<MockIcon />} title="No notes yet" className="mt-8" />
    )
    expect(container.firstChild).toHaveClass("mt-8")
  })
})
