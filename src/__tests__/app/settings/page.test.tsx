import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import SettingsPage from "@/app/settings/page"

// Mock next/link
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

describe("Settings Page", () => {
  it("renders with PageHeader showing 'Settings'", () => {
    render(<SettingsPage />)
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("profile card shows placeholder name 'Yahya'", () => {
    render(<SettingsPage />)
    expect(screen.getByText("Yahya")).toBeInTheDocument()
  })

  it("all section headers render", () => {
    render(<SettingsPage />)
    expect(screen.getByText("Account")).toBeInTheDocument()
    expect(screen.getByText("Appearance")).toBeInTheDocument()
    expect(screen.getByText("About")).toBeInTheDocument()
  })

  it("renders at least 5 settings rows", () => {
    render(<SettingsPage />)
    expect(screen.getByText("Profile")).toBeInTheDocument()
    expect(screen.getByText("Notifications")).toBeInTheDocument()
    expect(screen.getByText("Theme")).toBeInTheDocument()
    expect(screen.getByText("App Version")).toBeInTheDocument()
    expect(screen.getByText("Made with love")).toBeInTheDocument()
  })

  it("Log Out button is present with red text", () => {
    render(<SettingsPage />)
    const logoutButton = screen.getByText("Log Out")
    expect(logoutButton).toBeInTheDocument()
    expect(logoutButton).toHaveClass("text-red-500")
  })

  it("'Made with love' row shows 'for Yara'", () => {
    render(<SettingsPage />)
    expect(screen.getByText("for Yara")).toBeInTheDocument()
  })

  it("App version row shows '1.0.0'", () => {
    render(<SettingsPage />)
    expect(screen.getByText("1.0.0")).toBeInTheDocument()
  })
})
