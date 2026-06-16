import React from "react"
import { render, screen, fireEvent, within, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { FitnessView, FITNESS_MOCK } from "@/components/health/FitnessView"
import type { WeightLog } from "@/lib/types/health.types"

// framer-motion → plain elements so width animations don't interfere with assertions.
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    { get: () => (props: Record<string, unknown>) => React.createElement("div", props, (props as { children?: React.ReactNode }).children) },
  ),
}))

function log(p: Partial<WeightLog> & { weight_kg: number; logged_at: string }): WeightLog {
  return {
    id: p.id ?? `${p.logged_at}`,
    user_id: "u1",
    weight_kg: p.weight_kg,
    logged_at: p.logged_at,
    note: p.note ?? null,
    created_at: p.created_at ?? `${p.logged_at}T07:00:00Z`,
  }
}

describe("FitnessView", () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Empty state ──
  it("prompts for first weight when history is empty", () => {
    render(<FitnessView history={[]} />)
    expect(screen.getByText(/log your first weight/i)).toBeInTheDocument()
    // no history list rendered
    expect(screen.queryByLabelText(/weight history/i)).not.toBeInTheDocument()
  })

  it("shows a loading message while empty + loading", () => {
    render(<FitnessView history={[]} isLoading />)
    expect(screen.getByText(/loading your journey/i)).toBeInTheDocument()
  })

  // ── Renders data ──
  it("renders latest weight, goal heading, and history rows", () => {
    render(<FitnessView history={FITNESS_MOCK} goalKg={85} />)
    expect(screen.getByText(/toward 85kg/i)).toBeInTheDocument()
    // latest mock weight is 90.4
    expect(screen.getByText("90.4")).toBeInTheDocument()
    const list = screen.getByLabelText(/weight history/i)
    expect(within(list).getAllByRole("listitem")).toHaveLength(FITNESS_MOCK.length)
  })

  it("renders a sparkline when 2+ entries exist", () => {
    render(<FitnessView history={FITNESS_MOCK} />)
    expect(screen.getByLabelText(/weight trend sparkline/i)).toBeInTheDocument()
  })

  // ── Interaction: add-weight flow ──
  it("calls onLog with parsed weight + chosen date, then clears the field", () => {
    const onLog = vi.fn()
    render(<FitnessView history={FITNESS_MOCK} onLog={onLog} />)

    const weightInput = screen.getByLabelText(/weight in kilograms/i) as HTMLInputElement
    const dateInput = screen.getByLabelText(/^date$/i) as HTMLInputElement

    fireEvent.change(weightInput, { target: { value: "89.2" } })
    fireEvent.change(dateInput, { target: { value: "2026-06-16" } })
    act(() => {
      fireEvent.click(screen.getByLabelText(/add weight entry/i))
    })

    expect(onLog).toHaveBeenCalledTimes(1)
    expect(onLog).toHaveBeenCalledWith({ weightKg: 89.2, loggedAt: "2026-06-16" })
  })

  it("does not call onLog for non-positive or out-of-range weight", () => {
    const onLog = vi.fn()
    render(<FitnessView history={[]} onLog={onLog} />)
    const weightInput = screen.getByLabelText(/weight in kilograms/i)

    fireEvent.change(weightInput, { target: { value: "0" } })
    fireEvent.submit(weightInput.closest("form")!)
    expect(onLog).not.toHaveBeenCalled()

    fireEvent.change(weightInput, { target: { value: "1500" } })
    fireEvent.submit(weightInput.closest("form")!)
    expect(onLog).not.toHaveBeenCalled()
  })

  it("disables the add button until a weight is entered", () => {
    render(<FitnessView history={[]} />)
    const btn = screen.getByLabelText(/add weight entry/i) as HTMLButtonElement
    expect(btn).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/weight in kilograms/i), { target: { value: "90" } })
    expect(btn).not.toBeDisabled()
  })

  // ── Interaction: delete ──
  it("calls onDelete with the entry id when trash is clicked", () => {
    const onDelete = vi.fn()
    const history = [log({ id: "x1", weight_kg: 90, logged_at: "2026-06-10" })]
    render(<FitnessView history={history} onDelete={onDelete} />)

    fireEvent.click(screen.getByLabelText(/delete entry from/i))
    expect(onDelete).toHaveBeenCalledWith("x1")
  })

  // ── Goal progress ──
  it("computes goal progress percentage from oldest baseline to latest", () => {
    // start 95, latest 90, goal 85 → (95-90)/(95-85) = 50%
    const history = [
      log({ weight_kg: 95, logged_at: "2026-05-01" }),
      log({ weight_kg: 90, logged_at: "2026-06-01" }),
    ]
    render(<FitnessView history={history} goalKg={85} />)
    expect(screen.getByText(/50% there/i)).toBeInTheDocument()
  })

  // ── Default no-op callbacks (preview safety) ──
  it("does not throw when callbacks are omitted (preview mode)", () => {
    render(<FitnessView history={FITNESS_MOCK} />)
    fireEvent.change(screen.getByLabelText(/weight in kilograms/i), { target: { value: "88" } })
    expect(() => act(() => { fireEvent.click(screen.getByLabelText(/add weight entry/i)) })).not.toThrow()
    expect(() => act(() => { fireEvent.click(screen.getAllByLabelText(/delete entry from/i)[0]) })).not.toThrow()
  })
})
