import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { TourStep, type TourStepConfig } from "@/components/onboarding/steps/TourStep"

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
    <div data-testid="spotlight-overlay" data-index={props.currentIndex} data-total={props.totalTargets}>
      {props.lastButtonText && <span data-testid="last-btn-text">{String(props.lastButtonText)}</span>}
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

// --- Config ---

const BASE_CONFIG: TourStepConfig = {
  tabLabel: "Home",
  selector: "[data-testid='nav-tab-home']",
  shape: "circle",
  padding: 12,
  tooltipPosition: "top",
  title: "Home",
  description: "Your daily dashboard.",
  pulseTarget: true,
  stepNumber: 1,
  totalTourSteps: 5,
  isFirstTourStep: true,
  isLastTourStep: false,
}

describe("TourStep", () => {
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

  it("renders BottomNavPreview with correct highlightLabel", () => {
    render(<TourStep config={BASE_CONFIG} onNext={onNext} onBack={onBack} />)
    const preview = screen.getByTestId("bottom-nav-preview")
    expect(preview).toHaveAttribute("data-highlight", "Home")
  })

  it("has correct data-testid for the tour step", () => {
    render(<TourStep config={BASE_CONFIG} onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("tour-step-home")).toBeInTheDocument()
  })

  // --- Interaction: auto-start spotlight ---

  it("calls spotlight.start() after 150ms", () => {
    render(<TourStep config={BASE_CONFIG} onNext={onNext} onBack={onBack} />)
    expect(mockStart).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(150) })
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  // --- Interaction: spotlight active renders overlay ---

  it("renders SpotlightOverlay when spotlight is active", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: BASE_CONFIG.selector,
      shape: BASE_CONFIG.shape,
      padding: BASE_CONFIG.padding,
      tooltipPosition: BASE_CONFIG.tooltipPosition,
      title: BASE_CONFIG.title,
      description: BASE_CONFIG.description,
      pulseTarget: BASE_CONFIG.pulseTarget,
    }
    render(<TourStep config={BASE_CONFIG} onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("spotlight-overlay")).toBeInTheDocument()
  })

  it("does not render SpotlightOverlay when spotlight is inactive", () => {
    mockSpotlightState.isActive = false
    render(<TourStep config={BASE_CONFIG} onNext={onNext} onBack={onBack} />)
    expect(screen.queryByTestId("spotlight-overlay")).not.toBeInTheDocument()
  })

  // --- Interaction: step number passes through ---

  it("passes correct currentIndex to SpotlightOverlay", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = { selector: "", shape: "circle", padding: 0, tooltipPosition: "top", title: "", description: "", pulseTarget: true }
    render(<TourStep config={{ ...BASE_CONFIG, stepNumber: 3 }} onNext={onNext} onBack={onBack} />)
    const overlay = screen.getByTestId("spotlight-overlay")
    expect(overlay).toHaveAttribute("data-index", "2") // stepNumber - 1
  })

  // --- Integration: lastButtonText forwarded ---

  it("forwards lastButtonText to SpotlightOverlay", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = { selector: "", shape: "circle", padding: 0, tooltipPosition: "top", title: "", description: "", pulseTarget: false }
    render(
      <TourStep
        config={{ ...BASE_CONFIG, lastButtonText: "Finish Tour →", isLastTourStep: true }}
        onNext={onNext}
        onBack={onBack}
      />
    )
    expect(screen.getByTestId("last-btn-text")).toHaveTextContent("Finish Tour →")
  })
})
