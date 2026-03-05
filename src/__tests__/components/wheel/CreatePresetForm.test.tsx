import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// ── Mock framer-motion ──────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...domProps } = props as Record<string, unknown>
      return <button {...(domProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
  },
}))

import { CreatePresetForm } from "@/components/wheel/CreatePresetForm"

describe("CreatePresetForm", () => {
  // ── UNIT: Default render ─────────────────────────────────────

  it("renders form with correct testid", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByTestId("create-preset-form")).toBeInTheDocument()
  })

  it("shows 'New Preset' heading when no initialData", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByText("New Preset")).toBeInTheDocument()
  })

  it("shows 'Edit Preset' heading when initialData provided", () => {
    render(
      <CreatePresetForm
        onSave={vi.fn()}
        onCancel={vi.fn()}
        initialData={{ name: "Test", icon: "🎯", items: [{ label: "A" }, { label: "B" }] }}
      />
    )

    expect(screen.getByText("Edit Preset")).toBeInTheDocument()
  })

  it("starts with 2 empty item inputs", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByTestId("item-input-0")).toBeInTheDocument()
    expect(screen.getByTestId("item-input-1")).toBeInTheDocument()
  })

  it("save button is disabled initially (empty name + empty items)", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    const saveBtn = screen.getByTestId("save-preset-btn")
    expect(saveBtn).toBeDisabled()
  })

  // ── UNIT: Pre-filled with initialData ────────────────────────

  it("pre-fills name and items from initialData", () => {
    render(
      <CreatePresetForm
        onSave={vi.fn()}
        onCancel={vi.fn()}
        initialData={{
          name: "Restaurant Picker",
          icon: "🍕",
          items: [{ label: "Pizza" }, { label: "Sushi" }],
        }}
      />
    )

    expect(screen.getByTestId("preset-name-input")).toHaveValue("Restaurant Picker")
    expect(screen.getByTestId("item-input-0")).toHaveValue("Pizza")
    expect(screen.getByTestId("item-input-1")).toHaveValue("Sushi")
  })

  // ── INTERACTION: Name input ──────────────────────────────────

  it("updates name on input change", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId("preset-name-input"), {
      target: { value: "My Wheel" },
    })

    expect(screen.getByTestId("preset-name-input")).toHaveValue("My Wheel")
  })

  // ── INTERACTION: Add / remove items ──────────────────────────

  it("adds a new item when add button is clicked", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    fireEvent.click(screen.getByTestId("add-item-btn"))

    expect(screen.getByTestId("item-input-2")).toBeInTheDocument()
  })

  it("removes an item when remove button is clicked", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    // Add a third item first (need 3+ to show remove buttons)
    fireEvent.click(screen.getByTestId("add-item-btn"))
    expect(screen.getByTestId("item-input-2")).toBeInTheDocument()

    // Remove the third item
    fireEvent.click(screen.getByTestId("remove-item-2"))
    expect(screen.queryByTestId("item-input-2")).not.toBeInTheDocument()
  })

  it("does not show remove buttons when only 2 items exist", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.queryByTestId("remove-item-0")).not.toBeInTheDocument()
    expect(screen.queryByTestId("remove-item-1")).not.toBeInTheDocument()
  })

  it("updates item text on change", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId("item-input-0"), {
      target: { value: "Pizza" },
    })

    expect(screen.getByTestId("item-input-0")).toHaveValue("Pizza")
  })

  // ── INTERACTION: Emoji picker ────────────────────────────────

  it("shows emoji grid when icon button is clicked", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.queryByTestId("emoji-grid")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("icon-picker-btn"))
    expect(screen.getByTestId("emoji-grid")).toBeInTheDocument()
  })

  it("hides emoji grid after selecting an emoji", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    fireEvent.click(screen.getByTestId("icon-picker-btn"))
    // Click the pizza emoji
    const emojis = screen.getByTestId("emoji-grid").querySelectorAll("button")
    fireEvent.click(emojis[1]) // 🍕 is at index 1

    expect(screen.queryByTestId("emoji-grid")).not.toBeInTheDocument()
  })

  // ── INTERACTION: Save ────────────────────────────────────────

  it("enables save when name and 2+ items are filled", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId("preset-name-input"), {
      target: { value: "My Wheel" },
    })
    fireEvent.change(screen.getByTestId("item-input-0"), {
      target: { value: "Option A" },
    })
    fireEvent.change(screen.getByTestId("item-input-1"), {
      target: { value: "Option B" },
    })

    expect(screen.getByTestId("save-preset-btn")).not.toBeDisabled()
  })

  it("calls onSave with trimmed data when save is clicked", () => {
    const onSave = vi.fn()
    render(<CreatePresetForm onSave={onSave} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId("preset-name-input"), {
      target: { value: "  My Wheel  " },
    })
    fireEvent.change(screen.getByTestId("item-input-0"), {
      target: { value: "  Option A  " },
    })
    fireEvent.change(screen.getByTestId("item-input-1"), {
      target: { value: "  Option B  " },
    })

    fireEvent.click(screen.getByTestId("save-preset-btn"))

    expect(onSave).toHaveBeenCalledWith({
      name: "My Wheel",
      icon: "🎯",
      items: [{ label: "Option A" }, { label: "Option B" }],
    })
  })

  it("filters out empty items on save", () => {
    const onSave = vi.fn()
    render(<CreatePresetForm onSave={onSave} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId("preset-name-input"), {
      target: { value: "My Wheel" },
    })
    // Add 3 items but leave one empty
    fireEvent.change(screen.getByTestId("item-input-0"), {
      target: { value: "Option A" },
    })
    // item-input-1 stays empty
    fireEvent.click(screen.getByTestId("add-item-btn"))
    fireEvent.change(screen.getByTestId("item-input-2"), {
      target: { value: "Option C" },
    })

    fireEvent.click(screen.getByTestId("save-preset-btn"))

    expect(onSave).toHaveBeenCalledWith({
      name: "My Wheel",
      icon: "🎯",
      items: [{ label: "Option A" }, { label: "Option C" }],
    })
  })

  it("does not call onSave when save is disabled", () => {
    const onSave = vi.fn()
    render(<CreatePresetForm onSave={onSave} onCancel={vi.fn()} />)

    fireEvent.click(screen.getByTestId("save-preset-btn"))
    expect(onSave).not.toHaveBeenCalled()
  })

  // ── INTERACTION: Cancel ──────────────────────────────────────

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn()
    render(<CreatePresetForm onSave={vi.fn()} onCancel={onCancel} />)

    fireEvent.click(screen.getByTestId("cancel-preset-btn"))
    expect(onCancel).toHaveBeenCalled()
  })

  // ── UNIT: Max items limit ────────────────────────────────────

  it("hides add button when 20 items exist", () => {
    render(
      <CreatePresetForm
        onSave={vi.fn()}
        onCancel={vi.fn()}
        initialData={{
          name: "Big Wheel",
          icon: "🎯",
          items: Array.from({ length: 20 }, (_, i) => ({ label: `Item ${i + 1}` })),
        }}
      />
    )

    expect(screen.queryByTestId("add-item-btn")).not.toBeInTheDocument()
  })

  // ── UNIT: Item counter display ───────────────────────────────

  it("shows correct filled item count", () => {
    render(<CreatePresetForm onSave={vi.fn()} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByTestId("item-input-0"), {
      target: { value: "Pizza" },
    })

    expect(screen.getByText("Items (1/20)")).toBeInTheDocument()
  })
})
