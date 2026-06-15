import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Hoisted mocks ─────────────────────────────────────────
const mockReplace = vi.fn()
const mockUser = { id: "user-1", email: "test@test.com" }

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    profile: {
      id: "user-1",
      display_name: "Test User",
      pairing_status: "unpaired",
      invite_code: "ABC123",
    },
    partner: null,
    isLoading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
    profileNeedsSetup: false,
  })),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/pair",
}))

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const htmlProps = Object.fromEntries(
        Object.entries(props).filter(([k]) =>
          /^[a-z]/.test(k) || k.startsWith("data-") || k === "className" || k === "style" || k === "role"
        )
      )
      return <div {...htmlProps}>{children}</div>
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const htmlProps = Object.fromEntries(
        Object.entries(props).filter(([k]) =>
          /^[a-z]/.test(k) || k.startsWith("data-") || k === "className" || k === "style"
        )
      )
      return <p {...htmlProps}>{children}</p>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      const htmlProps = Object.fromEntries(
        Object.entries(rest).filter(([k]) =>
          /^[a-z]/.test(k) || k.startsWith("data-") || k === "className" || k === "style" || k === "role" || k === "onClick" || k === "type" || k === "disabled"
        )
      )
      return <button {...htmlProps}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

// Mock child components that have complex dependencies (QR code, camera APIs)
vi.mock("@/components/pairing/QRCodeDisplay", () => ({
  QRCodeDisplay: ({ code }: { code: string | null }) => (
    <div data-testid="qr-code-display">
      <p data-testid="invite-code">{code}</p>
    </div>
  ),
}))

vi.mock("@/components/pairing/QRCodeScanner", () => ({
  QRCodeScanner: ({ onScan }: { onScan: (code: string) => void }) => (
    <button data-testid="qr-scanner" onClick={() => onScan("SCANNED")}>
      Scan QR Code
    </button>
  ),
}))

vi.mock("@/components/pairing/PairPartnerForm", () => ({
  PairPartnerForm: ({ onPaired }: { onPaired: (partnerName: string) => void }) => (
    <div data-testid="pair-partner-form">
      <input data-testid="pair-code-input" />
      <button data-testid="pair-submit-btn" onClick={() => onPaired("Yara")}>
        Submit
      </button>
    </div>
  ),
}))

// Mock the shared keepsake celebration (uses portals/audio in real life)
vi.mock("@/components/pairing/PairingCelebration", () => ({
  PairingCelebration: ({
    nameA,
    nameB,
    onDone,
  }: {
    variant?: string
    nameA: string
    nameB: string
    onDone: () => void
  }) => (
    <div data-testid="pairing-celebration">
      <span data-testid="celeb-a">{nameA}</span>
      <span data-testid="celeb-b">{nameB}</span>
      <button data-testid="celeb-done" onClick={onDone}>
        Enter Hayah
      </button>
    </div>
  ),
}))

import PairPage from "@/app/(main)/pair/page"

