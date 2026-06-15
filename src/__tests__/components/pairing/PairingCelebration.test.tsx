import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PairingCelebration } from "@/components/pairing/PairingCelebration"

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe("PairingCelebration", () => {
  let onDone: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onDone = vi.fn()
    setMatchMedia(false)
    // Neutralize the entrance rAF so no async state updates escape act().
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0 as unknown as number)
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Unit ────────────────────────────────────────────────
  it("renders both names and the Enter Hayah action", () => {
    render(<PairingCelebration nameA="Yahya" nameB="Yara" onDone={onDone} />)
    expect(screen.getByText("Yahya")).toBeInTheDocument()
    expect(screen.getByText("Yara")).toBeInTheDocument()
    expect(screen.getByTestId("enter-hayah-btn")).toBeInTheDocument()
  })

  it("defaults to the seal variant paper", () => {
    render(<PairingCelebration nameA="A" nameB="B" onDone={onDone} />)
    expect(screen.getByRole("dialog").getAttribute("style")).toContain("#F6E0BF")
  })

  it("applies the requested variant", () => {
    render(<PairingCelebration variant="girih" nameA="A" nameB="B" onDone={onDone} />)
    expect(screen.getByRole("dialog").getAttribute("style")).toContain("#FCDDAA")
  })

  // ── Interaction ─────────────────────────────────────────
  it("fires onDone when Enter Hayah is tapped", () => {
    render(<PairingCelebration nameA="A" nameB="B" onDone={onDone} />)
    fireEvent.click(screen.getByTestId("enter-hayah-btn"))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("first stage tap skips the animation, the second tap exits", () => {
    render(<PairingCelebration nameA="A" nameB="B" onDone={onDone} />)
    const dialog = screen.getByRole("dialog")

    fireEvent.click(dialog) // not yet revealed → skip to the end
    expect(onDone).not.toHaveBeenCalled()

    fireEvent.click(dialog) // revealed → exit
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  // ── Accessibility: reduced motion ───────────────────────
  it("reveals immediately under prefers-reduced-motion (single tap exits)", () => {
    setMatchMedia(true)
    render(<PairingCelebration nameA="A" nameB="B" onDone={onDone} />)

    fireEvent.click(screen.getByRole("dialog"))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("stays clean on mount/unmount when audio is unavailable", () => {
    // jsdom has no AudioContext; playSound must no-op and cleanup must not throw.
    const { unmount } = render(
      <PairingCelebration nameA="A" nameB="B" onDone={onDone} sound />
    )
    expect(() => unmount()).not.toThrow()
  })
})
