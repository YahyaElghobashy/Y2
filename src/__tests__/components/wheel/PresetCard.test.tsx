import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// ── Mock framer-motion ──────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...domProps } = props as Record<string, unknown>
      return <div {...(domProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
  },
}))

import { PresetCard } from "@/components/wheel/PresetCard"
import type { WheelPreset } from "@/lib/types/wheel.types"

const MOCK_PRESET: WheelPreset = {
  id: "preset-1",
  user_id: "user-1",
  name: "Restaurant Picker",
  icon: "🍕",
  items: [
    { id: "i1", label: "Pizza" },
    { id: "i2", label: "Sushi" },
    { id: "i3", label: "Tacos" },
  ],
  is_shared: true,
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

describe("PresetCard", () => {
  // ── UNIT: Renders preset info ────────────────────────────────

  it("renders preset name and icon", () => {
    render(<PresetCard preset={MOCK_PRESET} onPlay={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText("Restaurant Picker")).toBeInTheDocument()
    expect(screen.getByText("🍕")).toBeInTheDocument()
  })

  it("renders item count", () => {
    render(<PresetCard preset={MOCK_PRESET} onPlay={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText("3 items")).toBeInTheDocument()
  })

  it("renders correct testid", () => {
    render(<PresetCard preset={MOCK_PRESET} onPlay={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByTestId("preset-card-preset-1")).toBeInTheDocument()
  })

  it("renders delete button with correct testid", () => {
    render(<PresetCard preset={MOCK_PRESET} onPlay={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByTestId("delete-preset-preset-1")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(
      <PresetCard preset={MOCK_PRESET} onPlay={vi.fn()} onDelete={vi.fn()} className="custom-class" />
    )

    expect(screen.getByTestId("preset-card-preset-1").className).toContain("custom-class")
  })

  // ── INTERACTION: onPlay callback ─────────────────────────────

  it("calls onPlay with preset id when card is clicked", () => {
    const onPlay = vi.fn()
    render(<PresetCard preset={MOCK_PRESET} onPlay={onPlay} onDelete={vi.fn()} />)

    fireEvent.click(screen.getByTestId("preset-card-preset-1"))
    expect(onPlay).toHaveBeenCalledWith("preset-1")
  })

  // ── INTERACTION: onDelete callback ───────────────────────────

  it("calls onDelete with preset id when delete button is clicked", () => {
    const onDelete = vi.fn()
    render(<PresetCard preset={MOCK_PRESET} onPlay={vi.fn()} onDelete={onDelete} />)

    fireEvent.click(screen.getByTestId("delete-preset-preset-1"))
    expect(onDelete).toHaveBeenCalledWith("preset-1")
  })

  it("does not call onPlay when delete button is clicked", () => {
    const onPlay = vi.fn()
    const onDelete = vi.fn()
    render(<PresetCard preset={MOCK_PRESET} onPlay={onPlay} onDelete={onDelete} />)

    fireEvent.click(screen.getByTestId("delete-preset-preset-1"))
    expect(onDelete).toHaveBeenCalledWith("preset-1")
    expect(onPlay).not.toHaveBeenCalled()
  })

  // ── UNIT: Different item counts ──────────────────────────────

  it("shows correct count for presets with many items", () => {
    const preset: WheelPreset = {
      ...MOCK_PRESET,
      items: Array.from({ length: 15 }, (_, i) => ({
        id: `i${i}`,
        label: `Item ${i}`,
      })),
    }

    render(<PresetCard preset={preset} onPlay={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText("15 items")).toBeInTheDocument()
  })
})
