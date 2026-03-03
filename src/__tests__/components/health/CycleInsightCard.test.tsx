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

import { CycleInsightCard } from "@/components/health/CycleInsightCard"

describe("CycleInsightCard", () => {
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
      phase: "active",
      isPMSWindow: false,
      isPeriodLikely: false,
      isLoading: false,
    }
  })

  it("shows Smooth Sailing for active phase", () => {
    render(<CycleInsightCard />)
    expect(screen.getByTestId("insight-title")).toHaveTextContent("Smooth Sailing")
  })

  it("shows Be Extra Gentle for PMS window", () => {
    mockCycleReturn = { ...mockCycleReturn, isPMSWindow: true }
    render(<CycleInsightCard />)
    expect(screen.getByTestId("insight-title")).toHaveTextContent("Be Extra Gentle")
  })

  it("shows Take Care of Her for break phase", () => {
    mockCycleReturn = {
      ...mockCycleReturn,
      phase: "break",
      isPeriodLikely: true,
    }
    render(<CycleInsightCard />)
    expect(screen.getByTestId("insight-title")).toHaveTextContent("Take Care of Her")
  })

  it("renders message text", () => {
    render(<CycleInsightCard />)
    expect(screen.getByTestId("insight-message")).toBeInTheDocument()
  })

  it("returns null when no config and not loading", () => {
    mockCycleReturn = { ...mockCycleReturn, config: null, phase: null }
    const { container } = render(<CycleInsightCard />)
    expect(container.firstChild).toBeNull()
  })

  it("returns null when loading", () => {
    mockCycleReturn = { ...mockCycleReturn, isLoading: true }
    const { container } = render(<CycleInsightCard />)
    expect(container.firstChild).toBeNull()
  })
})
