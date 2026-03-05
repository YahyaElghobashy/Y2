import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, layout, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layout
      return <div ref={ref} {...rest}>{children}</div>
    }),
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock createPortal to render inline
vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom")
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  }
})

import { AddVisionItemForm } from "@/components/vision-board/AddVisionItemForm"
import type { CategoryWithItems } from "@/lib/types/vision-board.types"

const makeCategories = (): CategoryWithItems[] => [
  { id: "cat-1", board_id: "board-1", name: "Health", icon: "💪", sort_order: 0, created_at: "2026-01-01", items: [] },
  { id: "cat-2", board_id: "board-1", name: "Career", icon: "💼", sort_order: 1, created_at: "2026-01-01", items: [] },
]

describe("AddVisionItemForm", () => {
  const onSave = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()

  const defaultProps = {
    categoryId: "cat-1",
    categories: makeCategories(),
    onSave,
    onClose,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === Unit tests ===

  it("renders without crashing", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    expect(screen.getByTestId("add-item-form")).toBeInTheDocument()
  })

  it("renders 'Add Vision Item' heading", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    expect(screen.getByText("Add Vision Item")).toBeInTheDocument()
  })

  it("renders title input", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    expect(screen.getByTestId("title-input")).toBeInTheDocument()
  })

  it("renders description textarea", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    expect(screen.getByTestId("description-input")).toBeInTheDocument()
  })

  it("renders category dropdown with all categories", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    const select = screen.getByTestId("category-select")
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue("cat-1")
  })

  it("pre-selects the given categoryId", () => {
    render(<AddVisionItemForm {...defaultProps} categoryId="cat-2" />)
    expect(screen.getByTestId("category-select")).toHaveValue("cat-2")
  })

  it("renders photo upload area", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    expect(screen.getByTestId("photo-upload")).toBeInTheDocument()
    expect(screen.getByText("Add photo (optional)")).toBeInTheDocument()
  })

  it("renders save button disabled when title is empty", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    expect(screen.getByTestId("save-item-btn")).toBeDisabled()
  })

  it("shows description char counter", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    expect(screen.getByText("0/300")).toBeInTheDocument()
  })

  // === Interaction tests ===

  it("enables save button when title is entered", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "My goal" } })
    expect(screen.getByTestId("save-item-btn")).not.toBeDisabled()
  })

  it("calls onClose when X button clicked", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    // Find the X button (close button)
    const buttons = screen.getAllByRole("button")
    const closeButton = buttons.find((btn) => btn.querySelector(".lucide-x") || btn.textContent === "")
    if (closeButton) fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })

  it("calls onClose when backdrop clicked", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    // The backdrop is the first child div with bg-black/40 class
    const backdrop = screen.getByTestId("add-item-form").querySelector(".bg-black\\/40, [class*='bg-black']")
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it("calls onSave with correct args when submitted", async () => {
    render(<AddVisionItemForm {...defaultProps} />)
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Run marathon" } })
    fireEvent.change(screen.getByTestId("description-input"), { target: { value: "Complete a full marathon" } })
    fireEvent.click(screen.getByTestId("save-item-btn"))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("cat-1", {
        title: "Run marathon",
        description: "Complete a full marathon",
        file: undefined,
      })
    })
  })

  it("trims whitespace from title before saving", async () => {
    render(<AddVisionItemForm {...defaultProps} />)
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "  Trim me  " } })
    fireEvent.click(screen.getByTestId("save-item-btn"))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("cat-1", expect.objectContaining({
        title: "Trim me",
      }))
    })
  })

  it("sends undefined description when empty", async () => {
    render(<AddVisionItemForm {...defaultProps} />)
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Goal" } })
    fireEvent.click(screen.getByTestId("save-item-btn"))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("cat-1", expect.objectContaining({
        description: undefined,
      }))
    })
  })

  it("uses selected category when changed", async () => {
    render(<AddVisionItemForm {...defaultProps} />)
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Promotion" } })
    fireEvent.change(screen.getByTestId("category-select"), { target: { value: "cat-2" } })
    fireEvent.click(screen.getByTestId("save-item-btn"))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith("cat-2", expect.objectContaining({
        title: "Promotion",
      }))
    })
  })

  it("calls onClose after successful save", async () => {
    render(<AddVisionItemForm {...defaultProps} />)
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Goal" } })
    fireEvent.click(screen.getByTestId("save-item-btn"))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it("shows 'Adding...' while saving", async () => {
    let resolvePromise: () => void
    const slowSave = vi.fn().mockReturnValue(new Promise<void>((r) => { resolvePromise = r }))
    render(<AddVisionItemForm {...defaultProps} onSave={slowSave} />)
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Goal" } })
    fireEvent.click(screen.getByTestId("save-item-btn"))
    expect(screen.getByText("Adding...")).toBeInTheDocument()
    resolvePromise!()
    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled() // onClose from defaultProps, not the one in this test
    })
  })

  it("does not submit when title is whitespace only", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "   " } })
    expect(screen.getByTestId("save-item-btn")).toBeDisabled()
  })

  it("updates description char count as user types", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    fireEvent.change(screen.getByTestId("description-input"), { target: { value: "Hello world" } })
    expect(screen.getByText("11/300")).toBeInTheDocument()
  })

  // === Integration tests ===

  it("prevents double submission", async () => {
    let resolvePromise: () => void
    const slowSave = vi.fn().mockReturnValue(new Promise<void>((r) => { resolvePromise = r }))
    render(<AddVisionItemForm {...defaultProps} onSave={slowSave} />)
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Goal" } })

    fireEvent.click(screen.getByTestId("save-item-btn"))
    fireEvent.click(screen.getByTestId("save-item-btn"))

    resolvePromise!()
    await waitFor(() => {
      expect(slowSave).toHaveBeenCalledTimes(1)
    })
  })

  it("renders all category options in dropdown", () => {
    render(<AddVisionItemForm {...defaultProps} />)
    const options = screen.getByTestId("category-select").querySelectorAll("option")
    expect(options).toHaveLength(2)
  })
})
