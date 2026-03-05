import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSpotlight, type SpotlightTarget } from "@/lib/hooks/use-spotlight"

// --- jsdom polyfills ---

class MockResizeObserver {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", MockResizeObserver)

// scrollIntoView not available in jsdom
Element.prototype.scrollIntoView = vi.fn()

// --- Setup ---

const TARGETS: SpotlightTarget[] = [
  {
    selector: "#home-tab",
    shape: "circle",
    padding: 12,
    tooltipPosition: "top",
    title: "Home",
    description: "Your daily dashboard.",
    pulseTarget: true,
  },
  {
    selector: "#us-tab",
    shape: "circle",
    padding: 12,
    tooltipPosition: "top",
    title: "Us",
    description: "The relationship zone.",
    pulseTarget: true,
  },
  {
    selector: "#more-tab",
    shape: "circle",
    padding: 12,
    tooltipPosition: "top",
    title: "More",
    description: "Settings and preferences.",
    pulseTarget: false,
  },
]

describe("useSpotlight", () => {
  let onComplete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onComplete = vi.fn()
    // Mock DOM methods
    vi.spyOn(document, "querySelector").mockReturnValue(null)
    vi.spyOn(document.body.style, "overflow", "set")
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- Unit: Initial state ---

  it("starts inactive", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )
    expect(result.current.isActive).toBe(false)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentTarget).toBeNull()
    expect(result.current.targetRect).toBeNull()
  })

  it("reports correct total targets", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )
    expect(result.current.totalTargets).toBe(3)
  })

  // --- Interaction: start ---

  it("activates on start()", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentTarget).toEqual(TARGETS[0])
  })

  // --- Interaction: next ---

  it("advances to next target on next()", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => result.current.start())
    act(() => result.current.next())

    expect(result.current.currentIndex).toBe(1)
    expect(result.current.currentTarget).toEqual(TARGETS[1])
  })

  it("calls onComplete and deactivates when next() passes last target", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => result.current.start())
    act(() => result.current.next()) // 0 -> 1
    act(() => result.current.next()) // 1 -> 2
    act(() => result.current.next()) // 2 -> complete

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(result.current.isActive).toBe(false)
  })

  // --- Interaction: back ---

  it("goes back to previous target on back()", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => result.current.start())
    act(() => result.current.next()) // 0 -> 1
    act(() => result.current.back()) // 1 -> 0

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentTarget).toEqual(TARGETS[0])
  })

  it("does not go below 0 on back()", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => result.current.start())
    act(() => result.current.back()) // already at 0

    expect(result.current.currentIndex).toBe(0)
  })

  // --- Interaction: dismiss ---

  it("deactivates and calls onComplete on dismiss()", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => result.current.start())
    act(() => result.current.dismiss())

    expect(result.current.isActive).toBe(false)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  // --- Integration: Scroll lock ---

  it("sets body overflow to hidden when active", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => result.current.start())

    expect(document.body.style.overflow).toBe("hidden")
  })

  it("restores body overflow on deactivate", () => {
    document.body.style.overflow = "auto"

    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => result.current.start())
    expect(document.body.style.overflow).toBe("hidden")

    act(() => result.current.dismiss())
    expect(document.body.style.overflow).toBe("auto")
  })

  // --- Edge: Empty targets ---

  it("handles empty targets array", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: [], onComplete })
    )

    act(() => result.current.start())
    // Calling next immediately completes since there are no targets
    act(() => result.current.next())

    expect(onComplete).toHaveBeenCalled()
  })

  // --- Integration: querySelector called ---

  it("queries DOM for target element when active", () => {
    vi.useFakeTimers()
    const mockEl = document.createElement("div")
    vi.spyOn(document, "querySelector").mockReturnValue(mockEl)
    vi.spyOn(mockEl, "getBoundingClientRect").mockReturnValue({
      x: 100, y: 200, width: 50, height: 50,
      top: 200, left: 100, right: 150, bottom: 250,
      toJSON: () => ({}),
    })

    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => result.current.start())
    // updateRect is called via setTimeout(100)
    act(() => { vi.advanceTimersByTime(150) })

    expect(document.querySelector).toHaveBeenCalledWith("#home-tab")
    vi.useRealTimers()
  })

  // --- start resets to index 0 ---

  it("resets to index 0 on start()", () => {
    const { result } = renderHook(() =>
      useSpotlight({ targets: TARGETS, onComplete })
    )

    act(() => result.current.start())
    act(() => result.current.next())
    act(() => result.current.next())
    act(() => result.current.dismiss())

    // Start again
    act(() => result.current.start())
    expect(result.current.currentIndex).toBe(0)
  })
})
