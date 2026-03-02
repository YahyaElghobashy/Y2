import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { PageHeader } from "@/components/shared/PageHeader"

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { whileTap, transition, ...domProps } = props
      return <div {...domProps}>{children}</div>
    },
  },
}))

describe("PageHeader", () => {
  it("renders the title text correctly", () => {
    render(<PageHeader title="Us" />)
    expect(screen.getByText("Us")).toBeInTheDocument()
  })

  it("back button appears when backHref is provided", () => {
    render(<PageHeader title="Us" backHref="/" />)
    const backLink = screen.getByRole("link", { name: "Go back" })
    expect(backLink).toBeInTheDocument()
  })

  it("back button does NOT appear when backHref is omitted", () => {
    render(<PageHeader title="Us" />)
    const backLink = screen.queryByRole("link", { name: "Go back" })
    expect(backLink).not.toBeInTheDocument()
  })

  it("back button links to the correct href", () => {
    render(<PageHeader title="Settings" backHref="/us" />)
    const backLink = screen.getByRole("link", { name: "Go back" })
    expect(backLink).toHaveAttribute("href", "/us")
  })

  it("right action renders when provided", () => {
    render(
      <PageHeader
        title="Coupon"
        backHref="/us"
        rightAction={<button>Edit</button>}
      />
    )
    expect(screen.getByText("Edit")).toBeInTheDocument()
  })

  it("right action does NOT render when omitted", () => {
    render(<PageHeader title="Us" backHref="/" />)
    const buttons = screen.queryAllByRole("button")
    expect(buttons).toHaveLength(0)
  })

  it("title has the truncate CSS class", () => {
    render(<PageHeader title="Very Long Page Title That Should Truncate" />)
    const heading = screen.getByRole("heading")
    expect(heading.className).toContain("truncate")
  })

  it("accepts and applies className prop", () => {
    const { container } = render(
      <PageHeader title="Us" className="mt-4" />
    )
    const header = container.querySelector("header")
    expect(header?.className).toContain("mt-4")
  })
})
