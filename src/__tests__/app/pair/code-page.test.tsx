import { render, screen, waitFor, act } from "@testing-library/react"
import { Suspense } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}))

// Mock next/navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

// Mock AuthProvider
const mockRefreshProfile = vi.fn()
let mockAuthState = {
  user: null as { id: string } | null,
  profile: null as { pairing_status: string; invite_code: string } | null,
  isLoading: false,
  refreshProfile: mockRefreshProfile,
}
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuthState,
}))

// Mock Supabase
const mockRpc = vi.fn()
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    rpc: mockRpc,
  }),
}))

// Mock pairing-link
const mockStorePendingPairCode = vi.fn()
vi.mock("@/lib/pairing-link", () => ({
  storePendingPairCode: (code: string) => mockStorePendingPairCode(code),
}))

import PairCodePage from "@/app/(main)/pair/[code]/page"

async function renderPage(code: string) {
  await act(async () => {
    render(
      <Suspense fallback={<div>Loading suspense...</div>}>
        <PairCodePage params={Promise.resolve({ code })} />
      </Suspense>
    )
  })
}

describe("PairCodePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      user: null,
      profile: null,
      isLoading: false,
      refreshProfile: mockRefreshProfile,
    }
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit: loading state", () => {
    it("shows loading state while auth is loading", async () => {
      mockAuthState.isLoading = true
      renderPage("ABC123")

      await waitFor(() => {
        expect(screen.getByTestId("pair-code-loading")).toBeInTheDocument()
      })
    })
  })

  describe("unit: unauthenticated flow", () => {
    it("stores pending code and redirects to login when not authenticated", async () => {
      mockAuthState.user = null
      renderPage("ABC123")

      await waitFor(() => {
        expect(mockStorePendingPairCode).toHaveBeenCalledWith("ABC123")
        expect(mockReplace).toHaveBeenCalledWith("/login?redirectTo=/pair/ABC123")
      })
    })

    it("uppercases the code before storing", async () => {
      mockAuthState.user = null
      renderPage("abc123")

      await waitFor(() => {
        expect(mockStorePendingPairCode).toHaveBeenCalledWith("ABC123")
      })
    })
  })

  describe("unit: already paired", () => {
    it("shows already paired message when user is paired", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "paired", invite_code: "XYZ789" }
      renderPage("ABC123")

      await waitFor(() => {
        expect(screen.getByTestId("pair-code-already-paired")).toBeInTheDocument()
        expect(screen.getByText("Already paired")).toBeInTheDocument()
      })
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction: auto-pair flow", () => {
    it("calls pair_partners RPC automatically when authenticated and unpaired", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "unpaired", invite_code: "MY_CODE" }
      mockRpc.mockResolvedValue({
        data: { success: true, partner_name: "Yara" },
        error: null,
      })

      renderPage("ABC123")

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith("pair_partners", {
          my_id: "user-1",
          partner_code: "ABC123",
        })
      })
    })

    it("shows success state after successful pairing", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "unpaired", invite_code: "MY_CODE" }
      mockRpc.mockResolvedValue({
        data: { success: true, partner_name: "Yara" },
        error: null,
      })

      renderPage("ABC123")

      await waitFor(() => {
        expect(screen.getByTestId("pair-code-success")).toBeInTheDocument()
        expect(screen.getByText("Connected with Yara")).toBeInTheDocument()
      })
    })

    it("refreshes profile after successful pairing", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "unpaired", invite_code: "MY_CODE" }
      mockRpc.mockResolvedValue({
        data: { success: true, partner_name: "Yara" },
        error: null,
      })

      renderPage("ABC123")

      await waitFor(() => {
        expect(mockRefreshProfile).toHaveBeenCalled()
      })
    })

    it("shows error state on RPC failure", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "unpaired", invite_code: "MY_CODE" }
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      })

      renderPage("ABC123")

      await waitFor(() => {
        expect(screen.getByTestId("pair-code-error")).toBeInTheDocument()
        expect(screen.getByText("Pairing failed")).toBeInTheDocument()
      })
    })

    it("shows error from RPC result data", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "unpaired", invite_code: "MY_CODE" }
      mockRpc.mockResolvedValue({
        data: { error: "Invalid invite code" },
        error: null,
      })

      renderPage("ABC123")

      await waitFor(() => {
        expect(screen.getByTestId("pair-code-error")).toBeInTheDocument()
        expect(screen.getByText("Invalid invite code")).toBeInTheDocument()
      })
    })

    it("shows error on thrown exception", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "unpaired", invite_code: "MY_CODE" }
      mockRpc.mockRejectedValue(new Error("Network error"))

      renderPage("ABC123")

      await waitFor(() => {
        expect(screen.getByTestId("pair-code-error")).toBeInTheDocument()
      })
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("passes correct RPC arguments with uppercased code", async () => {
      mockAuthState.user = { id: "user-42" }
      mockAuthState.profile = { pairing_status: "unpaired", invite_code: "MY_CODE" }
      mockRpc.mockResolvedValue({
        data: { success: true, partner_name: "Partner" },
        error: null,
      })

      renderPage("abc123")

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith("pair_partners", {
          my_id: "user-42",
          partner_code: "ABC123",
        })
      })
    })

    it("has Enter Hayah button that navigates home on success", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "unpaired", invite_code: "MY_CODE" }
      mockRpc.mockResolvedValue({
        data: { success: true, partner_name: "Yara" },
        error: null,
      })

      renderPage("ABC123")

      await waitFor(() => {
        expect(screen.getByTestId("pair-enter-btn")).toBeInTheDocument()
      })
    })

    it("has manual entry button on error", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "unpaired", invite_code: "MY_CODE" }
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "Failed" },
      })

      renderPage("ABC123")

      await waitFor(() => {
        expect(screen.getByTestId("pair-try-manual-btn")).toBeInTheDocument()
      })
    })

    it("has Go Home button when already paired", async () => {
      mockAuthState.user = { id: "user-1" }
      mockAuthState.profile = { pairing_status: "paired", invite_code: "XYZ789" }
      renderPage("ABC123")

      await waitFor(() => {
        expect(screen.getByTestId("pair-go-home-btn")).toBeInTheDocument()
      })
    })
  })
})
