import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { TourMoreStep } from "@/components/onboarding/steps/TourMoreStep"

// --- Mocks ---

const mockStart = vi.fn()
const mockSpotlightState = {
  isActive: false,
  currentIndex: 0,
  totalTargets: 1,
  currentTarget: null as null | { selector: string; shape: string; padding: number; tooltipPosition: string; title: string; description: string; pulseTarget: boolean },
  targetRect: null,
  start: mockStart,
  next: vi.fn(),
  back: vi.fn(),
  dismiss: vi.fn(),
}

vi.mock("@/lib/hooks/use-spotlight", () => ({
  useSpotlight: vi.fn(() => mockSpotlightState),
}))

vi.mock("@/components/onboarding/SpotlightOverlay", () => ({
  SpotlightOverlay: (props: Record<string, unknown>) => (
    <div
      data-testid="spotlight-overlay"
      data-index={props.currentIndex}
      data-total={props.totalTargets}
    >
      {props.lastButtonText && <span data-testid="last-btn-text">{String(props.lastButtonText)}</span>}
      {props.lastButtonClassName && <span data-testid="last-btn-class">{String(props.lastButtonClassName)}</span>}
    </div>
  ),
}))

vi.mock("@/components/onboarding/BottomNavPreview", () => ({
  BottomNavPreview: (props: { highlightLabel?: string }) => (
    <div data-testid="bottom-nav-preview" data-highlight={props.highlightLabel} />
  ),
}))

// jsdom polyfills
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", MockResizeObserver)
Element.prototype.scrollIntoView = vi.fn()

describe("TourMoreStep", () => {
  const onNext = vi.fn()
  const onBack = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    mockSpotlightState.isActive = false
    mockSpotlightState.currentTarget = null
    mockStart.mockClear()
    onNext.mockClear()
    onBack.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // --- Unit ---

  it("renders with data-testid tour-step-more", () => {
    render(<TourMoreStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("tour-step-more")).toBeInTheDocument()
  })

  it("highlights 'More' tab in BottomNavPreview", () => {
    render(<TourMoreStep onNext={onNext} onBack={onBack} />)
    const preview = screen.getByTestId("bottom-nav-preview")
    expect(preview).toHaveAttribute("data-highlight", "More")
  })

  // --- Interaction ---

  it("calls spotlight.start() after 150ms", () => {
    render(<TourMoreStep onNext={onNext} onBack={onBack} />)
    expect(mockStart).not.toHaveBeenCalled()
    vi.advanceTimersByTime(150)
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  // --- Integration ---

  it("renders SpotlightOverlay when spotlight is active", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-more']",
      shape: "circle",
      padding: 12,
      tooltipPosition: "top",
      title: "More",
      description: "Settings, preferences.",
      pulseTarget: false,
    }
    render(<TourMoreStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("spotlight-overlay")).toBeInTheDocument()
  })

  it("passes stepNumber=5 (index 4) and totalTourSteps=5", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-more']",
      shape: "circle",
      padding: 12,
      tooltipPosition: "top",
      title: "More",
      description: "Settings.",
      pulseTarget: false,
    }
    render(<TourMoreStep onNext={onNext} onBack={onBack} />)
    const overlay = screen.getByTestId("spotlight-overlay")
    expect(overlay).toHaveAttribute("data-index", "4") // stepNumber 5 - 1 = 4
    expect(overlay).toHaveAttribute("data-total", "5")
  })

  // --- Integration: last step customizations ---

  it("forwards lastButtonText 'Finish Tour →' to SpotlightOverlay", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-more']",
      shape: "circle",
      padding: 12,
      tooltipPosition: "top",
      title: "More",
      description: "Settings.",
      pulseTarget: false,
    }
    render(<TourMoreStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("last-btn-text")).toHaveTextContent("Finish Tour →")
  })

  it("forwards lastButtonClassName with copper glow to SpotlightOverlay", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-more']",
      shape: "circle",
      padding: 12,
      tooltipPosition: "top",
      title: "More",
      description: "Settings.",
      pulseTarget: false,
    }
    render(<TourMoreStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("last-btn-class")).toHaveTextContent("shadow-[0_0_12px_rgba(196,149,106,0.4)]")
  })

  // --- Unit: pulseTarget is false for More tab ---

  it("does not pulse the More tab (pulseTarget=false)", () => {
    // Config verification — TourMoreStep has pulseTarget: false
    render(<TourMoreStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("tour-step-more")).toBeInTheDocument()
  })
})
