import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockUpdateUser = vi.fn()
const mockPush = vi.fn()
const mockUnsubscribe = vi.fn()

const mockSupabase = {
  auth: {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
    updateUser: mockUpdateUser,
  },
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
    p: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, ...rest } = props
      void initial; void animate; void exit; void transition
      return <p {...rest}>{children}</p>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import ResetPasswordPage from "@/app/(auth)/reset-password/page"

function withSession() {
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null })
}
function withoutSession() {
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
}

describe("ResetPasswordPage (recovery set-new-password)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
    mockUpdateUser.mockResolvedValue({ error: null })
  })

  // ── Session guard ──
  it("shows the password form when a recovery session exists", async () => {
    withSession()
    render(<ResetPasswordPage />)
    await waitFor(() => {
      expect(screen.getByText("Set new password")).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText("Create a new password")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Repeat your new password")).toBeInTheDocument()
  })

  it("shows an expired-link guard when there is no session", async () => {
    withoutSession()
    render(<ResetPasswordPage />)
    await waitFor(() => {
      expect(screen.getByText("Link expired")).toBeInTheDocument()
    })
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      "/forgot-password"
    )
    expect(screen.queryByText("Set new password")).not.toBeInTheDocument()
  })

  it("subscribes and unsubscribes from auth state changes", async () => {
    withSession()
    const { unmount } = render(<ResetPasswordPage />)
    await waitFor(() => expect(screen.getByText("Set new password")).toBeInTheDocument())
    expect(mockOnAuthStateChange).toHaveBeenCalled()
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  // ── Validation ──
  it("blocks submit and shows error when passwords don't match", async () => {
    withSession()
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await waitFor(() => expect(screen.getByText("Set new password")).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "DifferentPass1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  // ── Interaction + Integration ──
  it("calls updateUser with the new password and shows success", async () => {
    withSession()
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await waitFor(() => expect(screen.getByText("Set new password")).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText("Create a new password"), "SecurePass123!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "SecurePass123!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "SecurePass123!" })
    })
    await waitFor(() => {
      expect(screen.getByText("Password updated!")).toBeInTheDocument()
    })
  })

  it("shows a Supabase error when updateUser fails", async () => {
    withSession()
    mockUpdateUser.mockResolvedValueOnce({
      error: { message: "Password should be at least 6 characters" },
    })
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await waitFor(() => expect(screen.getByText("Set new password")).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPass123!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "NewPass123!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Password should be at least 6 characters")).toBeInTheDocument()
    })
    expect(screen.queryByText("Password updated!")).not.toBeInTheDocument()
  })
})
