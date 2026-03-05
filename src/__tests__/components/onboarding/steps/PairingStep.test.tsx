import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PairingStep } from "@/components/onboarding/steps/PairingStep"

// --- Mocks ---

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}
const mockRemoveChannel = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    channel: () => mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}))

let mockProfile: Record<string, unknown> = {
  id: "user-1",
  display_name: "Yahya",
  invite_code: "ABC123",
  pairing_status: "unpaired",
}

let mockPartner: Record<string, unknown> | null = null

const mockRefreshProfile = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: mockProfile,
    partner: mockPartner,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: mockRefreshProfile,
  }),
}))

// Mock pairing components
vi.mock("@/components/pairing/InviteCodeDisplay", () => ({
  InviteCodeDisplay: ({ code }: { code: string | null }) => (
    <div data-testid="invite-code-display">{code}</div>
  ),
}))

vi.mock("@/components/pairing/QRCodeDisplay", () => ({
  QRCodeDisplay: ({ code }: { code: string | null }) => (
    <div data-testid="qr-code-display">{code}</div>
  ),
}))

vi.mock("@/components/pairing/PairPartnerForm", () => ({
  PairPartnerForm: ({ onPaired }: { onPaired: () => void }) => (
    <button data-testid="pair-form" onClick={onPaired}>
      Pair
    </button>
  ),
}))

// Mock celebration
vi.mock("@/components/onboarding/steps/PairingCelebration", () => ({
  PairingCelebration: ({
    userName,
    partnerName,
    onContinue,
  }: {
    userName: string
    partnerName: string
    onContinue: () => void
  }) => (
    <div data-testid="pairing-celebration">
      <span data-testid="celeb-user">{userName}</span>
      <span data-testid="celeb-partner">{partnerName}</span>
      <button data-testid="celeb-continue" onClick={onContinue}>
        Continue
      </button>
    </div>
  ),
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div>{children}</div>
    ),
    button: ({
      children,
      onClick,
      ...props
    }: React.PropsWithChildren<{ onClick?: () => void; [key: string]: unknown }>) => (
      <button data-testid={props["data-testid"] as string} onClick={onClick}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

describe("PairingStep", () => {
  const user = userEvent.setup()
  let onContinue: ReturnType<typeof vi.fn>
  let onSkip: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    onContinue = vi.fn().mockResolvedValue(undefined)
    onSkip = vi.fn().mockResolvedValue(undefined)
    mockProfile = {
      id: "user-1",
      display_name: "Yahya",
      invite_code: "ABC123",
      pairing_status: "unpaired",
    }
    mockPartner = null
  })

  // --- Unit: Renders unpaired state ---

  it("renders the pairing step container", () => {
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    expect(screen.getByTestId("pairing-step")).toBeInTheDocument()
  })

  it("renders heading text", () => {
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    expect(screen.getByTestId("pairing-heading")).toHaveTextContent("Find your partner")
  })

  it("renders the invite code display", () => {
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    expect(screen.getByTestId("invite-code-display")).toHaveTextContent("ABC123")
  })

  it("renders the QR code display", () => {
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    expect(screen.getByTestId("qr-code-display")).toHaveTextContent("ABC123")
  })

  it("renders the pair partner form", () => {
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    expect(screen.getByTestId("pair-form")).toBeInTheDocument()
  })

  it("renders the continue-alone skip button", () => {
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    expect(screen.getByTestId("pairing-skip-btn")).toBeInTheDocument()
  })

  // --- Interaction: Skip button ---

  it("calls onSkip when continue alone is clicked", async () => {
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    await user.click(screen.getByTestId("pairing-skip-btn"))
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  // --- Interaction: Manual pairing ---

  it("transitions to celebration when PairPartnerForm reports paired", async () => {
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    await user.click(screen.getByTestId("pair-form"))

    expect(mockRefreshProfile).toHaveBeenCalled()
    expect(screen.getByTestId("pairing-celebration")).toBeInTheDocument()
  })

  // --- Integration: Realtime subscription ---

  it("sets up a realtime subscription on mount", () => {
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: "id=eq.user-1",
      }),
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it("cleans up realtime subscription on unmount", () => {
    const { unmount } = render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  // --- State: Already paired ---

  it("shows celebration if already paired", () => {
    mockProfile.pairing_status = "paired"
    mockPartner = { display_name: "Yara" }
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    expect(screen.getByTestId("pairing-celebration")).toBeInTheDocument()
  })

  // --- Celebration: user/partner names ---

  it("passes correct names to celebration", () => {
    mockProfile.pairing_status = "paired"
    mockPartner = { display_name: "Yara" }
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    expect(screen.getByTestId("celeb-user")).toHaveTextContent("Yahya")
    expect(screen.getByTestId("celeb-partner")).toHaveTextContent("Yara")
  })

  // --- Celebration: continue ---

  it("calls onContinue from celebration", async () => {
    mockProfile.pairing_status = "paired"
    mockPartner = { display_name: "Yara" }
    render(<PairingStep onContinue={onContinue} onSkip={onSkip} />)
    await user.click(screen.getByTestId("celeb-continue"))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
