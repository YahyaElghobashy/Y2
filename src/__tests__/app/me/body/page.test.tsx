import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Controlled hook mocks ───────────────────────────────────────
const mockUseAuth = vi.fn()
const mockUseCycle = vi.fn()
const mockUseFitness = vi.fn(() => ({ history: [], isLoading: false, logWeight: vi.fn(), deleteWeight: vi.fn() }))

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth: () => mockUseAuth() }))
vi.mock("@/lib/hooks/use-cycle", () => ({ useCycle: () => mockUseCycle() }))
vi.mock("@/lib/hooks/use-fitness", () => ({ useFitness: () => mockUseFitness() }))

// Stub presentational children to markers — we assert page-level wiring only.
vi.mock("@/components/health/BodyView", () => ({ BodyView: () => <div data-testid="body-view" /> }))
vi.mock("@/components/health/FitnessView", () => ({ FitnessView: () => <div data-testid="fitness-view" /> }))
vi.mock("@/components/health/CycleConfigForm", () => ({ CycleConfigForm: () => null }))
vi.mock("@/components/health/CycleCalendarView", () => ({ CycleCalendarView: () => <div data-testid="cycle-calendar" /> }))
vi.mock("@/components/animations", () => ({ PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</> }))

import BodyPage from "@/app/(main)/me/body/page"

const CONFIG = { owner_id: "u1", pill_start_date: "2026-06-01", active_days: 21, break_days: 7, pms_warning_days: 3, notes: null }

function cycle(over: Record<string, unknown> = {}) {
  return {
    config: CONFIG,
    currentDay: 5,
    phase: "active",
    daysUntilBreak: 16,
    daysUntilActive: null,
    isPMSWindow: false,
    isLoading: false,
    ...over,
  }
}

describe("BodyPage — interactive cycle calendar mount", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFitness.mockReturnValue({ history: [], isLoading: false, logWeight: vi.fn(), deleteWeight: vi.fn() })
  })

  it("mounts CycleCalendarView for an admin WITH a config", () => {
    mockUseAuth.mockReturnValue({ profile: { id: "u1", role: "admin" } })
    mockUseCycle.mockReturnValue(cycle())
    render(<BodyPage />)
    expect(screen.getByTestId("cycle-calendar")).toBeInTheDocument()
    expect(screen.getByTestId("body-view")).toBeInTheDocument()
  })

  it("does NOT mount the calendar for a non-admin (no cycle data exposed)", () => {
    mockUseAuth.mockReturnValue({ profile: { id: "u2", role: "user" } })
    mockUseCycle.mockReturnValue(cycle({ config: null }))
    render(<BodyPage />)
    expect(screen.queryByTestId("cycle-calendar")).not.toBeInTheDocument()
    // Fitness is still shown to everyone.
    expect(screen.getByTestId("fitness-view")).toBeInTheDocument()
  })
})
