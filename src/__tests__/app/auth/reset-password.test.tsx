import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockUpdateUser = vi.fn()
const mockPush = vi.fn()
let authStateCallback: ((event: string, session: unknown) => void) | null = null
const mockUnsubscribe = vi.fn()

const mockSupabase = {
  auth: {
    onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
      authStateCallback = cb
      return {
        data: {
          subscription: { unsubscribe: mockUnsubscribe },
        },
      }
    }),
    updateUser: mockUpdateUser,
  },
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
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

describe("ResetPasswordPage", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    authStateCallback = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // --- Unit tests ---

  it("shows loading state initially", () => {
    render(<ResetPasswordPage />)
    expect(screen.getByText("Verifying your reset link...")).toBeInTheDocument()
  })

  it("shows error state after 5s timeout with no recovery event", async () => {
    render(<ResetPasswordPage />)

    act(() => {
      vi.advanceTimersByTime(5100)
    })

    await waitFor(() => {
      expect(screen.getByText("Invalid or expired link")).toBeInTheDocument()
    })
  })

  it("shows 'Request New Link' button in error state", async () => {
    render(<ResetPasswordPage />)

    act(() => {
      vi.advanceTimersByTime(5100)
    })

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "Request New Link" })
      expect(link).toHaveAttribute("href", "/forgot-password")
    })
  })

  // --- Interaction tests ---

  it("shows form when PASSWORD_RECOVERY event fires", async () => {
    render(<ResetPasswordPage />)

    act(() => {
      authStateCallback?.("PASSWORD_RECOVERY", { user: { id: "test-user" } })
    })

    await waitFor(() => {
      expect(screen.getByText("Set new password")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Create a new password")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Repeat your new password")).toBeInTheDocument()
    })
  })

  it("shows password strength dots when typing password", async () => {
    vi.useRealTimers()
    const realUser = userEvent.setup()

    render(<ResetPasswordPage />)

    act(() => {
      authStateCallback?.("PASSWORD_RECOVERY", { user: { id: "test-user" } })
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Create a new password")).toBeInTheDocument()
    })

    await realUser.type(screen.getByPlaceholderText("Create a new password"), "StrongP@ss1")

    // PasswordStrengthDots should be rendered (4 dot divs)
    await waitFor(() => {
      const dots = document.querySelectorAll(".rounded-full.h-2.w-2")
      expect(dots.length).toBe(4)
    })
  })

  it("validates passwords match before submitting", async () => {
    vi.useRealTimers()
    const realUser = userEvent.setup()

    render(<ResetPasswordPage />)

    act(() => {
      authStateCallback?.("PASSWORD_RECOVERY", { user: { id: "test-user" } })
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Create a new password")).toBeInTheDocument()
    })

    await realUser.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await realUser.type(screen.getByPlaceholderText("Repeat your new password"), "DifferentPass1!")
    await realUser.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
  })

  it("shows success state and redirects after password update", async () => {
    vi.useRealTimers()
    const realUser = userEvent.setup()
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ResetPasswordPage />)

    act(() => {
      authStateCallback?.("PASSWORD_RECOVERY", { user: { id: "test-user" } })
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Create a new password")).toBeInTheDocument()
    })

    await realUser.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await realUser.type(screen.getByPlaceholderText("Repeat your new password"), "NewPassword1!")
    await realUser.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Password updated!")).toBeInTheDocument()
    })
  })

  // --- Integration tests ---

  it("subscribes to onAuthStateChange on mount", () => {
    render(<ResetPasswordPage />)
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function))
  })

  it("calls updateUser with the new password", async () => {
    vi.useRealTimers()
    const realUser = userEvent.setup()
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ResetPasswordPage />)

    act(() => {
      authStateCallback?.("PASSWORD_RECOVERY", { user: { id: "test-user" } })
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Create a new password")).toBeInTheDocument()
    })

    await realUser.type(screen.getByPlaceholderText("Create a new password"), "SecurePass123!")
    await realUser.type(screen.getByPlaceholderText("Repeat your new password"), "SecurePass123!")
    await realUser.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "SecurePass123!" })
    })
  })

  it("shows Supabase error when updateUser fails", async () => {
    vi.useRealTimers()
    const realUser = userEvent.setup()
    mockUpdateUser.mockResolvedValue({
      error: { message: "Password should be at least 6 characters" },
    })

    render(<ResetPasswordPage />)

    act(() => {
      authStateCallback?.("PASSWORD_RECOVERY", { user: { id: "test-user" } })
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Create a new password")).toBeInTheDocument()
    })

    await realUser.type(screen.getByPlaceholderText("Create a new password"), "NewPass123!")
    await realUser.type(screen.getByPlaceholderText("Repeat your new password"), "NewPass123!")
    await realUser.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Password should be at least 6 characters")).toBeInTheDocument()
    })
  })

  it("unsubscribes from auth listener on unmount", () => {
    const { unmount } = render(<ResetPasswordPage />)
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
