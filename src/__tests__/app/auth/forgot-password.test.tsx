import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockResetPasswordForEmail = vi.fn()

const mockSupabase = {
  auth: {
    resetPasswordForEmail: mockResetPasswordForEmail,
  },
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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

vi.mock("@/components/animations/HayahWordmark", () => ({
  HayahWordmark: () => <div data-testid="wordmark">Hayah</div>,
}))

import ForgotPasswordPage from "@/app/(auth)/forgot-password/page"

const EXPECTED_REDIRECT = "http://localhost:3000/auth/callback?next=/reset-password"

describe("ForgotPasswordPage (recovery-link flow)", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
  })

  // ── Step 1: Email form — Unit ──
  it("renders the email form with input and 'Send Reset Link' button", () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeInTheDocument()
    expect(screen.getByText("Forgot your password?")).toBeInTheDocument()
  })

  it("shows validation error for invalid email", async () => {
    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "not-an-email")
    await user.tab()
    await waitFor(() => {
      expect(screen.getByText("Enter a valid email")).toBeInTheDocument()
    })
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it("renders 'Remember your password? Sign In' link", () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login")
  })

  // ── Step 1 → Step 2: Interaction ──
  it("submits email and transitions to the 'check your email' step", async () => {
    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument()
      expect(screen.getByText("test@example.com")).toBeInTheDocument()
    })
  })

  it("no longer renders a 6-digit OTP input", async () => {
    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => expect(screen.getByText("Check your email")).toBeInTheDocument())
    expect(screen.queryByText(/6-digit code/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Verify" })).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("shows a resend cooldown after sending", async () => {
    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(screen.getByText(/Resend link in \d+s/)).toBeInTheDocument()
    })
  })

  it("shows 'Back to Sign In' link on the sent step", async () => {
    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Back to Sign In" })).toHaveAttribute("href", "/login")
    })
  })

  // ── Integration — recovery LINK contract ──
  it("calls resetPasswordForEmail with the PKCE callback redirectTo", async () => {
    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: EXPECTED_REDIRECT,
      })
    })
  })

  // ── Unit — error paths ──
  it("shows a rate-limit message", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({
      error: { message: "For security purposes, you can only request this after 60 seconds rate limit" },
    })
    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(screen.getByText("Please wait before requesting another link.")).toBeInTheDocument()
    })
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument()
  })

  it("shows a generic error for other Supabase errors", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({ error: { message: "User not found" } })
    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument()
    })
  })
})
