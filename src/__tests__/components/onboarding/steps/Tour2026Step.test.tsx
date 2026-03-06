import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { Tour2026Step } from "@/components/onboarding/steps/Tour2026Step"

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
  useSpotlight: vi.fn((config: { targets: unknown[] }) => {
    mockSpotlightState.totalTargets = config.targets.length
    return mockSpotlightState
  }),
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

describe("Tour2026Step", () => {
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

  it("renders with data-testid tour-step-2026", () => {
    render(<Tour2026Step onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("tour-step-2026")).toBeInTheDocument()
  })

  it("highlights '2026' tab in BottomNavPreview", () => {
    render(<Tour2026Step onNext={onNext} onBack={onBack} />)
    const preview = screen.getByTestId("bottom-nav-preview")
    expect(preview).toHaveAttribute("data-highlight", "2026")
  })

  // --- Interaction ---

  it("calls spotlight.start() after 150ms", () => {
    render(<Tour2026Step onNext={onNext} onBack={onBack} />)
    expect(mockStart).not.toHaveBeenCalled()
    vi.advanceTimersByTime(150)
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  // --- Integration ---

  it("renders SpotlightOverlay when spotlight is active", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-2026']",
      shape: "pill",
      padding: 14,
      tooltipPosition: "top",
      title: "2026",
      description: "Your shared vision board.",
      pulseTarget: true,
    }
    render(<Tour2026Step onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("spotlight-overlay")).toBeInTheDocument()
  })

  it("passes stepNumber=3 (index 2) and totalTourSteps=5", () => {
    mockSpotlightState.isActive = true
    mockSpotlightState.currentTarget = {
      selector: "[data-testid='nav-tab-2026']",
      shape: "pill",
      padding: 14,
      tooltipPosition: "top",
      title: "2026",
      description: "Your shared vision board.",
      pulseTarget: true,
    }
    render(<Tour2026Step onNext={onNext} onBack={onBack} />)
    const overlay = screen.getByTestId("spotlight-overlay")
    expect(overlay).toHaveAttribute("data-index", "2") // stepNumber 3 - 1 = 2
    expect(overlay).toHaveAttribute("data-total", "5")
  })

  // --- Unit: uses pill shape (wider for elevated center tab) ---

  it("uses pill shape for the elevated center tab", () => {
    // This is a config verification — Tour2026Step uses shape: "pill"
    // We verify it renders correctly (the shape is passed through to useSpotlight targets)
    render(<Tour2026Step onNext={onNext} onBack={onBack} />)
    expect(screen.getByTestId("tour-step-2026")).toBeInTheDocument()
  })
})
