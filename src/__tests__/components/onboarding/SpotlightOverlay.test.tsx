import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SpotlightOverlay } from "@/components/onboarding/SpotlightOverlay"
import type { SpotlightTarget } from "@/lib/hooks/use-spotlight"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    rect: (props: Record<string, unknown>) => <rect {...props} />,
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid={props["data-testid"] as string} style={props.style as React.CSSProperties}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

const TARGET: SpotlightTarget = {
  selector: "#home-tab",
  shape: "circle",
  padding: 12,
  tooltipPosition: "bottom",
  title: "Home Dashboard",
  description: "Your daily overview of everything important.",
  pulseTarget: true,
}

const RECT: DOMRect = {
  x: 40,
  y: 600,
  width: 48,
  height: 48,
  top: 600,
  left: 40,
  right: 88,
  bottom: 648,
  toJSON: () => ({}),
}

describe("SpotlightOverlay", () => {
  const user = userEvent.setup()
  let onNext: ReturnType<typeof vi.fn>
  let onBack: ReturnType<typeof vi.fn>
  let onDismiss: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onNext = vi.fn()
    onBack = vi.fn()
    onDismiss = vi.fn()
  })

  // --- Unit: Renders overlay ---

  it("renders the overlay container", () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={0}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByTestId("spotlight-overlay")).toBeInTheDocument()
  })

  it("renders null when target is null", () => {
    const { container } = render(
      <SpotlightOverlay
        target={null}
        targetRect={null}
        currentIndex={0}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(container.innerHTML).toBe("")
  })

  // --- Unit: Tooltip content ---

  it("displays the target title", () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={0}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByTestId("spotlight-title")).toHaveTextContent("Home Dashboard")
  })

  it("displays the target description", () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={0}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByTestId("spotlight-description")).toHaveTextContent(
      "Your daily overview of everything important."
    )
  })

  it("shows step label", () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={2}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByTestId("spotlight-step-label")).toHaveTextContent("Step 3 of 5")
  })

  // --- Unit: Step dots ---

  it("renders the correct number of step dots", () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={0}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    const dots = screen.getByTestId("spotlight-dots")
    expect(dots.children.length).toBe(5)
  })

  // --- Interaction: Navigation buttons ---

  it("does NOT show Back button on first step", () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={0}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(screen.queryByTestId("spotlight-back-btn")).not.toBeInTheDocument()
  })

  it("shows Back button on non-first steps", () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={1}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByTestId("spotlight-back-btn")).toBeInTheDocument()
  })

  it("calls onNext when Next button is clicked", async () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={0}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    await user.click(screen.getByTestId("spotlight-next-btn"))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it("calls onBack when Back button is clicked", async () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={2}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    await user.click(screen.getByTestId("spotlight-back-btn"))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  // --- Interaction: Last step shows Done ---

  it("shows Done instead of Next on last step", () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={4}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByTestId("spotlight-next-btn")).toHaveTextContent("Done")
  })

  it("calls onDismiss when Done is clicked on last step", async () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={4}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    await user.click(screen.getByTestId("spotlight-next-btn"))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  // --- Unit: Pulse ring ---

  it("renders pulse ring when pulseTarget is true", () => {
    render(
      <SpotlightOverlay
        target={TARGET}
        targetRect={RECT}
        currentIndex={0}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(screen.getByTestId("spotlight-pulse")).toBeInTheDocument()
  })

  it("does not render pulse ring when pulseTarget is false", () => {
    const noPulseTarget = { ...TARGET, pulseTarget: false }
    render(
      <SpotlightOverlay
        target={noPulseTarget}
        targetRect={RECT}
        currentIndex={0}
        totalTargets={5}
        onNext={onNext}
        onBack={onBack}
        onDismiss={onDismiss}
      />
    )
    expect(screen.queryByTestId("spotlight-pulse")).not.toBeInTheDocument()
  })
})
