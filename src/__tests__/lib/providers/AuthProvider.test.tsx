import { render, screen, act, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

type AuthCallback = (event: string, session: { user: { id: string } } | null) => void

let authCallback: AuthCallback | null = null
const mockUnsubscribe = vi.fn()
const mockSignOut = vi.fn().mockResolvedValue({ error: null })
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

const mockSupabase = {
  auth: {
    onAuthStateChange: vi.fn((cb: AuthCallback) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    }),
    signOut: mockSignOut,
  },
  from: vi.fn(() => ({
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle,
      }),
    }),
  })),
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

// Import after mocks
import { AuthProvider, useAuth } from "@/lib/providers/AuthProvider"

function TestConsumer() {
  const { user, profile, partner, isLoading, profileNeedsSetup, signOut } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user?.id ?? "null"}</span>
      <span data-testid="profile">{profile?.display_name ?? "null"}</span>
      <span data-testid="partner">{partner?.display_name ?? "null"}</span>
      <span data-testid="needs-setup">{String(profileNeedsSetup)}</span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authCallback = null
    mockSingle.mockResolvedValue({ data: null, error: { message: "not found" } })
  })

  it("renders children", () => {
    render(
      <AuthProvider>
        <span>child content</span>
      </AuthProvider>
    )
    expect(screen.getByText("child content")).toBeInTheDocument()
  })

  it("starts with isLoading true", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(screen.getByTestId("loading")).toHaveTextContent("true")
  })

  it("subscribes to auth state changes on mount", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledOnce()
  })

  it("unsubscribes on unmount", () => {
    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledOnce()
  })

  it("populates user and profile on session", async () => {
    const mockProfile = {
      id: "user-1",
      display_name: "Yahya",
      email: "yahya@test.com",
      avatar_url: null,
      partner_id: null,
      role: "user",
      created_at: "",
      updated_at: "",
    }
    mockSingle.mockResolvedValueOnce({ data: mockProfile, error: null })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      authCallback?.("SIGNED_IN", { user: { id: "user-1" } })
    })

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("user-1")
      expect(screen.getByTestId("profile")).toHaveTextContent("Yahya")
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    })
  })

  it("fetches partner when partner_id exists", async () => {
    const mockProfile = {
      id: "user-1",
      display_name: "Yahya",
      email: "yahya@test.com",
      avatar_url: null,
      partner_id: "user-2",
      role: "user",
      created_at: "",
      updated_at: "",
    }
    const mockPartner = {
      id: "user-2",
      display_name: "Yara",
      email: "yara@test.com",
      avatar_url: null,
      partner_id: "user-1",
      role: "user",
      created_at: "",
      updated_at: "",
    }
    mockSingle
      .mockResolvedValueOnce({ data: mockProfile, error: null })
      .mockResolvedValueOnce({ data: mockPartner, error: null })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      authCallback?.("SIGNED_IN", { user: { id: "user-1" } })
    })

    await waitFor(() => {
      expect(screen.getByTestId("partner")).toHaveTextContent("Yara")
    })
  })

  it("resets state on null session (sign out)", async () => {
    const mockProfile = {
      id: "user-1",
      display_name: "Yahya",
      email: "yahya@test.com",
      avatar_url: null,
      partner_id: null,
      role: "user",
      created_at: "",
      updated_at: "",
    }
    mockSingle.mockResolvedValueOnce({ data: mockProfile, error: null })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      authCallback?.("SIGNED_IN", { user: { id: "user-1" } })
    })

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("user-1")
    })

    await act(async () => {
      authCallback?.("SIGNED_OUT", null)
    })

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("null")
      expect(screen.getByTestId("profile")).toHaveTextContent("null")
      expect(screen.getByTestId("partner")).toHaveTextContent("null")
    })
  })

  it("calls signOut and redirects to /login", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    const user = userEvent.setup()
    await user.click(screen.getByText("Sign Out"))

    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(mockPush).toHaveBeenCalledWith("/login")
  })

  it("sets isLoading false on null session", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      authCallback?.("INITIAL_SESSION", null)
    })

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    })
  })

  it("handles profile fetch failure gracefully", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "db error" } })

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      authCallback?.("SIGNED_IN", { user: { id: "user-1" } })
    })

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("user-1")
      expect(screen.getByTestId("profile")).toHaveTextContent("null")
      expect(screen.getByTestId("loading")).toHaveTextContent("false")
    })
  })

  it("throws when useAuth is used outside AuthProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider"
    )
    spy.mockRestore()
  })
})
