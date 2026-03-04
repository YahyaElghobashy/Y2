import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Framer Motion mock ──────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...rest }: { children?: React.ReactNode; [k: string]: unknown },
        ref: React.Ref<HTMLDivElement>
      ) => (
        <div ref={ref} {...rest}>
          {children}
        </div>
      )
    ),
    button: React.forwardRef(
      (
        { children, ...rest }: { children?: React.ReactNode; [k: string]: unknown },
        ref: React.Ref<HTMLButtonElement>
      ) => (
        <button ref={ref} {...rest}>
          {children}
        </button>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { QuickAddInput } from "@/components/list/QuickAddInput"

describe("QuickAddInput", () => {
  const mockOnAdd = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders input and button", () => {
      render(<QuickAddInput onAdd={mockOnAdd} />)
      expect(screen.getByTestId("quick-add-input")).toBeInTheDocument()
      expect(screen.getByTestId("quick-add-field")).toBeInTheDocument()
      expect(screen.getByTestId("quick-add-button")).toBeInTheDocument()
    })

    it("shows custom placeholder", () => {
      render(<QuickAddInput onAdd={mockOnAdd} placeholder="Add to Groceries..." />)
      expect(screen.getByPlaceholderText("Add to Groceries...")).toBeInTheDocument()
    })

    it("shows default placeholder", () => {
      render(<QuickAddInput onAdd={mockOnAdd} />)
      expect(screen.getByPlaceholderText("Add an item...")).toBeInTheDocument()
    })

    it("button is disabled when input is empty", () => {
      render(<QuickAddInput onAdd={mockOnAdd} />)
      expect(screen.getByTestId("quick-add-button")).toBeDisabled()
    })

    it("applies custom className", () => {
      render(<QuickAddInput onAdd={mockOnAdd} className="my-custom" />)
      expect(screen.getByTestId("quick-add-input").className).toContain("my-custom")
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("calls onAdd with trimmed value when button clicked", async () => {
      const user = userEvent.setup()
      render(<QuickAddInput onAdd={mockOnAdd} />)

      await user.type(screen.getByTestId("quick-add-field"), "Milk")
      await user.click(screen.getByTestId("quick-add-button"))

      expect(mockOnAdd).toHaveBeenCalledWith("Milk")
    })

    it("calls onAdd on Enter key", async () => {
      const user = userEvent.setup()
      render(<QuickAddInput onAdd={mockOnAdd} />)

      await user.type(screen.getByTestId("quick-add-field"), "Eggs{Enter}")

      expect(mockOnAdd).toHaveBeenCalledWith("Eggs")
    })

    it("clears input after adding", async () => {
      const user = userEvent.setup()
      render(<QuickAddInput onAdd={mockOnAdd} />)

      const input = screen.getByTestId("quick-add-field") as HTMLInputElement
      await user.type(input, "Bread{Enter}")

      expect(input.value).toBe("")
    })

    it("does NOT call onAdd when input is whitespace only", async () => {
      const user = userEvent.setup()
      render(<QuickAddInput onAdd={mockOnAdd} />)

      await user.type(screen.getByTestId("quick-add-field"), "   {Enter}")

      expect(mockOnAdd).not.toHaveBeenCalled()
    })

    it("trims whitespace from value", async () => {
      const user = userEvent.setup()
      render(<QuickAddInput onAdd={mockOnAdd} />)

      await user.type(screen.getByTestId("quick-add-field"), "  Cheese  {Enter}")

      expect(mockOnAdd).toHaveBeenCalledWith("Cheese")
    })

    it("enables button when text is typed", async () => {
      const user = userEvent.setup()
      render(<QuickAddInput onAdd={mockOnAdd} />)

      const button = screen.getByTestId("quick-add-button")
      expect(button).toBeDisabled()

      await user.type(screen.getByTestId("quick-add-field"), "A")
      expect(button).not.toBeDisabled()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("supports rapid sequential adds", async () => {
      const user = userEvent.setup()
      render(<QuickAddInput onAdd={mockOnAdd} />)

      const input = screen.getByTestId("quick-add-field")
      await user.type(input, "Item 1{Enter}")
      await user.type(input, "Item 2{Enter}")

      expect(mockOnAdd).toHaveBeenCalledTimes(2)
      expect(mockOnAdd).toHaveBeenCalledWith("Item 1")
      expect(mockOnAdd).toHaveBeenCalledWith("Item 2")
    })

    it("has aria-label on add button", () => {
      render(<QuickAddInput onAdd={mockOnAdd} />)
      expect(screen.getByTestId("quick-add-button")).toHaveAttribute("aria-label", "Add item")
    })
  })
})