describe("PairPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit tests ──────────────────────────────────────────
  describe("unit", () => {
    it("renders pairing page for unpaired user", () => {
      render(<PairPage />)
      expect(screen.getByText("Find your partner")).toBeInTheDocument()
      expect(screen.getByText("Share your QR code or scan theirs to connect")).toBeInTheDocument()
    })

    it("renders invite code section", () => {
      render(<PairPage />)
      expect(screen.getByTestId("invite-code")).toHaveTextContent("ABC123")
    })

    it("renders code entry form", () => {
      render(<PairPage />)
      expect(screen.getByTestId("pair-code-input")).toBeInTheDocument()
      expect(screen.getByTestId("pair-submit-btn")).toBeInTheDocument()
    })

    it("renders 'or' dividers", () => {
      render(<PairPage />)
      expect(screen.getAllByText("or").length).toBeGreaterThanOrEqual(1)
    })

    it("shows loading skeleton when auth is loading", () => {
      useAuth.mockReturnValue({
        user: null,
        profile: null,
        partner: null,
        isLoading: true,
        refreshProfile: vi.fn(),
        signOut: vi.fn(),
        profileNeedsSetup: false,
      } as ReturnType<typeof useAuth>)

      const { container } = render(<PairPage />)
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
    })
  })

  // ── Integration tests ───────────────────────────────────
  describe("integration", () => {
    it("redirects to home when user is already paired", () => {
      useAuth.mockReturnValue({
        user: mockUser,
        profile: {
          id: "user-1",
          display_name: "Test User",
          pairing_status: "paired",
          invite_code: "ABC123",
          partner_id: "partner-1",
        },
        partner: { id: "partner-1", display_name: "Yara" },
        isLoading: false,
        refreshProfile: vi.fn(),
        signOut: vi.fn(),
        profileNeedsSetup: false,
      } as ReturnType<typeof useAuth>)

      render(<PairPage />)
      expect(mockReplace).toHaveBeenCalledWith("/")
    })

    it("renders nothing while redirecting paired user", () => {
      useAuth.mockReturnValue({
        user: mockUser,
        profile: {
          id: "user-1",
          display_name: "Test User",
          pairing_status: "paired",
          invite_code: "ABC123",
          partner_id: "partner-1",
        },
        partner: { id: "partner-1", display_name: "Yara" },
        isLoading: false,
        refreshProfile: vi.fn(),
        signOut: vi.fn(),
        profileNeedsSetup: false,
      } as ReturnType<typeof useAuth>)

      const { container } = render(<PairPage />)
      // Should not render the full page content
      expect(screen.queryByText("Find your partner")).not.toBeInTheDocument()
    })

    it("displays invite code from profile", () => {
      useAuth.mockReturnValue({
        user: mockUser,
        profile: {
          id: "user-1",
          display_name: "Test User",
          pairing_status: "unpaired",
          invite_code: "ABC123",
        },
        partner: null,
        isLoading: false,
        refreshProfile: vi.fn(),
        signOut: vi.fn(),
        profileNeedsSetup: false,
      })

      render(<PairPage />)
      expect(screen.getByTestId("invite-code")).toHaveTextContent("ABC123")
    })
  })

  // ── Interaction: keepsake celebration ───────────────────
  describe("interaction: celebration", () => {
    it("plays the keepsake celebration once paired, with both names", async () => {
      const user = userEvent.setup()
      render(<PairPage />)

      expect(screen.queryByTestId("pairing-celebration")).not.toBeInTheDocument()

      await user.click(screen.getByTestId("pair-submit-btn"))

      expect(screen.getByTestId("pairing-celebration")).toBeInTheDocument()
      expect(screen.getByTestId("celeb-a")).toHaveTextContent("Test User")
      expect(screen.getByTestId("celeb-b")).toHaveTextContent("Yara")
    })

    it("does not redirect home while the celebration plays, even after pairing_status flips to paired", async () => {
      const user = userEvent.setup()
      // Start unpaired so the page renders and we can trigger the celebration.
      const { rerender } = render(<PairPage />)
      await user.click(screen.getByTestId("pair-submit-btn"))
      expect(screen.getByTestId("pairing-celebration")).toBeInTheDocument()

      // Now the profile flips to paired (as refreshProfile would do) WHILE the
      // keepsake is on screen. The redirect must stay gated by `celebrate`.
      useAuth.mockReturnValue({
        user: mockUser,
        profile: {
          id: "user-1",
          display_name: "Test User",
          pairing_status: "paired",
          invite_code: "ABC123",
          partner_id: "partner-1",
        },
        partner: { id: "partner-1", display_name: "Yara" },
        isLoading: false,
        refreshProfile: vi.fn(),
        signOut: vi.fn(),
        profileNeedsSetup: false,
      } as ReturnType<typeof useAuth>)
      rerender(<PairPage />)

      // Gate holds: no early redirect, keepsake still mounted.
      expect(mockReplace).not.toHaveBeenCalled()
      expect(screen.getByTestId("pairing-celebration")).toBeInTheDocument()
    })

    it("refreshes profile and redirects home when celebration completes", async () => {
      const user = userEvent.setup()
      const mockRefresh = vi.fn().mockResolvedValue(undefined)
      useAuth.mockReturnValue({
        user: mockUser,
        profile: {
          id: "user-1",
          display_name: "Test User",
          pairing_status: "unpaired",
          invite_code: "ABC123",
        },
        partner: null,
        isLoading: false,
        refreshProfile: mockRefresh,
        signOut: vi.fn(),
        profileNeedsSetup: false,
      } as ReturnType<typeof useAuth>)

      render(<PairPage />)

      await user.click(screen.getByTestId("pair-submit-btn"))
      await user.click(screen.getByTestId("celeb-done"))

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
        expect(mockReplace).toHaveBeenCalledWith("/")
      })
    })
  })
})
