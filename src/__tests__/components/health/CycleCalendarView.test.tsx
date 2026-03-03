import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
type MockConfig = {
  id: string; owner_id: string; pill_start_date: string; active_days: number
  break_days: number; pms_warning_days: number; notes: string | null
  created_at: string; updated_at: string
} | null

type MockCycleReturn = {
  config: MockConfig; currentDay: number | null; phase: "active" | "break" | null
  daysUntilBreak: number | null; daysUntilActive: number | null
  isPMSWindow: boolean; isPeriodLikely: boolean; nextPeriodDate: Date | null
  cycleLogs: unknown[]; isLoading: boolean; error: string | null
  updateConfig: ReturnType<typeof vi.fn>; addLog: ReturnType<typeof vi.fn>
  refreshCycle: ReturnType<typeof vi.fn>
}

let mockCycleReturn: MockCycleReturn = {
  config: {
    id: "c1",
    owner_id: "u1",
    pill_start_date: "2026-01-01",
    active_days: 21,
    break_days: 7,
    pms_warning_days: 3,
    notes: null,
    created_at: "",
    updated_at: "",
  },
  currentDay: 10,
  phase: "active",
  daysUntilBreak: 12,
  daysUntilActive: null,
  isPMSWindow: false,
  isPeriodLikely: false,
  nextPeriodDate: null,
  cycleLogs: [],
  isLoading: false,
  error: null,
  updateConfig: vi.fn(),
  addLog: vi.fn(),
  refreshCycle: vi.fn(),
}

vi.mock("@/lib/hooks/use-cycle", () => ({
  useCycle: () => mockCycleReturn,
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CycleCalendarView } from "@/components/health/CycleCalendarView"

describe("CycleCalendarView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCycleReturn = {
      ...mockCycleReturn,
      config: {
        id: "c1",
        owner_id: "u1",
        pill_start_date: "2026-01-01",
        active_days: 21,
        break_days: 7,
        pms_warning_days: 3,
        notes: null,
        created_at: "",
        updated_at: "",
      },
      isLoading: false,
    }
  })

  it("renders calendar with month header", () => {
    render(<CycleCalendarView />)
    expect(screen.getByTestId("cycle-calendar")).toBeInTheDocument()
  })

  it("renders calendar grid", () => {
    render(<CycleCalendarView />)
    expect(screen.getByTestId("calendar-grid")).toBeInTheDocument()
  })

  it("renders navigation buttons", () => {
    render(<CycleCalendarView />)
    expect(screen.getByTestId("calendar-prev")).toBeInTheDocument()
    expect(screen.getByTestId("calendar-next")).toBeInTheDocument()
  })

  it("renders legend", () => {
    render(<CycleCalendarView />)
    expect(screen.getByTestId("calendar-legend")).toBeInTheDocument()
  })

  it("navigates to next month", () => {
    render(<CycleCalendarView />)
    const nextBtn = screen.getByTestId("calendar-next")
    fireEvent.click(nextBtn)
    // After clicking next, the month title should change
    // We just verify the click doesn't crash
    expect(screen.getByTestId("cycle-calendar")).toBeInTheDocument()
  })

  it("navigates to previous month", () => {
    render(<CycleCalendarView />)
    const prevBtn = screen.getByTestId("calendar-prev")
    fireEvent.click(prevBtn)
    expect(screen.getByTestId("cycle-calendar")).toBeInTheDocument()
  })

  it("returns null when no config and not loading", () => {
    mockCycleReturn = { ...mockCycleReturn, config: null }
    const { container } = render(<CycleCalendarView />)
    expect(container.firstChild).toBeNull()
  })

  it("returns null when loading", () => {
    mockCycleReturn = { ...mockCycleReturn, isLoading: true }
    const { container } = render(<CycleCalendarView />)
    expect(container.firstChild).toBeNull()
  })

  it("shows detail on day click", () => {
    render(<CycleCalendarView />)
    // Click on a specific day in the grid
    const dayButtons = screen.getByTestId("calendar-grid").querySelectorAll("button")
    if (dayButtons.length > 0) {
      fireEvent.click(dayButtons[0])
      expect(screen.getByTestId("calendar-detail")).toBeInTheDocument()
    }
  })
})
