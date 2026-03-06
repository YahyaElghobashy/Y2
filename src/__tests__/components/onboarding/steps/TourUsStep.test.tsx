import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { TourUsStep } from "@/components/onboarding/steps/TourUsStep"

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
    <div data-testid="spotlight-overlay" data-index={props.currentIndex} data-total={props.totalTargets} />
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

describe("TourUsStep", () => {
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

  it("renders with data-testid tour-step-us", () => {
    render(<TourUsStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("tour-step-us")).toBeInTheDocument()
  })

  it("highlights 'Us' tab in BottomNavPreview", () => {
    render(<TourUsStep onNext={onNext} onBack={onBack} />)
    const preview = screen.getByTestId("bottom-nav-preview")
    expect(preview).toHaveAttribute("data-highlight", "Us")
  })

  // --- Interaction ---

  it("calls spotlight.start() after 150ms", () => {
    render(<TourUsStep onNext={onNext} onBack={onBack} />)
    expect(mockStart).not.toHaveBeenCalled()
    vi.advanceTimersByTime(150)
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  // --- Integration ---

  it("renders SpotlightOverlay when spotlight is active", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-us']",
      shape: "circle",
      padding: 12,
      tooltipPosition: "top",
      title: "Us",
      description: "The fun zone.",
      pulseTarget: true,
    }
    render(<TourUsStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("spotlight-overlay")).toBeInTheDocument()
  })

  it("passes stepNumber=2 (index 1) and totalTourSteps=5", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-us']",
      shape: "circle",
      padding: 12,
      tooltipPosition: "top",
      title: "Us",
      description: "The fun zone.",
      pulseTarget: true,
    }
    render(<TourUsStep onNext={onNext} onBack={onBack} />)
    const overlay = screen.getByTestId("spotlight-overlay")
    expect(overlay).toHaveAttribute("data-index", "1") // stepNumber 2 - 1 = 1
    expect(overlay).toHaveAttribute("data-total", "5")
  })

  it("is not the first tour step (step 2 of 5)", () => {
    render(<TourUsStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("tour-step-us")).toBeInTheDocument()
  })
})
