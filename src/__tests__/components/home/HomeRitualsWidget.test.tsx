import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock useRituals ──────────────────────────────────────────
const mockIsLoggedThisPeriod = vi.fn(() => false)
const mockUseRituals: ReturnType<typeof vi.fn> = vi.fn(() => ({
  todayRituals: [
    { id: "r1", title: "Walk", icon: "🚶", cadence: "daily", is_shared: false, coyyns_reward: 0 },
    { id: "r2", title: "Read", icon: "📖", cadence: "daily", is_shared: true, coyyns_reward: 3 },
  ],
  isLoading: false,
  isLoggedThisPeriod: mockIsLoggedThisPeriod,
}))

vi.mock("@/lib/hooks/use-rituals", () => ({
  useRituals: () => mockUseRituals(),
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import { HomeRitualsWidget } from "@/components/home/HomeRitualsWidget"

describe("HomeRitualsWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoggedThisPeriod.mockReturnValue(false)
    mockUseRituals.mockReturnValue({
      todayRituals: [
        { id: "r1", title: "Walk", icon: "🚶", cadence: "daily", is_shared: false, coyyns_reward: 0 },
        { id: "r2", title: "Read", icon: "📖", cadence: "daily", is_shared: true, coyyns_reward: 3 },
      ],
      isLoading: false,
      isLoggedThisPeriod: mockIsLoggedThisPeriod,
    })
  })

  describe("unit", () => {
    it("renders widget", () => {
      render(<HomeRitualsWidget />)
      expect(screen.getByTestId("home-rituals-widget")).toBeInTheDocument()
    })

    it("returns null when loading", () => {
      mockUseRituals.mockReturnValue({
        todayRituals: [],
        isLoading: true,
        isLoggedThisPeriod: vi.fn(),
      })
      const { container } = render(<HomeRitualsWidget />)
      expect(container.innerHTML).toBe("")
    })

    it("returns null when no rituals", () => {
      mockUseRituals.mockReturnValue({
        todayRituals: [],
        isLoading: false,
        isLoggedThisPeriod: vi.fn(),
      })
      const { container } = render(<HomeRitualsWidget />)
      expect(container.innerHTML).toBe("")
    })

    it("shows ritual circles", () => {
      render(<HomeRitualsWidget />)
      expect(screen.getByTestId("ritual-circle-r1")).toBeInTheDocument()
      expect(screen.getByTestId("ritual-circle-r2")).toBeInTheDocument()
    })

    it("shows summary count", () => {
      render(<HomeRitualsWidget />)
      expect(screen.getByTestId("rituals-summary")).toHaveTextContent("0/2 completed")
    })

    it("shows correct count when some logged", () => {
      mockIsLoggedThisPeriod.mockImplementation((id: string) => id === "r1")
      render(<HomeRitualsWidget />)
      expect(screen.getByTestId("rituals-summary")).toHaveTextContent("1/2 completed")
    })
  })

  describe("interaction", () => {
    it("links to /me/rituals", () => {
      render(<HomeRitualsWidget />)
      const link = screen.getByText("See All")
      expect(link).toHaveAttribute("href", "/me/rituals")
    })
  })

  describe("integration", () => {
    it("uses useRituals hook", () => {
      render(<HomeRitualsWidget />)
      expect(mockUseRituals).toHaveBeenCalled()
    })

    it("applies custom className", () => {
      render(<HomeRitualsWidget className="my-custom" />)
      expect(screen.getByTestId("home-rituals-widget").className).toContain("my-custom")
    })

    it("renders header text", () => {
      render(<HomeRitualsWidget />)
      expect(screen.getByText("Rituals")).toBeInTheDocument()
    })
  })
})
