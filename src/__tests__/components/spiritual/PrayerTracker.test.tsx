import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── usePrayer mock ────────────────────────────────────────────

const mockTogglePrayer = vi.fn()
const mockUsePrayer = vi.fn(() => ({
  today: {
    id: "row-1",
    user_id: "user-1",
    date: "2026-03-04",
    fajr: true,
    dhuhr: false,
    asr: true,
    maghrib: false,
    isha: false,
    created_at: "",
    updated_at: "",
  },
  togglePrayer: mockTogglePrayer,
  completedCount: 2,
  isLoading: false,
  error: null,
}))

vi.mock("@/lib/hooks/use-prayer", () => ({
  usePrayer: () => mockUsePrayer(),
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

import { PrayerTracker } from "@/components/spiritual/PrayerTracker"

describe("PrayerTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePrayer.mockReturnValue({
      today: {
        id: "row-1",
        user_id: "user-1",
        date: "2026-03-04",
        fajr: true,
        dhuhr: false,
        asr: true,
        maghrib: false,
        isha: false,
        created_at: "",
        updated_at: "",
      },
      togglePrayer: mockTogglePrayer,
      completedCount: 2,
      isLoading: false,
      error: null,
    })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders prayer tracker container", () => {
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-tracker")).toBeInTheDocument()
    })

    it("shows loading state", () => {
      mockUsePrayer.mockReturnValue({
        today: null,
        togglePrayer: vi.fn(),
        completedCount: 0,
        isLoading: true,
        error: null,
      })
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-tracker-loading")).toBeInTheDocument()
      expect(screen.queryByTestId("prayer-tracker")).not.toBeInTheDocument()
    })

    it("renders all 5 prayer buttons", () => {
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-fajr")).toBeInTheDocument()
      expect(screen.getByTestId("prayer-dhuhr")).toBeInTheDocument()
      expect(screen.getByTestId("prayer-asr")).toBeInTheDocument()
      expect(screen.getByTestId("prayer-maghrib")).toBeInTheDocument()
      expect(screen.getByTestId("prayer-isha")).toBeInTheDocument()
    })

    it("shows completed count as X/5", () => {
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-count")).toHaveTextContent("2/5")
    })

    it("renders Arabic labels for each prayer", () => {
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-label-ar-fajr")).toHaveTextContent("فجر")
      expect(screen.getByTestId("prayer-label-ar-dhuhr")).toHaveTextContent("ظهر")
      expect(screen.getByTestId("prayer-label-ar-asr")).toHaveTextContent("عصر")
      expect(screen.getByTestId("prayer-label-ar-maghrib")).toHaveTextContent("مغرب")
      expect(screen.getByTestId("prayer-label-ar-isha")).toHaveTextContent("عشاء")
    })

    it("renders English labels for each prayer", () => {
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-label-en-fajr")).toHaveTextContent("Fajr")
      expect(screen.getByTestId("prayer-label-en-dhuhr")).toHaveTextContent("Dhuhr")
      expect(screen.getByTestId("prayer-label-en-asr")).toHaveTextContent("Asr")
      expect(screen.getByTestId("prayer-label-en-maghrib")).toHaveTextContent("Maghrib")
      expect(screen.getByTestId("prayer-label-en-isha")).toHaveTextContent("Isha")
    })

    it("marks completed prayers with data-completed=true", () => {
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-fajr")).toHaveAttribute("data-completed", "true")
      expect(screen.getByTestId("prayer-dhuhr")).toHaveAttribute("data-completed", "false")
      expect(screen.getByTestId("prayer-asr")).toHaveAttribute("data-completed", "true")
    })

    it("shows error message when error exists", () => {
      mockUsePrayer.mockReturnValue({
        today: null,
        togglePrayer: vi.fn(),
        completedCount: 0,
        isLoading: false,
        error: "Something went wrong",
      })
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-error")).toHaveTextContent("Something went wrong")
    })

    it("has aria-pressed on prayer buttons", () => {
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-fajr")).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByTestId("prayer-dhuhr")).toHaveAttribute("aria-pressed", "false")
    })

    it("has descriptive aria-label on buttons", () => {
      render(<PrayerTracker />)
      expect(screen.getByTestId("prayer-fajr")).toHaveAttribute(
        "aria-label",
        "Fajr completed"
      )
      expect(screen.getByTestId("prayer-dhuhr")).toHaveAttribute(
        "aria-label",
        "Dhuhr not completed"
      )
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("calls togglePrayer with correct name on click", async () => {
      const user = userEvent.setup()
      render(<PrayerTracker />)

      await user.click(screen.getByTestId("prayer-dhuhr"))
      expect(mockTogglePrayer).toHaveBeenCalledWith("dhuhr")
    })

    it("calls togglePrayer for each prayer individually", async () => {
      const user = userEvent.setup()
      render(<PrayerTracker />)

      await user.click(screen.getByTestId("prayer-fajr"))
      expect(mockTogglePrayer).toHaveBeenCalledWith("fajr")

      await user.click(screen.getByTestId("prayer-isha"))
      expect(mockTogglePrayer).toHaveBeenCalledWith("isha")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("renders with usePrayer hook data", () => {
      render(<PrayerTracker />)
      // Component should display data from hook
      expect(screen.getByTestId("prayer-count")).toHaveTextContent("2/5")
      expect(screen.getByTestId("prayer-fajr")).toHaveAttribute("data-completed", "true")
    })

    it("applies custom className", () => {
      render(<PrayerTracker className="my-custom" />)
      const tracker = screen.getByTestId("prayer-tracker")
      expect(tracker.className).toContain("my-custom")
    })

    it("renders heading text", () => {
      render(<PrayerTracker />)
      expect(screen.getByText("Daily Prayers")).toBeInTheDocument()
    })
  })
})
