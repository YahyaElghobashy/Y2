import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ── Mocks ──

let mockCycleReturn = {
  config: { id: "c1", owner_id: "u1", pill_start_date: "2026-02-01", days_on: 21, days_off: 7, pms_warning_days: 3, notes: null, created_at: "", updated_at: "" } as { id: string; owner_id: string; pill_start_date: string; days_on: number; days_off: number; pms_warning_days: number; notes: null; created_at: string; updated_at: string } | null,
  currentDay: 5,
  phase: "active" as "active" | "break" | null,
  daysUntilBreak: 16,
  daysUntilActive: null,
  isPMSWindow: false,
  isPeriodLikely: false,
  nextPeriodDate: null,
  cycleLogs: [],
  isLoading: false,
  error: null as string | null,
  updateConfig: vi.fn(),
  addLog: vi.fn(),
  refreshCycle: vi.fn(),
}

vi.mock("@/lib/hooks/use-cycle", () => ({
  useCycle: () => mockCycleReturn,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com" },
    profile: { id: "u1", display_name: "Yahya", email: "test@test.com", avatar_url: null, partner_id: "u2", role: "admin", created_at: "", updated_at: "" },
    partner: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>(
      ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown> & { children?: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => {
        void initial; void animate; void exit; void transition; void whileHover; void whileTap
        return <div ref={ref} {...props}>{children}</div>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import { HomeCycleWidget } from "@/components/home/HomeCycleWidget"

describe("HomeCycleWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCycleReturn = {
      ...mockCycleReturn,
      config: { id: "c1", owner_id: "u1", pill_start_date: "2026-02-01", days_on: 21, days_off: 7, pms_warning_days: 3, notes: null, created_at: "", updated_at: "" },
      currentDay: 5,
      phase: "active",
      isLoading: false,
    }
  })

  it("renders for Yahya when config exists", () => {
    render(<HomeCycleWidget />)
    expect(screen.getByTestId("home-cycle-widget")).toBeInTheDocument()
    expect(screen.getByText("Cycle Tracker")).toBeInTheDocument()
  })

  it("shows current day and phase", () => {
    render(<HomeCycleWidget />)
    expect(screen.getByText(/Day 5/)).toBeInTheDocument()
    expect(screen.getByText(/Active/)).toBeInTheDocument()
  })

  it("renders compact insight card", () => {
    render(<HomeCycleWidget />)
    expect(screen.getByTestId("cycle-insight-card")).toBeInTheDocument()
  })

  it("returns null when no config", () => {
    mockCycleReturn = { ...mockCycleReturn, config: null, phase: null }
    const { container } = render(<HomeCycleWidget />)
    expect(container.innerHTML).toBe("")
  })

  it("returns null when loading", () => {
    mockCycleReturn = { ...mockCycleReturn, isLoading: true }
    const { container } = render(<HomeCycleWidget />)
    expect(container.innerHTML).toBe("")
  })

  it("links to /me/body", () => {
    render(<HomeCycleWidget />)
    const link = screen.getByTestId("home-cycle-widget").closest("a")
    expect(link).toHaveAttribute("href", "/me/body")
  })
})
