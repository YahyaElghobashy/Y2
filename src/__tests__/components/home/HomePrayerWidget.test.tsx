import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockUsePrayer: any = vi.fn(() => ({
  today: {
    id: "row-1",
    user_id: "user-1",
    date: "2026-03-04",
    fajr: true,
    dhuhr: true,
    asr: false,
    maghrib: true,
    isha: false,
    created_at: "",
    updated_at: "",
  },
  togglePrayer: vi.fn(),
  completedCount: 3,
  isLoading: false,
  error: null,
}))

vi.mock("@/lib/hooks/use-prayer", () => ({
  usePrayer: () => mockUsePrayer(),
}))

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          whileTap,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          whileTap?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLDivElement>
      ) => {
        void initial
        void animate
        void transition
        void whileTap
        return (
          <div ref={ref} {...rest}>
            {children}
          </div>
        )
      }
    ),
  },
}))

import { HomePrayerWidget } from "@/components/home/HomePrayerWidget"

describe("HomePrayerWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePrayer.mockReturnValue({
      today: {
        id: "row-1",
        user_id: "user-1",
        date: "2026-03-04",
        fajr: true,
        dhuhr: true,
        asr: false,
        maghrib: true,
        isha: false,
        created_at: "",
        updated_at: "",
      },
      togglePrayer: vi.fn(),
      completedCount: 3,
      isLoading: false,
      error: null,
    })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders null when loading", () => {
      mockUsePrayer.mockReturnValue({
        today: null,
        togglePrayer: vi.fn(),
        completedCount: 0,
        isLoading: true,
        error: null,
      })
      const { container } = render(<HomePrayerWidget />)
      expect(container.firstChild).toBeNull()
    })

    it("renders null when no data", () => {
      mockUsePrayer.mockReturnValue({
        today: null,
        togglePrayer: vi.fn(),
        completedCount: 0,
        isLoading: false,
        error: null,
      })
      const { container } = render(<HomePrayerWidget />)
      expect(container.firstChild).toBeNull()
    })

    it("renders widget when data is available", () => {
      render(<HomePrayerWidget />)
      expect(screen.getByTestId("home-prayer-widget")).toBeInTheDocument()
    })

    it("renders 5 mini circles", () => {
      render(<HomePrayerWidget />)
      expect(screen.getByTestId("mini-circle-fajr")).toBeInTheDocument()
      expect(screen.getByTestId("mini-circle-dhuhr")).toBeInTheDocument()
      expect(screen.getByTestId("mini-circle-asr")).toBeInTheDocument()
      expect(screen.getByTestId("mini-circle-maghrib")).toBeInTheDocument()
      expect(screen.getByTestId("mini-circle-isha")).toBeInTheDocument()
    })

    it("marks completed circles with data-completed=true", () => {
      render(<HomePrayerWidget />)
      expect(screen.getByTestId("mini-circle-fajr")).toHaveAttribute(
        "data-completed",
        "true"
      )
      expect(screen.getByTestId("mini-circle-asr")).toHaveAttribute(
        "data-completed",
        "false"
      )
    })

    it("shows summary text with count", () => {
      render(<HomePrayerWidget />)
      expect(screen.getByTestId("prayer-summary")).toHaveTextContent(
        "3/5 prayers today"
      )
    })

    it("renders circles container", () => {
      render(<HomePrayerWidget />)
      expect(screen.getByTestId("prayer-circles")).toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("links to /me/soul", () => {
      render(<HomePrayerWidget />)
      const link = screen.getByTestId("home-prayer-widget").closest("a")
      expect(link).toHaveAttribute("href", "/me/soul")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("displays usePrayer hook data", () => {
      render(<HomePrayerWidget />)
      expect(screen.getByTestId("prayer-summary")).toHaveTextContent(
        "3/5 prayers today"
      )
    })

    it("applies custom className", () => {
      render(<HomePrayerWidget className="custom-widget" />)
      expect(
        screen.getByTestId("home-prayer-widget").className
      ).toContain("custom-widget")
    })

    it("shows all 5 completed when all prayers done", () => {
      mockUsePrayer.mockReturnValue({
        today: {
          id: "row-1",
          user_id: "user-1",
          date: "2026-03-04",
          fajr: true,
          dhuhr: true,
          asr: true,
          maghrib: true,
          isha: true,
          created_at: "",
          updated_at: "",
        },
        togglePrayer: vi.fn(),
        completedCount: 5,
        isLoading: false,
        error: null,
      })
      render(<HomePrayerWidget />)
      expect(screen.getByTestId("prayer-summary")).toHaveTextContent(
        "5/5 prayers today"
      )
    })
  })
})
