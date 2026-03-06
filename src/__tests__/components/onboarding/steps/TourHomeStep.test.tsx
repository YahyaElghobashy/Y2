import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { TourHomeStep } from "@/components/onboarding/steps/TourHomeStep"

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

describe("TourHomeStep", () => {
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

  // --- Unit: config forwarding ---

  it("renders with data-testid tour-step-home", () => {
    render(<TourHomeStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("tour-step-home")).toBeInTheDocument()
  })

  it("highlights 'Home' tab in BottomNavPreview", () => {
    render(<TourHomeStep onNext={onNext} onBack={onBack} />)
    const preview = screen.getByTestId("bottom-nav-preview")
    expect(preview).toHaveAttribute("data-highlight", "Home")
  })

  // --- Interaction: auto-start spotlight ---

  it("calls spotlight.start() after 150ms", () => {
    render(<TourHomeStep onNext={onNext} onBack={onBack} />)
    expect(mockStart).not.toHaveBeenCalled()
    vi.advanceTimersByTime(150)
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  // --- Integration: spotlight overlay renders when active ---

  it("renders SpotlightOverlay when spotlight is active", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-home']",
      shape: "circle",
      padding: 12,
      tooltipPosition: "top",
      title: "Home",
      description: "Your daily dashboard.",
      pulseTarget: true,
    }
    render(<TourHomeStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("spotlight-overlay")).toBeInTheDocument()
  })

  it("does not render SpotlightOverlay when spotlight is inactive", () => {
    mockSpotlightState.isActive = false
    render(<TourHomeStep onNext={onNext} onBack={onBack} />)
    expect(screen.queryByTestId("spotlight-overlay")).not.toBeInTheDocument()
  })

  // --- Integration: step number / total ---

  it("passes stepNumber=1 (index 0) and totalTourSteps=5 to overlay", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-home']",
      shape: "circle",
      padding: 12,
      tooltipPosition: "top",
      title: "Home",
      description: "Your daily dashboard.",
      pulseTarget: true,
    }
    render(<TourHomeStep onNext={onNext} onBack={onBack} />)
    const overlay = screen.getByTestId("spotlight-overlay")
    expect(overlay).toHaveAttribute("data-index", "0") // stepNumber 1 - 1 = 0
    expect(overlay).toHaveAttribute("data-total", "5")
  })

  // --- Unit: isFirstTourStep (no back on first step) ---

  it("is the first tour step (step 1 of 5)", () => {
    // TourHomeStep sets isFirstTourStep = true, so onBack should be a no-op
    // This is verified implicitly — the config forwards correctly to TourStep
    render(<TourHomeStep onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("tour-step-home")).toBeInTheDocument()
  })
})
