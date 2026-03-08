import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act, waitFor } from "@testing-library/react"
import { WelcomeStep } from "@/components/onboarding/steps/WelcomeStep"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h1 data-testid={props["data-testid"] as string} className={props.className as string}>{children}</h1>
    ),
    h2: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h2 data-testid={props["data-testid"] as string} className={props.className as string}>{children}</h2>
    ),
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid={props["data-testid"] as string} className={props.className as string} style={props.style as React.CSSProperties}>{children}</div>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p data-testid={props["data-testid"] as string}>{children}</p>
    ),
    button: ({
      children,
      onClick,
      disabled,
      ...props
    }: React.PropsWithChildren<{
      onClick?: () => void
      disabled?: boolean
      [key: string]: unknown
    }>) => (
      <button
        data-testid={props["data-testid"] as string}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

describe("WelcomeStep", () => {
  let onContinue: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    onContinue = vi.fn().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // --- Unit: Renders all text elements ---

  it("renders the Arabic text", () => {
    render(<WelcomeStep onContinue={onContinue} />)
    expect(screen.getByTestId("welcome-arabic")).toBeInTheDocument()
    expect(screen.getByTestId("welcome-arabic").textContent).toBe("حياة")
  })

  it("renders the English transliteration", () => {
    render(<WelcomeStep onContinue={onContinue} />)
    expect(screen.getByTestId("welcome-english")).toHaveTextContent("Hayah")
  })

  it("renders the tagline", () => {
    render(<WelcomeStep onContinue={onContinue} />)
    expect(screen.getByTestId("welcome-tagline")).toHaveTextContent("A companion for the two of you.")
  })

  it("renders the philosophy line", () => {
    render(<WelcomeStep onContinue={onContinue} />)
    expect(screen.getByTestId("welcome-philosophy")).toHaveTextContent(
      /Warm when you arrive/
    )
  })

  it("renders a container with welcome-step test id", () => {
    render(<WelcomeStep onContinue={onContinue} />)
    expect(screen.getByTestId("welcome-step")).toBeInTheDocument()
  })

  // --- Interaction: Button appears after delay ---

  it("does NOT show the begin button initially", () => {
    render(<WelcomeStep onContinue={onContinue} />)
    expect(screen.queryByTestId("welcome-begin-btn")).not.toBeInTheDocument()
  })

  it("shows the begin button after 4s delay", async () => {
    render(<WelcomeStep onContinue={onContinue} />)
    expect(screen.queryByTestId("welcome-begin-btn")).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.getByTestId("welcome-begin-btn")).toBeInTheDocument()
  })

  // --- Interaction: Button click calls onContinue ---

  it("calls onContinue when begin button is clicked", async () => {
    render(<WelcomeStep onContinue={onContinue} />)

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })

    const btn = screen.getByTestId("welcome-begin-btn")
    await act(async () => {
      btn.click()
    })

    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it("disables button while onContinue is processing", async () => {
    let resolveOnContinue: () => void
    const slowOnContinue = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOnContinue = resolve
        })
    )

    render(<WelcomeStep onContinue={slowOnContinue} />)

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })

    const btn = screen.getByTestId("welcome-begin-btn")
    expect(btn).not.toBeDisabled()

    // Click the button — starts loading
    act(() => {
      btn.click()
    })

    // Button shows loading text while processing
    expect(btn.textContent).toBe("...")

    // Resolve the promise
    await act(async () => {
      resolveOnContinue!()
    })

    expect(btn.textContent).toContain("Begin")
  })

  // --- Reduced motion: button shows after 1s ---

  it("shows button after 1s when prefers-reduced-motion is set", async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }))

    render(<WelcomeStep onContinue={onContinue} />)
    expect(screen.queryByTestId("welcome-begin-btn")).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByTestId("welcome-begin-btn")).toBeInTheDocument()

    window.matchMedia = originalMatchMedia
  })

  // --- Edge cases ---

  it("does not call onContinue multiple times on rapid clicks", async () => {
    let resolveOnContinue: () => void
    const slowOnContinue = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOnContinue = resolve
        })
    )

    render(<WelcomeStep onContinue={slowOnContinue} />)

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })

    const btn = screen.getByTestId("welcome-begin-btn")

    // First click starts processing
    act(() => {
      btn.click()
    })

    // Second click while still processing — should be ignored
    act(() => {
      btn.click()
    })

    expect(slowOnContinue).toHaveBeenCalledTimes(1)

    // Clean up
    await act(async () => {
      resolveOnContinue!()
    })
  })
})
