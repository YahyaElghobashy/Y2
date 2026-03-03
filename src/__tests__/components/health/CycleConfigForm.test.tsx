import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockUpdateConfig = vi.fn()
const mockRefreshCycle = vi.fn()

vi.mock("@/lib/hooks/use-cycle", () => ({
  useCycle: () => ({
    config: null,
    currentDay: null,
    phase: null,
    daysUntilBreak: null,
    daysUntilActive: null,
    isPMSWindow: false,
    isPeriodLikely: false,
    nextPeriodDate: null,
    cycleLogs: [],
    isLoading: false,
    error: null,
    updateConfig: mockUpdateConfig,
    addLog: vi.fn(),
    refreshCycle: mockRefreshCycle,
  }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom")
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  }
})

import { CycleConfigForm } from "@/components/health/CycleConfigForm"

describe("CycleConfigForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateConfig.mockResolvedValue(undefined)
    mockRefreshCycle.mockResolvedValue(undefined)
  })

  it("renders nothing when closed", () => {
    const { container } = render(<CycleConfigForm open={false} onClose={vi.fn()} />)
    expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument()
  })

  it("renders dialog when open", () => {
    render(<CycleConfigForm open={true} onClose={vi.fn()} />)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Start Tracking" })).toBeInTheDocument()
  })

  it("shows Edit Cycle title when initialConfig is provided", () => {
    const config = {
      id: "c1",
      owner_id: "u1",
      pill_start_date: "2026-01-01",
      active_days: 21,
      break_days: 7,
      pms_warning_days: 3,
      notes: null,
      created_at: "",
      updated_at: "",
    }
    render(<CycleConfigForm open={true} onClose={vi.fn()} initialConfig={config} />)
    expect(screen.getByText("Edit Cycle")).toBeInTheDocument()
  })

  it("pre-fills values from initialConfig", () => {
    const config = {
      id: "c1",
      owner_id: "u1",
      pill_start_date: "2026-01-15",
      active_days: 18,
      break_days: 10,
      pms_warning_days: 5,
      notes: "Test note",
      created_at: "",
      updated_at: "",
    }
    render(<CycleConfigForm open={true} onClose={vi.fn()} initialConfig={config} />)

    expect(screen.getByTestId("cycle-start-date")).toHaveValue("2026-01-15")
    expect(screen.getByTestId("cycle-active-days")).toHaveValue(18)
    expect(screen.getByTestId("cycle-break-days")).toHaveValue(10)
    expect(screen.getByTestId("cycle-pms-days")).toHaveValue(5)
  })

  it("validates start date is required", async () => {
    render(<CycleConfigForm open={true} onClose={vi.fn()} />)

    fireEvent.click(screen.getByTestId("cycle-config-submit"))

    await waitFor(() => {
      expect(screen.getByText("Start date is required")).toBeInTheDocument()
    })
  })

  it("calls updateConfig on valid submit", async () => {
    const onClose = vi.fn()
    render(<CycleConfigForm open={true} onClose={onClose} />)

    fireEvent.change(screen.getByTestId("cycle-start-date"), { target: { value: "2026-03-01" } })
    fireEvent.change(screen.getByTestId("cycle-active-days"), { target: { value: "21" } })
    fireEvent.change(screen.getByTestId("cycle-break-days"), { target: { value: "7" } })
    fireEvent.change(screen.getByTestId("cycle-pms-days"), { target: { value: "3" } })

    fireEvent.click(screen.getByTestId("cycle-config-submit"))

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        pill_start_date: "2026-03-01",
        active_days: 21,
        break_days: 7,
        pms_warning_days: 3,
        notes: null,
      })
    })
  })

  it("close button calls onClose", () => {
    const onClose = vi.fn()
    render(<CycleConfigForm open={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("cycle-config-close"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("backdrop click calls onClose", () => {
    const onClose = vi.fn()
    render(<CycleConfigForm open={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("cycle-config-backdrop"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
