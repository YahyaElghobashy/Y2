import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { PortalCreationWizard } from "@/components/events/PortalCreationWizard"

describe("PortalCreationWizard", () => {
  const mockOnComplete = vi.fn().mockResolvedValue(undefined)
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit: Initial render ──

  it("renders step 1 (Event Type) initially", () => {
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )
    expect(screen.getByText("What are you celebrating?")).toBeInTheDocument()
    expect(screen.getByText("1 / 5")).toBeInTheDocument()
  })

  it("shows all 6 event types", () => {
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )
    expect(screen.getByTestId("event-type-wedding")).toBeInTheDocument()
    expect(screen.getByTestId("event-type-engagement")).toBeInTheDocument()
    expect(screen.getByTestId("event-type-birthday")).toBeInTheDocument()
    expect(screen.getByTestId("event-type-anniversary")).toBeInTheDocument()
    expect(screen.getByTestId("event-type-gathering")).toBeInTheDocument()
    expect(screen.getByTestId("event-type-custom")).toBeInTheDocument()
  })

  it("shows Cancel button on step 1", () => {
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )
    expect(screen.getByText("Cancel")).toBeInTheDocument()
  })

  it("calls onCancel when Cancel clicked on step 1", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )
    await user.click(screen.getByText("Cancel"))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  // ── Interaction: Navigate forward through steps ──

  it("navigates to step 2 (Details) when Next clicked", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    // Select event type (wedding is default selected)
    await user.click(screen.getByText("Next"))

    expect(screen.getByText("Event Details")).toBeInTheDocument()
    expect(screen.getByText("2 / 5")).toBeInTheDocument()
  })

  it("requires title before proceeding from step 2", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    // Go to step 2
    await user.click(screen.getByText("Next"))

    // Next should be disabled without title
    const nextButton = screen.getByText("Next")
    expect(nextButton).toBeDisabled()

    // Type a title
    await user.type(screen.getByTestId("portal-title-input"), "Our Wedding")

    // Now Next should be enabled
    expect(nextButton).not.toBeDisabled()
  })

  it("can add and remove sub-events in step 2", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    // Go to step 2
    await user.click(screen.getByText("Next"))

    // Add a sub-event
    await user.click(screen.getByTestId("add-sub-event"))

    // Should see a sub-event input
    expect(screen.getByPlaceholderText("e.g. Ceremony")).toBeInTheDocument()

    // Remove it
    await user.click(screen.getByTestId("remove-sub-event-0"))

    // Sub-event input should be gone
    expect(screen.queryByPlaceholderText("e.g. Ceremony")).not.toBeInTheDocument()
  })

  it("navigates to step 3 (Theme) from step 2", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    // Step 1 → 2
    await user.click(screen.getByText("Next"))
    // Fill title
    await user.type(screen.getByTestId("portal-title-input"), "My Event")
    // Step 2 → 3
    await user.click(screen.getByText("Next"))

    expect(screen.getByText("Choose a Theme")).toBeInTheDocument()
    expect(screen.getByText("3 / 5")).toBeInTheDocument()
  })

  it("shows 4 theme presets in step 3", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    await user.click(screen.getByText("Next"))
    await user.type(screen.getByTestId("portal-title-input"), "My Event")
    await user.click(screen.getByText("Next"))

    expect(screen.getByTestId("theme-elegant_gold")).toBeInTheDocument()
    expect(screen.getByTestId("theme-garden_romance")).toBeInTheDocument()
    expect(screen.getByTestId("theme-minimalist")).toBeInTheDocument()
    expect(screen.getByTestId("theme-midnight_blue")).toBeInTheDocument()
  })

  it("navigates to step 4 (Template) from step 3", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    // Step 1 → 2 → 3 → 4
    await user.click(screen.getByText("Next"))
    await user.type(screen.getByTestId("portal-title-input"), "My Event")
    await user.click(screen.getByText("Next"))
    await user.click(screen.getByText("Next"))

    expect(screen.getByText("Start with a Template")).toBeInTheDocument()
    expect(screen.getByText("4 / 5")).toBeInTheDocument()
  })

  it("navigates to step 5 (Review) from step 4", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    // Navigate through all steps
    await user.click(screen.getByText("Next"))
    await user.type(screen.getByTestId("portal-title-input"), "My Wedding")
    await user.click(screen.getByText("Next"))
    await user.click(screen.getByText("Next"))
    await user.click(screen.getByText("Next"))

    expect(screen.getByText("Review Your Portal")).toBeInTheDocument()
    expect(screen.getByText("5 / 5")).toBeInTheDocument()
    expect(screen.getByText("My Wedding")).toBeInTheDocument()
  })

  // ── Interaction: Navigate backward ──

  it("can navigate back from step 2 to step 1", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    await user.click(screen.getByText("Next"))
    expect(screen.getByText("Event Details")).toBeInTheDocument()

    await user.click(screen.getByText("Back"))
    expect(screen.getByText("What are you celebrating?")).toBeInTheDocument()
  })

  // ── Interaction: Submit ──

  it("shows Create Portal button on review step", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    // Navigate to review
    await user.click(screen.getByText("Next"))
    await user.type(screen.getByTestId("portal-title-input"), "My Event")
    await user.click(screen.getByText("Next"))
    await user.click(screen.getByText("Next"))
    await user.click(screen.getByText("Next"))

    expect(screen.getByText("Create Portal")).toBeInTheDocument()
  })

  it("calls onComplete with correct data on submit", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    // Step 1: Select birthday
    await user.click(screen.getByTestId("event-type-birthday"))
    await user.click(screen.getByText("Next"))

    // Step 2: Fill details
    await user.type(screen.getByTestId("portal-title-input"), "My Birthday")
    await user.click(screen.getByText("Next"))

    // Step 3: Theme (default or pick one)
    await user.click(screen.getByText("Next"))

    // Step 4: Template (default)
    await user.click(screen.getByText("Next"))

    // Step 5: Submit
    await user.click(screen.getByText("Create Portal"))

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "My Birthday",
          event_type: "birthday",
          theme_config: expect.objectContaining({
            colors: expect.any(Object),
            fonts: expect.any(Object),
          }),
        })
      )
    })
  })

  // ── Unit: Event type selection auto-sets template ──

  it("selecting event type auto-selects suggested template", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    // Select engagement
    await user.click(screen.getByTestId("event-type-engagement"))

    // Navigate to review to verify
    await user.click(screen.getByText("Next"))
    await user.type(screen.getByTestId("portal-title-input"), "Test")
    await user.click(screen.getByText("Next"))
    await user.click(screen.getByText("Next"))
    await user.click(screen.getByText("Next"))

    // Review should show the Engagement template (in template row)
    expect(screen.getByText(/Engagement \(3 pages\)/)).toBeInTheDocument()
  })

  // ── Unit: Review shows correct summary ──

  it("review step shows event type, title, and theme", async () => {
    const user = userEvent.setup()
    render(
      <PortalCreationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
    )

    await user.click(screen.getByText("Next"))
    await user.type(screen.getByTestId("portal-title-input"), "Grand Celebration")
    await user.click(screen.getByText("Next"))
    await user.click(screen.getByTestId("theme-minimalist"))
    await user.click(screen.getByText("Next"))
    await user.click(screen.getByText("Next"))

    expect(screen.getByText("Grand Celebration")).toBeInTheDocument()
    expect(screen.getByText("Minimalist")).toBeInTheDocument()
  })
})
