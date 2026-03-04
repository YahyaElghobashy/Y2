import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

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
      expect(screen.getByText("Share your invite code or enter theirs to connect")).toBeInTheDocument()
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

    it("renders 'or' divider", () => {
      render(<PairPage />)
      expect(screen.getByText("or")).toBeInTheDocument()
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
})
