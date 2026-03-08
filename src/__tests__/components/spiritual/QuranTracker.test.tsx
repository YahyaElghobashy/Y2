import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockLogPages = vi.fn()
const mockUseQuran: any = vi.fn(() => ({
  today: {
    id: "row-1",
    user_id: "user-1",
    date: "2026-03-04",
    pages_read: 3,
    daily_goal: 5,
    notes: null,
    created_at: "",
    updated_at: "",
  },
  logPages: mockLogPages,
  monthlyTotal: 42,
  dailyGoal: 5,
  setDailyGoal: vi.fn(),
  isLoading: false,
  error: null,
}))

vi.mock("@/lib/hooks/use-quran", () => ({
  useQuran: () => mockUseQuran(),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, initial, animate, transition, whileTap, ...rest }: { children?: React.ReactNode; initial?: unknown; animate?: unknown; transition?: unknown; whileTap?: unknown; [key: string]: unknown },
        ref: React.Ref<HTMLDivElement>
      ) => {
        void initial; void animate; void transition; void whileTap
        return <div ref={ref} {...rest}>{children}</div>
      }
    ),
    button: React.forwardRef(
      (
        { children, initial, animate, transition, whileTap, ...rest }: { children?: React.ReactNode; initial?: unknown; animate?: unknown; transition?: unknown; whileTap?: unknown; [key: string]: unknown },
        ref: React.Ref<HTMLButtonElement>
      ) => {
        void initial; void animate; void transition; void whileTap
        return <button ref={ref} {...rest}>{children}</button>
      }
    ),
  },
}))

import { QuranTracker } from "@/components/spiritual/QuranTracker"

describe("QuranTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuran.mockReturnValue({
      today: {
        id: "row-1",
        user_id: "user-1",
        date: "2026-03-04",
        pages_read: 3,
        daily_goal: 5,
        notes: null,
        created_at: "",
        updated_at: "",
      },
      logPages: mockLogPages,
      monthlyTotal: 42,
      dailyGoal: 5,
      setDailyGoal: vi.fn(),
      isLoading: false,
      error: null,
    })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders quran tracker container", () => {
      render(<QuranTracker />)
      expect(screen.getByTestId("quran-tracker")).toBeInTheDocument()
    })

    it("shows loading state", () => {
      mockUseQuran.mockReturnValue({
        today: null,
        logPages: vi.fn(),
        monthlyTotal: 0,
        dailyGoal: 2,
        setDailyGoal: vi.fn(),
        isLoading: true,
        error: null,
      })
      render(<QuranTracker />)
      expect(screen.getByTestId("quran-tracker-loading")).toBeInTheDocument()
    })

    it("shows pages read count", () => {
      render(<QuranTracker />)
      expect(screen.getByTestId("pages-read")).toHaveTextContent("3")
    })

    it("shows daily goal", () => {
      render(<QuranTracker />)
      expect(screen.getByText("3 / 5 pages")).toBeInTheDocument()
    })

    it("shows monthly total", () => {
      render(<QuranTracker />)
      expect(screen.getByTestId("monthly-total")).toHaveTextContent("42 Pages this month")
    })

    it("renders add page button", () => {
      render(<QuranTracker />)
      expect(screen.getByTestId("add-page-button")).toBeInTheDocument()
    })

    it("renders progress bar", () => {
      render(<QuranTracker />)
      expect(screen.getByTestId("progress-bar-track")).toBeInTheDocument()
      expect(screen.getByTestId("progress-bar-fill")).toBeInTheDocument()
    })

    it("shows heading text", () => {
      render(<QuranTracker />)
      expect(screen.getByText("Quran Journey")).toBeInTheDocument()
    })

    it("shows error state when error and no data", () => {
      mockUseQuran.mockReturnValue({
        today: null,
        logPages: vi.fn(),
        monthlyTotal: 0,
        dailyGoal: 2,
        setDailyGoal: vi.fn(),
        isLoading: false,
        error: "Failed to load",
      })
      render(<QuranTracker />)
      expect(screen.getByTestId("quran-tracker-error")).toBeInTheDocument()
      expect(screen.getByText("Could not load reading data")).toBeInTheDocument()
    })

    it("add button has correct aria-label", () => {
      render(<QuranTracker />)
      expect(screen.getByTestId("add-page-button")).toHaveAttribute("aria-label", "Add one page")
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("calls logPages(1) when + button clicked", async () => {
      const user = userEvent.setup()
      render(<QuranTracker />)

      await user.click(screen.getByTestId("add-page-button"))
      expect(mockLogPages).toHaveBeenCalledWith(1)
    })

    it("calls logPages multiple times on multiple clicks", async () => {
      const user = userEvent.setup()
      render(<QuranTracker />)

      await user.click(screen.getByTestId("add-page-button"))
      await user.click(screen.getByTestId("add-page-button"))
      expect(mockLogPages).toHaveBeenCalledTimes(2)
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("displays data from useQuran hook", () => {
      render(<QuranTracker />)
      expect(screen.getByTestId("pages-read")).toHaveTextContent("3")
      expect(screen.getByTestId("monthly-total")).toHaveTextContent("42 Pages this month")
    })

    it("applies custom className", () => {
      render(<QuranTracker className="test-class" />)
      expect(screen.getByTestId("quran-tracker").className).toContain("test-class")
    })

    it("handles zero pages gracefully", () => {
      mockUseQuran.mockReturnValue({
        today: {
          id: "row-1",
          user_id: "user-1",
          date: "2026-03-04",
          pages_read: 0,
          daily_goal: 5,
          notes: null,
          created_at: "",
          updated_at: "",
        },
        logPages: mockLogPages,
        monthlyTotal: 0,
        dailyGoal: 5,
        setDailyGoal: vi.fn(),
        isLoading: false,
        error: null,
      })
      render(<QuranTracker />)
      expect(screen.getByTestId("pages-read")).toHaveTextContent("0")
      expect(screen.getByTestId("monthly-total")).toHaveTextContent("0 Pages this month")
    })
  })
})
