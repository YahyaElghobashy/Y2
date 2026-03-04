import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} {...rest}>{children}</div>
      )
    ),
    button: React.forwardRef(
      ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => (
        <button ref={ref} {...rest}>{children}</button>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CreateRitualForm } from "@/components/rituals/CreateRitualForm"

describe("CreateRitualForm", () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("unit", () => {
    it("renders form when open", () => {
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)
      expect(screen.getByTestId("ritual-form")).toBeInTheDocument()
    })

    it("does not render when closed", () => {
      render(<CreateRitualForm open={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />)
      expect(screen.queryByTestId("ritual-form")).not.toBeInTheDocument()
    })

    it("renders title input", () => {
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)
      expect(screen.getByTestId("ritual-title-input")).toBeInTheDocument()
    })

    it("renders emoji picker", () => {
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)
      expect(screen.getByTestId("emoji-picker")).toBeInTheDocument()
    })

    it("renders cadence selector", () => {
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)
      expect(screen.getByTestId("cadence-selector")).toBeInTheDocument()
      expect(screen.getByTestId("cadence-daily")).toBeInTheDocument()
      expect(screen.getByTestId("cadence-weekly")).toBeInTheDocument()
      expect(screen.getByTestId("cadence-monthly")).toBeInTheDocument()
    })

    it("renders shared toggle", () => {
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)
      expect(screen.getByTestId("shared-toggle")).toBeInTheDocument()
    })

    it("submit button disabled when title empty", () => {
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)
      expect(screen.getByTestId("create-ritual-submit")).toBeDisabled()
    })
  })

  describe("interaction", () => {
    it("calls onClose when close button clicked", async () => {
      const user = userEvent.setup()
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)

      await user.click(screen.getByTestId("ritual-form-close"))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it("calls onClose when backdrop clicked", async () => {
      const user = userEvent.setup()
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)

      await user.click(screen.getByTestId("ritual-form-backdrop"))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it("calls onSubmit with correct data", async () => {
      const user = userEvent.setup()
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)

      await user.type(screen.getByTestId("ritual-title-input"), "Gratitude Journal")
      await user.click(screen.getByTestId("cadence-weekly"))
      await user.click(screen.getByTestId("create-ritual-submit"))

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Gratitude Journal",
          cadence: "weekly",
          icon: "✨",
          is_shared: false,
          coyyns_reward: 0,
        })
      )
    })

    it("selects emoji on click", async () => {
      const user = userEvent.setup()
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)

      await user.click(screen.getByTestId("emoji-🚶"))
      await user.type(screen.getByTestId("ritual-title-input"), "Walk")
      await user.click(screen.getByTestId("create-ritual-submit"))

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ icon: "🚶" })
      )
    })

    it("toggles shared mode", async () => {
      const user = userEvent.setup()
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)

      await user.click(screen.getByTestId("shared-toggle"))
      await user.type(screen.getByTestId("ritual-title-input"), "Read Together")
      await user.click(screen.getByTestId("create-ritual-submit"))

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ is_shared: true })
      )
    })
  })

  describe("integration", () => {
    it("renders header text", () => {
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)
      expect(screen.getByText("New Ritual")).toBeInTheDocument()
    })

    it("renders submit button text", () => {
      render(<CreateRitualForm open onClose={mockOnClose} onSubmit={mockOnSubmit} />)
      expect(screen.getByTestId("create-ritual-submit")).toHaveTextContent("Create Ritual")
    })
  })
})
