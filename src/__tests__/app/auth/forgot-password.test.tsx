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

describe("ForgotPasswordPage", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Unit tests ---

  it("renders the form with email input and submit button", () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send Reset Link" })).toBeInTheDocument()
    expect(screen.getByText("Forgot your password?")).toBeInTheDocument()
  })

  it("shows validation error for invalid email", async () => {
    render(<ForgotPasswordPage />)
    const emailInput = screen.getByPlaceholderText("you@example.com")
    await user.type(emailInput, "not-an-email")
    await user.tab() // trigger onBlur validation
    await waitFor(() => {
      expect(screen.getByText("Enter a valid email")).toBeInTheDocument()
    })
  })

  it("renders 'Remember your password? Sign In' link", () => {
    render(<ForgotPasswordPage />)
    const link = screen.getByRole("link", { name: "Sign In" })
    expect(link).toHaveAttribute("href", "/login")
  })

  // --- Interaction tests ---

  it("submits email and shows success state", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    const emailInput = screen.getByPlaceholderText("you@example.com")
    await user.type(emailInput, "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
    })
  })

  it("shows resend cooldown timer after sending", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(screen.getByText(/Resend in \d+s/)).toBeInTheDocument()
    })
  })

  it("shows 'Back to Sign In' link in success state", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "Back to Sign In" })
      expect(link).toHaveAttribute("href", "/login")
    })
  })

  // --- Integration tests ---

  it("calls resetPasswordForEmail with correct email and redirectTo", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: expect.stringContaining("/reset-password"),
      })
    })
  })

  it("shows rate limit error message", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "For security purposes, you can only request this after 60 seconds rate limit" },
    })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(screen.getByText("Please wait before requesting another reset link.")).toBeInTheDocument()
    })
  })

  it("shows generic error message for other Supabase errors", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found" },
    })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument()
    })
  })
})
