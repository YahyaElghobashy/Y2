import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import UsPage from "@/app/us/page"

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    className?: string
    [key: string]: unknown
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}))

describe("Us Page", () => {
  it("renders without crashing", () => {
    render(<UsPage />)
  })

  it("PageHeader shows 'Us'", () => {
    render(<UsPage />)
    expect(screen.getByText("Us")).toBeInTheDocument()
  })

  it("PageHeader back button links to '/'", () => {
    render(<UsPage />)
    const backLink = screen.getByLabelText("Go back")
    expect(backLink).toHaveAttribute("href", "/")
  })

  it("all 4 tabs are visible", () => {
    render(<UsPage />)
    expect(screen.getByText("Notes")).toBeInTheDocument()
    expect(screen.getByText("Coupons")).toBeInTheDocument()
    expect(screen.getByText("CoYYns")).toBeInTheDocument()
    expect(screen.getByText("Send")).toBeInTheDocument()
  })

  it("default active tab is Notes with correct empty state", () => {
    render(<UsPage />)
    expect(screen.getByText("No notes yet")).toBeInTheDocument()
    expect(screen.getByText("Write your first love note")).toBeInTheDocument()
  })

  it("clicking Coupons tab changes the content", () => {
    render(<UsPage />)
    fireEvent.click(screen.getByText("Coupons"))
    expect(screen.getByText("No coupons yet")).toBeInTheDocument()
    expect(screen.getByText("Create one for your partner")).toBeInTheDocument()
  })

  it("clicking CoYYns tab shows CoYYns empty state", () => {
    render(<UsPage />)
    fireEvent.click(screen.getByText("CoYYns"))
    expect(screen.getByText("CoYYns wallet empty")).toBeInTheDocument()
    expect(screen.getByText("Start earning together")).toBeInTheDocument()
  })

  it("clicking Send tab shows Send empty state", () => {
    render(<UsPage />)
    fireEvent.click(screen.getByText("Send"))
    expect(screen.getByText("Send a notification")).toBeInTheDocument()
    expect(
      screen.getByText("Surprise your partner with a message")
    ).toBeInTheDocument()
  })

  it("each tab has unique copy", () => {
    render(<UsPage />)
    const titles = ["No notes yet", "No coupons yet", "CoYYns wallet empty", "Send a notification"]
    // Default tab shows first title
    expect(screen.getByText(titles[0])).toBeInTheDocument()
    // Others should not be visible yet
    expect(screen.queryByText(titles[1])).not.toBeInTheDocument()
    expect(screen.queryByText(titles[2])).not.toBeInTheDocument()
    expect(screen.queryByText(titles[3])).not.toBeInTheDocument()
  })

  it("Notes and Coupons tabs have CTA buttons", () => {
    render(<UsPage />)
    // Notes tab (default)
    expect(screen.getByText("Write a note")).toBeInTheDocument()
    // Switch to Coupons
    fireEvent.click(screen.getByText("Coupons"))
    expect(screen.getByText("Create coupon")).toBeInTheDocument()
  })
})
