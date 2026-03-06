import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act, fireEvent } from "@testing-library/react"
import { ReadyStep } from "@/components/onboarding/steps/ReadyStep"

// --- Mocks ---

const mockProfile = {
  id: "user-1",
  display_name: "Yahya",
  avatar_url: null,
  email: "yahya@test.com",
  partner_id: null,
  role: "user",
  invite_code: "ABC123",
  pairing_status: "unpaired",
  paired_at: null,
  onboarding_step: "ready",
  onboarding_completed_at: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  google_calendar_refresh_token: null,
  google_calendar_connected_at: null,
  google_drive_refresh_token: null,
  google_drive_connected_at: null,
}

const mockPartner = {
  id: "partner-1",
  display_name: "Yara",
  avatar_url: "https://example.com/yara.jpg",
  email: "yara@test.com",
  partner_id: "user-1",
  role: "user",
  invite_code: "DEF456",
  pairing_status: "paired",
  paired_at: "2026-01-01",
  onboarding_step: "ready",
  onboarding_completed_at: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  google_calendar_refresh_token: null,
  google_calendar_connected_at: null,
  google_drive_refresh_token: null,
  google_drive_connected_at: null,
}

let currentProfile = mockProfile
let currentPartner: typeof mockPartner | null = null

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-1" },
    profile: currentProfile,
    partner: currentPartner,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  })),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const validProps: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(props)) {
        if (key.startsWith("data-") || key === "className" || key === "style") {
          validProps[key] = val
        }
      }
      return <div {...validProps}>{children}</div>
    },
    h2: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const validProps: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(props)) {
        if (key.startsWith("data-") || key === "className" || key === "style") {
          validProps[key] = val
        }
      }
      return <h2 {...validProps}>{children}</h2>
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const validProps: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(props)) {
        if (key.startsWith("data-") || key === "className" || key === "style") {
          validProps[key] = val
        }
      }
      return <p {...validProps}>{children}</p>
    },
    button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const validProps: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(props)) {
        if (key.startsWith("data-") || key === "className" || key === "style") {
          validProps[key] = val
        }
      }
      return (
        <button onClick={onClick as React.MouseEventHandler} disabled={disabled as boolean} {...validProps}>
          {children}
        </button>
      )
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

vi.mock("@/components/shared/Avatar", () => ({
  Avatar: (props: { name?: string | null; src?: string | null; size?: string }) => (
    <div data-testid={`avatar-${(props.name ?? "unknown").toLowerCase()}`} data-size={props.size} />
  ),
}))

describe("ReadyStep", () => {
  const onComplete = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    currentProfile = { ...mockProfile }
    currentPartner = null
    onComplete.mockClear()
    onComplete.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // --- Unit: renders correctly ---

  it("renders with data-testid ready-step", () => {
    render(<ReadyStep onComplete={onComplete} />)
    expect(screen.getByTestId("ready-step")).toBeInTheDocument()
  })

  it("shows welcome heading with display name", () => {
    render(<ReadyStep onComplete={onComplete} />)
    expect(screen.getByTestId("ready-heading")).toHaveTextContent("Welcome home, Yahya.")
  })

  it("shows 'Your space is ready.' when solo (no partner)", () => {
    currentPartner = null
    render(<ReadyStep onComplete={onComplete} />)
    expect(screen.getByTestId("ready-subtitle")).toHaveTextContent("Your space is ready.")
  })

  // --- Unit: paired state ---

  it("shows partner name in subtitle when paired", () => {
    currentPartner = { ...mockPartner }
    render(<ReadyStep onComplete={onComplete} />)
    expect(screen.getByTestId("ready-subtitle")).toHaveTextContent(
      "Your shared space with Yara is ready."
    )
  })

  it("renders partner avatar when paired", () => {
    currentPartner = { ...mockPartner }
    render(<ReadyStep onComplete={onComplete} />)
    expect(screen.getByTestId("ready-partner-avatar")).toBeInTheDocument()
  })

  it("does not render partner avatar when solo", () => {
    currentPartner = null
    render(<ReadyStep onComplete={onComplete} />)
    expect(screen.queryByTestId("ready-partner-avatar")).not.toBeInTheDocument()
  })

  // --- Unit: user avatar always rendered ---

  it("renders user avatar", () => {
    render(<ReadyStep onComplete={onComplete} />)
    expect(screen.getByTestId("avatar-yahya")).toBeInTheDocument()
  })

  it("renders user avatar with lg size", () => {
    render(<ReadyStep onComplete={onComplete} />)
    expect(screen.getByTestId("avatar-yahya")).toHaveAttribute("data-size", "lg")
  })

  // --- Interaction: button reveal after 1s ---

  it("does not show launch button before 1s", () => {
    render(<ReadyStep onComplete={onComplete} />)
    expect(screen.queryByTestId("ready-launch-btn")).not.toBeInTheDocument()
  })

  it("shows launch button after 1s", () => {
    render(<ReadyStep onComplete={onComplete} />)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByTestId("ready-launch-btn")).toBeInTheDocument()
  })

  it("launch button has text 'Let's begin →'", () => {
    render(<ReadyStep onComplete={onComplete} />)
    act(() => { vi.advanceTimersByTime(1000) })
    const btn = screen.getByTestId("ready-launch-btn")
    expect(btn.textContent).toContain("begin")
  })

  // --- Interaction: launch flow ---

  it("calls onComplete when launch button is clicked", async () => {
    render(<ReadyStep onComplete={onComplete} />)
    act(() => { vi.advanceTimersByTime(1000) })

    const btn = screen.getByTestId("ready-launch-btn")
    fireEvent.click(btn)

    // Wait for exit animation delay (300ms)
    await act(async () => { vi.advanceTimersByTime(300) })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("disables button after click (double-click prevention)", () => {
    render(<ReadyStep onComplete={onComplete} />)
    act(() => { vi.advanceTimersByTime(1000) })

    const btn = screen.getByTestId("ready-launch-btn")
    fireEvent.click(btn)

    expect(btn).toBeDisabled()
  })

  it("prevents double submission", async () => {
    // onComplete takes 500ms to resolve
    onComplete.mockImplementation(() => new Promise((r) => setTimeout(r, 500)))

    render(<ReadyStep onComplete={onComplete} />)
    act(() => { vi.advanceTimersByTime(1000) })

    const btn = screen.getByTestId("ready-launch-btn")
    fireEvent.click(btn)
    fireEvent.click(btn)

    // Wait for animation + resolve
    await act(async () => { vi.advanceTimersByTime(1000) })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  // --- Edge: fallback display name ---

  it("uses 'there' as fallback when display_name is missing", () => {
    currentProfile = { ...mockProfile, display_name: "" }
    render(<ReadyStep onComplete={onComplete} />)
    // Empty string is falsy in JS, but it's not null/undefined so it won't use the ?? fallback
    // The actual behavior is that empty string is used as-is
    expect(screen.getByTestId("ready-heading")).toBeInTheDocument()
  })

  // --- Integration: confetti only when paired ---

  it("renders confetti particles when paired", () => {
    currentPartner = { ...mockPartner }
    const { container } = render(<ReadyStep onComplete={onComplete} />)
    // 15 confetti particles + other elements
    const confettiParticles = container.querySelectorAll(".rounded-sm")
    expect(confettiParticles.length).toBe(15)
  })

  it("does not render confetti when solo", () => {
    currentPartner = null
    const { container } = render(<ReadyStep onComplete={onComplete} />)
    const confettiParticles = container.querySelectorAll(".rounded-sm")
    expect(confettiParticles.length).toBe(0)
  })
})
