import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProfileStep } from "@/components/onboarding/steps/ProfileStep"

// --- Mocks ---

const mockUpload = vi.fn().mockResolvedValue({ error: null })
const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/avatar.jpg" } })
const mockEq = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: mockFrom,
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

const mockRefreshProfile = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@example.com" },
    profile: { id: "user-1", onboarding_step: "profile" },
    partner: null,
    isLoading: false,
    profileNeedsSetup: true,
    signOut: vi.fn(),
    refreshProfile: mockRefreshProfile,
  }),
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p data-testid={props["data-testid"] as string}>{children}</p>
    ),
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div data-testid={props["data-testid"] as string}>{children}</div>
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
        className={props.className as string}
      >
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

describe("ProfileStep", () => {
  const user = userEvent.setup()
  let onContinue: ReturnType<typeof vi.fn>
  let onBack: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    onContinue = vi.fn().mockResolvedValue(undefined)
    onBack = vi.fn().mockResolvedValue(undefined)
  })

  // --- Unit: Initial render ---

  it("renders the greeting text", () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    expect(screen.getByTestId("profile-greeting")).toHaveTextContent("What should we call you?")
  })

  it("renders the profile-step container", () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    expect(screen.getByTestId("profile-step")).toBeInTheDocument()
  })

  it("renders a name input", () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    expect(screen.getByTestId("profile-name-input")).toBeInTheDocument()
  })

  it("renders a back button", () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    expect(screen.getByTestId("profile-back-btn")).toBeInTheDocument()
  })

  it("renders continue button (disabled initially)", () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    expect(screen.getByTestId("profile-continue-btn")).toBeDisabled()
  })

  // --- Unit: Avatar section hidden until name >= 2 ---

  it("does NOT show avatar section when name is empty", () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    expect(screen.queryByTestId("profile-avatar-section")).not.toBeInTheDocument()
  })

  it("does NOT show avatar section when name is 1 char", async () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    await user.type(screen.getByTestId("profile-name-input"), "A")
    expect(screen.queryByTestId("profile-avatar-section")).not.toBeInTheDocument()
  })

  it("shows avatar section when name has 2+ chars", async () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    await user.type(screen.getByTestId("profile-name-input"), "Ab")
    expect(screen.getByTestId("profile-avatar-section")).toBeInTheDocument()
  })

  // --- Interaction: Continue button activation ---

  it("enables continue button when name >= 2 chars", async () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    await user.type(screen.getByTestId("profile-name-input"), "Yahya")
    expect(screen.getByTestId("profile-continue-btn")).not.toBeDisabled()
  })

  it("disables continue button if name cleared back to < 2 chars", async () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    const input = screen.getByTestId("profile-name-input")
    await user.type(input, "Ab")
    expect(screen.getByTestId("profile-continue-btn")).not.toBeDisabled()

    await user.clear(input)
    expect(screen.getByTestId("profile-continue-btn")).toBeDisabled()
  })

  // --- Interaction: Back button ---

  it("calls onBack when back button clicked", async () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    await user.click(screen.getByTestId("profile-back-btn"))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  // --- Integration: Save to profiles ---

  it("saves name to profiles on continue and calls onContinue", async () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    await user.type(screen.getByTestId("profile-name-input"), "Yahya")

    await act(async () => {
      screen.getByTestId("profile-continue-btn").click()
    })

    expect(mockFrom).toHaveBeenCalledWith("profiles")
    expect(mockUpdate).toHaveBeenCalledWith({ display_name: "Yahya" })
    expect(mockEq).toHaveBeenCalledWith("id", "user-1")
    expect(mockRefreshProfile).toHaveBeenCalled()
    expect(onContinue).toHaveBeenCalled()
  })

  it("trims whitespace from name before saving", async () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    await user.type(screen.getByTestId("profile-name-input"), "  Yahya  ")

    await act(async () => {
      screen.getByTestId("profile-continue-btn").click()
    })

    expect(mockUpdate).toHaveBeenCalledWith({ display_name: "Yahya" })
  })

  // --- Error handling ---

  it("shows error when profile update fails", async () => {
    mockEq.mockResolvedValueOnce({ error: { message: "DB error" } })

    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    await user.type(screen.getByTestId("profile-name-input"), "Yahya")

    await act(async () => {
      screen.getByTestId("profile-continue-btn").click()
    })

    expect(screen.getByTestId("profile-save-error")).toHaveTextContent("Failed to save profile")
    expect(onContinue).not.toHaveBeenCalled()
  })

  // --- File validation ---

  it("shows error for files over 5MB", async () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    await user.type(screen.getByTestId("profile-name-input"), "Yahya")

    const input = screen.getByTestId("profile-avatar-input")
    const bigFile = new File(["x".repeat(6 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" })
    Object.defineProperty(bigFile, "size", { value: 6 * 1024 * 1024 })

    await user.upload(input, bigFile)
    expect(screen.getByTestId("profile-file-error")).toHaveTextContent("Image must be under 5MB")
  })

  // --- Name max length ---

  it("limits name to 50 characters", async () => {
    render(<ProfileStep onContinue={onContinue} onBack={onBack} />)
    const longName = "A".repeat(60)
    await user.type(screen.getByTestId("profile-name-input"), longName)

    const input = screen.getByTestId("profile-name-input") as HTMLInputElement
    expect(input.value.length).toBeLessThanOrEqual(50)
  })
})
