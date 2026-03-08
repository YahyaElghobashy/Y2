import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { PairingCelebration } from "@/components/onboarding/steps/PairingCelebration"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    h1: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h1 data-testid={props["data-testid"] as string}>{children}</h1>
    ),
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid={props["data-testid"] as string} style={props.style as React.CSSProperties}>
        {children}
      </div>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span data-testid={props["data-testid"] as string}>{children}</span>
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
      <button data-testid={props["data-testid"] as string} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
  },
}))

describe("PairingCelebration", () => {
  let onContinue: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    onContinue = vi.fn().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // --- Unit: Renders names ---

  it("renders the user name", () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )
    expect(screen.getByTestId("celebration-user-name")).toHaveTextContent("Yahya")
  })

  it("renders the partner name", () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )
    expect(screen.getByTestId("celebration-partner-name")).toHaveTextContent("Yara")
  })

  it("renders the celebration container", () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )
    expect(screen.getByTestId("pairing-celebration")).toBeInTheDocument()
  })

  it("renders the heart icon", () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )
    expect(screen.getByTestId("celebration-heart")).toBeInTheDocument()
  })

  it("renders the subtitle", () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )
    expect(screen.getByTestId("celebration-subtitle")).toHaveTextContent("You're connected. This is yours now.")
  })

  // --- Unit: Celebration visual elements ---

  it("renders the names and heart together in celebration", () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )
    // Both names and heart icon are siblings in the celebration container
    expect(screen.getByTestId("celebration-user-name")).toBeInTheDocument()
    expect(screen.getByTestId("celebration-partner-name")).toBeInTheDocument()
    expect(screen.getByTestId("celebration-heart")).toBeInTheDocument()
  })

  // --- Interaction: Button delay ---

  it("does not show continue button initially", () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )
    expect(screen.queryByTestId("celebration-continue-btn")).not.toBeInTheDocument()
  })

  it("shows continue button after 3s delay", async () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByTestId("celebration-continue-btn")).toBeInTheDocument()
  })

  it("button text says Enter Your Space", async () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByTestId("celebration-continue-btn").textContent).toContain("Enter Your Space")
  })

  // --- Interaction: Button click ---

  it("calls onContinue when button is clicked", async () => {
    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={onContinue} />
    )

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    await act(async () => {
      screen.getByTestId("celebration-continue-btn").click()
    })

    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it("prevents double-click on continue button", async () => {
    let resolveOnContinue: () => void
    const slowOnContinue = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveOnContinue = resolve
        })
    )

    render(
      <PairingCelebration userName="Yahya" partnerName="Yara" onContinue={slowOnContinue} />
    )

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    const btn = screen.getByTestId("celebration-continue-btn")

    act(() => {
      btn.click()
    })

    act(() => {
      btn.click()
    })

    expect(slowOnContinue).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveOnContinue!()
    })
  })
})
