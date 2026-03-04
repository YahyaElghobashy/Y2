import React from "react"
import { render, screen, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { ChallengeWinAnimation } from "@/components/challenges/ChallengeWinAnimation"

describe("ChallengeWinAnimation", () => {
  const defaultProps = {
    open: true,
    isWinner: true,
    amount: 40,
    onComplete: vi.fn(),
  }

  let matchMediaSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    matchMediaSpy = vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList)
  })

  afterEach(() => {
    vi.useRealTimers()
    matchMediaSpy.mockRestore()
  })

  // ── Unit Tests ──────────────────────────────────────────

  it("renders overlay when open", () => {
    render(<ChallengeWinAnimation {...defaultProps} />)
    expect(screen.getByTestId("win-animation-overlay")).toBeTruthy()
  })

  it("does not render when open=false", () => {
    render(<ChallengeWinAnimation {...defaultProps} open={false} />)
    expect(screen.queryByTestId("win-animation-overlay")).toBeNull()
  })

  it("renders winner state with trophy icon", () => {
    render(<ChallengeWinAnimation {...defaultProps} />)
    expect(screen.getByTestId("winner-icon")).toBeTruthy()
    expect(screen.getByTestId("win-title")).toBeTruthy()
    expect(screen.getByText("You Won!")).toBeTruthy()
  })

  it("renders win amount display", () => {
    render(<ChallengeWinAnimation {...defaultProps} />)
    expect(screen.getByTestId("win-amount")).toBeTruthy()
    expect(screen.getByTestId("win-counter")).toBeTruthy()
  })

  it("renders loser state with frown icon", () => {
    render(<ChallengeWinAnimation {...defaultProps} isWinner={false} />)
    expect(screen.getByTestId("loser-icon")).toBeTruthy()
    expect(screen.getByTestId("lose-title")).toBeTruthy()
    expect(screen.getByText("Better luck next time")).toBeTruthy()
  })

  it("shows negative amount for loser", () => {
    render(<ChallengeWinAnimation {...defaultProps} isWinner={false} amount={20} />)
    const amountEl = screen.getByTestId("lose-amount")
    expect(amountEl.textContent).toContain("-20")
  })

  it("renders confetti particles for winner", () => {
    render(<ChallengeWinAnimation {...defaultProps} />)
    expect(screen.getByTestId("confetti-container")).toBeTruthy()
    const particles = screen.getAllByTestId("confetti-particle")
    expect(particles).toHaveLength(20)
  })

  it("does not render confetti for loser", () => {
    render(<ChallengeWinAnimation {...defaultProps} isWinner={false} />)
    expect(screen.queryByTestId("confetti-container")).toBeNull()
  })

  // ── Interaction Tests ───────────────────────────────────

  it("calls onComplete after animation duration", () => {
    render(<ChallengeWinAnimation {...defaultProps} />)

    expect(defaultProps.onComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(2400)
    })

    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1)
  })

  it("does not call onComplete before animation ends", () => {
    render(<ChallengeWinAnimation {...defaultProps} />)

    vi.advanceTimersByTime(1000)

    expect(defaultProps.onComplete).not.toHaveBeenCalled()
  })

  it("cleans up timer on unmount", () => {
    const { unmount } = render(<ChallengeWinAnimation {...defaultProps} />)
    unmount()

    vi.advanceTimersByTime(3000)

    expect(defaultProps.onComplete).not.toHaveBeenCalled()
  })

  it("calls onComplete for loser animation too", () => {
    const onComplete = vi.fn()
    render(
      <ChallengeWinAnimation
        open={true}
        isWinner={false}
        amount={20}
        onComplete={onComplete}
      />
    )

    act(() => {
      vi.advanceTimersByTime(2400)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  // ── Reduced Motion Tests ──────────────────────────────

  it("skips confetti when prefers-reduced-motion is set", () => {
    matchMediaSpy.mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList)

    render(<ChallengeWinAnimation {...defaultProps} />)
    expect(screen.queryByTestId("confetti-container")).toBeNull()
    // But still shows winner content
    expect(screen.getByTestId("win-title")).toBeTruthy()
    expect(screen.getByTestId("win-amount")).toBeTruthy()
  })

  it("calls onComplete faster with reduced motion", () => {
    matchMediaSpy.mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList)

    const onComplete = vi.fn()
    render(
      <ChallengeWinAnimation
        open={true}
        isWinner={true}
        amount={40}
        onComplete={onComplete}
      />
    )

    // Should complete at 800ms (not 2400ms)
    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  // ── Integration Tests ─────────────────────────────────

  it("shows + prefix for winner amount", () => {
    render(<ChallengeWinAnimation {...defaultProps} />)
    const amountEl = screen.getByTestId("win-amount")
    expect(amountEl.textContent).toContain("+")
  })

  it("shows - prefix for loser amount", () => {
    render(<ChallengeWinAnimation {...defaultProps} isWinner={false} amount={30} />)
    const amountEl = screen.getByTestId("lose-amount")
    expect(amountEl.textContent).toContain("-30")
  })
})
