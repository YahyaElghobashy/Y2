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

import { VisionBoardWizard } from "@/components/vision-board/VisionBoardWizard"

describe("VisionBoardWizard", () => {
  const onComplete = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === Unit tests ===

  it("renders without crashing", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    expect(screen.getByTestId("vision-board-wizard")).toBeInTheDocument()
  })

  it("renders step 0 (title + theme) initially", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    expect(screen.getByText("What's your year about?")).toBeInTheDocument()
    expect(screen.getByTestId("wizard-title-input")).toBeInTheDocument()
    expect(screen.getByTestId("wizard-theme-input")).toBeInTheDocument()
  })

  it("renders progress dots", () => {
    const { container } = render(<VisionBoardWizard onComplete={onComplete} />)
    const dots = container.querySelectorAll(".rounded-full.w-2")
    expect(dots.length).toBe(4)
  })

  it("renders Next button on step 0", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    expect(screen.getByTestId("wizard-next")).toBeInTheDocument()
  })

  it("Next button is disabled when title is empty", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    expect(screen.getByTestId("wizard-next")).toBeDisabled()
  })

  it("Next button is enabled when title is entered", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    expect(screen.getByTestId("wizard-next")).not.toBeDisabled()
  })

  // === Interaction tests: Step navigation ===

  it("navigates to step 1 (categories) when Next clicked", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    expect(screen.getByText("Pick your focus areas")).toBeInTheDocument()
  })

  it("shows Back button on step 1", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    expect(screen.getByTestId("wizard-back")).toBeInTheDocument()
  })

  it("goes back to step 0 when Back clicked", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("wizard-back"))
    expect(screen.getByText("What's your year about?")).toBeInTheDocument()
  })

  it("does not show Back button on step 0", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    expect(screen.queryByTestId("wizard-back")).not.toBeInTheDocument()
  })

  // === Interaction tests: Category selection ===

  it("renders suggested category chips on step 1", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    expect(screen.getByTestId("category-chip-Faith")).toBeInTheDocument()
    expect(screen.getByTestId("category-chip-Health")).toBeInTheDocument()
  })

  it("Next is disabled on step 1 with no categories selected", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    expect(screen.getByTestId("wizard-next")).toBeDisabled()
  })

  it("selects a category when chip clicked", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("category-chip-Health"))
    expect(screen.getByText("1 selected: Health")).toBeInTheDocument()
  })

  it("deselects a category when clicked again", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("category-chip-Health"))
    fireEvent.click(screen.getByTestId("category-chip-Health"))
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
  })

  it("allows adding custom category", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.change(screen.getByTestId("custom-category-input"), { target: { value: "Cooking" } })
    fireEvent.click(screen.getByTestId("add-custom-category-btn"))
    expect(screen.getByText(/Cooking/)).toBeInTheDocument()
  })

  it("prevents duplicate custom categories", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    // Select Health from suggested
    fireEvent.click(screen.getByTestId("category-chip-Health"))
    // Try to add "health" as custom (case-insensitive)
    fireEvent.change(screen.getByTestId("custom-category-input"), { target: { value: "health" } })
    fireEvent.click(screen.getByTestId("add-custom-category-btn"))
    expect(screen.getByText("1 selected: Health")).toBeInTheDocument()
  })

  it("clears custom input after adding", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.change(screen.getByTestId("custom-category-input"), { target: { value: "Art" } })
    fireEvent.click(screen.getByTestId("add-custom-category-btn"))
    expect(screen.getByTestId("custom-category-input")).toHaveValue("")
  })

  // === Interaction tests: Full flow ===

  it("navigates through all 4 steps to completion", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    // Step 0: Title
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My 2026" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    // Step 1: Category
    fireEvent.click(screen.getByTestId("category-chip-Faith"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    // Step 2: Hero (skip)
    expect(screen.getByText("Add a banner image?")).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("wizard-next"))
    // Step 3: Preview
    expect(screen.getByText("You're set!")).toBeInTheDocument()
    expect(screen.getByTestId("wizard-complete")).toBeInTheDocument()
  })

  it("shows board title and category count on preview step", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "Dream Big" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("category-chip-Health"))
    fireEvent.click(screen.getByTestId("category-chip-Career"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    expect(screen.getByText("Dream Big")).toBeInTheDocument()
    expect(screen.getByText(/2 categories/)).toBeInTheDocument()
  })

  it("calls onComplete with correct data on final step", async () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    // Step 0
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My 2026" } })
    fireEvent.change(screen.getByTestId("wizard-theme-input"), { target: { value: "Growth" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    // Step 1
    fireEvent.click(screen.getByTestId("category-chip-Faith"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    // Step 2 (skip)
    fireEvent.click(screen.getByTestId("wizard-next"))
    // Step 3
    fireEvent.click(screen.getByTestId("wizard-complete"))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({
        title: "My 2026",
        theme: "Growth",
        categories: [{ name: "Faith", icon: "🤲" }],
        heroFile: undefined,
      })
    })
  })

  it("sends undefined theme when empty", async () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My 2026" } })
    // Leave theme empty
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("category-chip-Health"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("wizard-complete"))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({ theme: undefined })
      )
    })
  })

  it("shows 'Creating...' while submitting", async () => {
    let resolvePromise: () => void
    const slowComplete = vi.fn().mockReturnValue(new Promise<void>((r) => { resolvePromise = r }))
    render(<VisionBoardWizard onComplete={slowComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My 2026" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("category-chip-Health"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("wizard-complete"))
    expect(screen.getByText("Creating...")).toBeInTheDocument()
    resolvePromise!()
  })

  it("adds custom category via Enter key", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My Vision" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.change(screen.getByTestId("custom-category-input"), { target: { value: "Music" } })
    fireEvent.keyDown(screen.getByTestId("custom-category-input"), { key: "Enter" })
    expect(screen.getByText(/Music/)).toBeInTheDocument()
  })

  // === Integration tests ===

  it("does not call onComplete twice on double-click", async () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My 2026" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("category-chip-Health"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("wizard-complete"))
    fireEvent.click(screen.getByTestId("wizard-complete"))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  it("preserves title when navigating back and forth", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "Preserved Title" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    // Go to step 1, then back
    fireEvent.click(screen.getByTestId("wizard-back"))
    expect(screen.getByTestId("wizard-title-input")).toHaveValue("Preserved Title")
  })

  it("hero upload step is optional (can proceed without image)", () => {
    render(<VisionBoardWizard onComplete={onComplete} />)
    fireEvent.change(screen.getByTestId("wizard-title-input"), { target: { value: "My 2026" } })
    fireEvent.click(screen.getByTestId("wizard-next"))
    fireEvent.click(screen.getByTestId("category-chip-Health"))
    fireEvent.click(screen.getByTestId("wizard-next"))
    // Step 2: hero upload — Next should be enabled
    expect(screen.getByTestId("wizard-next")).not.toBeDisabled()
  })
})
