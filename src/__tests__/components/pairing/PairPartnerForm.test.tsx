import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PairPartnerForm } from "@/components/pairing/PairPartnerForm"

// ── Hoisted mocks ─────────────────────────────────────────
const mockUser = { id: "user-1", email: "test@test.com" }
const mockProfile = { id: "user-1", display_name: "Test User", pairing_status: "unpaired", invite_code: "ABC123" }

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    profile: mockProfile,
    partner: null,
    isLoading: false,
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn(),
    profileNeedsSetup: false,
  })),
}))

const mockRpc = vi.fn()

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    rpc: mockRpc,
  }),
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, animate, initial, exit, transition, whileHover, whileTap, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const htmlProps = Object.fromEntries(
        Object.entries(props).filter(([k]) => /^[a-z]/.test(k) || k.startsWith("data-") || k === "className" || k === "style" || k === "role")
      )
      return <div {...htmlProps}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      const htmlProps = Object.fromEntries(
        Object.entries(rest).filter(([k]) => /^[a-z]/.test(k) || k.startsWith("data-") || k === "className" || k === "style" || k === "role" || k === "onClick" || k === "type" || k === "disabled")
      )
      return <button {...htmlProps}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe("PairPartnerForm", () => {
  const mockOnPaired = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      partner: null,
      isLoading: false,
      refreshProfile: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn(),
      profileNeedsSetup: false,
    })
  })

  // ── Unit tests ──────────────────────────────────────────
  describe("unit", () => {
    it("renders code input and submit button", () => {
      render(<PairPartnerForm onPaired={mockOnPaired} />)
      expect(screen.getByTestId("pair-code-input")).toBeInTheDocument()
      expect(screen.getByTestId("pair-submit-btn")).toBeInTheDocument()
    })

    it("renders 'Have a code?' label", () => {
      render(<PairPartnerForm onPaired={mockOnPaired} />)
      expect(screen.getByText("Have a code?")).toBeInTheDocument()
    })

    it("submit button is disabled when code is less than 6 chars", () => {
      render(<PairPartnerForm onPaired={mockOnPaired} />)
      expect(screen.getByTestId("pair-submit-btn")).toBeDisabled()
    })

    it("auto-uppercases input", async () => {
      const user = userEvent.setup()
      render(<PairPartnerForm onPaired={mockOnPaired} />)

      const input = screen.getByTestId("pair-code-input")
      await user.type(input, "abc123")

      expect(input).toHaveValue("ABC123")
    })

    it("limits input to 6 characters", async () => {
      const user = userEvent.setup()
      render(<PairPartnerForm onPaired={mockOnPaired} />)

      const input = screen.getByTestId("pair-code-input")
      await user.type(input, "ABCDEFGH")

      expect(input).toHaveValue("ABCDEF")
    })

    it("strips non-alphanumeric characters", async () => {
      const user = userEvent.setup()
      render(<PairPartnerForm onPaired={mockOnPaired} />)

      const input = screen.getByTestId("pair-code-input")
      await user.type(input, "AB-C1.2")

      expect(input).toHaveValue("ABC12")
    })
  })

  // ── Interaction tests ───────────────────────────────────
  describe("interaction", () => {
    it("submits valid code and shows success screen", async () => {
      const user = userEvent.setup()
      mockRpc.mockResolvedValueOnce({
        data: { success: true, partner_name: "Yara" },
        error: null,
      })

      render(<PairPartnerForm onPaired={mockOnPaired} />)

      await user.type(screen.getByTestId("pair-code-input"), "XYZ789")
      await user.click(screen.getByTestId("pair-submit-btn"))

      await waitFor(() => {
        expect(screen.getByText("You're paired!")).toBeInTheDocument()
        expect(screen.getByText("Connected with Yara")).toBeInTheDocument()
      })
    })

    it("shows error for invalid invite code", async () => {
      const user = userEvent.setup()
      mockRpc.mockResolvedValueOnce({
        data: { error: "Invalid invite code" },
        error: null,
      })

      render(<PairPartnerForm onPaired={mockOnPaired} />)

      await user.type(screen.getByTestId("pair-code-input"), "BADCOD")
      await user.click(screen.getByTestId("pair-submit-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("pair-error")).toHaveTextContent("Invalid invite code")
      })
    })

    it("shows error for already paired user", async () => {
      const user = userEvent.setup()
      mockRpc.mockResolvedValueOnce({
        data: { error: "User already paired" },
        error: null,
      })

      render(<PairPartnerForm onPaired={mockOnPaired} />)

      await user.type(screen.getByTestId("pair-code-input"), "PAIRED")
      await user.click(screen.getByTestId("pair-submit-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("pair-error")).toHaveTextContent("User already paired")
      })
    })

    it("handles RPC error gracefully", async () => {
      const user = userEvent.setup()
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Network error" },
      })

      render(<PairPartnerForm onPaired={mockOnPaired} />)

      await user.type(screen.getByTestId("pair-code-input"), "ERR0RS")
      await user.click(screen.getByTestId("pair-submit-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("pair-error")).toHaveTextContent("Something went wrong")
      })
    })

    it("calls onPaired when 'Enter Hayah' is clicked after success", async () => {
      const user = userEvent.setup()
      mockRpc.mockResolvedValueOnce({
        data: { success: true, partner_name: "Yara" },
        error: null,
      })

      render(<PairPartnerForm onPaired={mockOnPaired} />)

      await user.type(screen.getByTestId("pair-code-input"), "XYZ789")
      await user.click(screen.getByTestId("pair-submit-btn"))

      await waitFor(() => {
        expect(screen.getByTestId("enter-hayah-btn")).toBeInTheDocument()
      })

      await user.click(screen.getByTestId("enter-hayah-btn"))
      expect(mockOnPaired).toHaveBeenCalled()
    })

    it("enables submit button when code is 6 chars", async () => {
      const user = userEvent.setup()
      render(<PairPartnerForm onPaired={mockOnPaired} />)

      const input = screen.getByTestId("pair-code-input")
      await user.type(input, "ABC123")

      expect(screen.getByTestId("pair-submit-btn")).not.toBeDisabled()
    })
  })

  // ── Integration tests ───────────────────────────────────
  describe("integration", () => {
    it("calls supabase.rpc with correct args", async () => {
      const user = userEvent.setup()
      mockRpc.mockResolvedValueOnce({
        data: { success: true, partner_name: "Yara" },
        error: null,
      })

      render(<PairPartnerForm onPaired={mockOnPaired} />)

      await user.type(screen.getByTestId("pair-code-input"), "XYZ789")
      await user.click(screen.getByTestId("pair-submit-btn"))

      expect(mockRpc).toHaveBeenCalledWith("pair_partners", {
        my_id: "user-1",
        partner_code: "XYZ789",
      })
    })

    it("calls refreshProfile after successful pairing", async () => {
      const user = userEvent.setup()
      const mockRefresh = vi.fn().mockResolvedValue(undefined)
      useAuth.mockReturnValue({
        user: mockUser,
        profile: mockProfile,
        partner: null,
        isLoading: false,
        refreshProfile: mockRefresh,
        signOut: vi.fn(),
        profileNeedsSetup: false,
      })
      mockRpc.mockResolvedValueOnce({
        data: { success: true, partner_name: "Yara" },
        error: null,
      })

      render(<PairPartnerForm onPaired={mockOnPaired} />)

      await user.type(screen.getByTestId("pair-code-input"), "XYZ789")
      await user.click(screen.getByTestId("pair-submit-btn"))

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it("does not call rpc when user is null", async () => {
      const user = userEvent.setup()
      useAuth.mockReturnValue({
        user: null,
        profile: null,
        partner: null,
        isLoading: false,
        refreshProfile: vi.fn(),
        signOut: vi.fn(),
        profileNeedsSetup: false,
      } as ReturnType<typeof useAuth>)

      render(<PairPartnerForm onPaired={mockOnPaired} />)

      const input = screen.getByTestId("pair-code-input")
      await user.type(input, "XYZ789")
      await user.click(screen.getByTestId("pair-submit-btn"))

      expect(mockRpc).not.toHaveBeenCalled()
    })
  })
})
