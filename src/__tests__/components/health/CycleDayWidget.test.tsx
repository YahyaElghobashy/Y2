import React from "react"
import { render, screen } from "@testing-library/react"
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

import { CycleDayWidget } from "@/components/health/CycleDayWidget"

describe("CycleDayWidget", () => {
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
      currentDay: 10,
      phase: "active",
      daysUntilBreak: 12,
      daysUntilActive: null,
      isPMSWindow: false,
      isLoading: false,
    }
  })

  it("renders current day and phase", () => {
    render(<CycleDayWidget />)
    expect(screen.getByTestId("cycle-day-number")).toHaveTextContent("Day 10")
    expect(screen.getByTestId("cycle-phase-label")).toHaveTextContent("Active")
  })

  it("renders progress dots", () => {
    render(<CycleDayWidget />)
    expect(screen.getByTestId("cycle-progress-dots")).toBeInTheDocument()
  })

  it("renders remaining days text", () => {
    render(<CycleDayWidget />)
    expect(screen.getByTestId("cycle-remaining")).toHaveTextContent("12 days until break")
  })

  it("shows PMS Window label when isPMSWindow is true", () => {
    mockCycleReturn = { ...mockCycleReturn, isPMSWindow: true, daysUntilBreak: 2 }
    render(<CycleDayWidget />)
    expect(screen.getByTestId("cycle-phase-label")).toHaveTextContent("PMS Window")
  })

  it("shows Break label when in break phase", () => {
    mockCycleReturn = {
      ...mockCycleReturn,
      phase: "break",
      daysUntilBreak: null,
      daysUntilActive: 5,
    }
    render(<CycleDayWidget />)
    expect(screen.getByTestId("cycle-phase-label")).toHaveTextContent("Break")
    expect(screen.getByTestId("cycle-remaining")).toHaveTextContent("5 days until active phase")
  })

  it("returns null when no config and not loading", () => {
    mockCycleReturn = { ...mockCycleReturn, config: null, currentDay: null, phase: null }
    const { container } = render(<CycleDayWidget />)
    expect(container.firstChild).toBeNull()
  })

  it("returns null when loading", () => {
    mockCycleReturn = { ...mockCycleReturn, isLoading: true }
    const { container } = render(<CycleDayWidget />)
    expect(container.firstChild).toBeNull()
  })
})
