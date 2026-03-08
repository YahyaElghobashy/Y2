import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockResetPasswordForEmail = vi.fn()
const mockVerifyOtp = vi.fn()
const mockUpdateUser = vi.fn()
const mockPush = vi.fn()

const mockSupabase = {
  auth: {
    resetPasswordForEmail: mockResetPasswordForEmail,
    verifyOtp: mockVerifyOtp,
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

vi.mock("@/components/animations/HayahWordmark", () => ({
  HayahWordmark: () => <div data-testid="wordmark">Hayah</div>,
}))

import ForgotPasswordPage from "@/app/(auth)/forgot-password/page"

describe("ForgotPasswordPage", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Step 1: Email Form — Unit tests ---

  it("renders the email form with input and submit button", () => {
    render(<ForgotPasswordPage />)
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send Code" })).toBeInTheDocument()
    expect(screen.getByText("Forgot your password?")).toBeInTheDocument()
  })

  it("shows validation error for invalid email", async () => {
    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "not-an-email")
    await user.tab()
    await waitFor(() => {
      expect(screen.getByText("Enter a valid email")).toBeInTheDocument()
    })
  })

  it("renders 'Remember your password? Sign In' link", () => {
    render(<ForgotPasswordPage />)
    const link = screen.getByRole("link", { name: "Sign In" })
    expect(link).toHaveAttribute("href", "/login")
  })

  // --- Step 1 → Step 2: Interaction tests ---

  it("submits email and transitions to OTP step", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument()
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
    })
  })

  it("shows resend cooldown timer after sending", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))

    await waitFor(() => {
      expect(screen.getByText(/Resend code in \d+s/)).toBeInTheDocument()
    })
  })

  it("shows 'Back to Sign In' link in OTP step", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))

    await waitFor(() => {
      const link = screen.getByRole("link", { name: "Back to Sign In" })
      expect(link).toHaveAttribute("href", "/login")
    })
  })

  // --- Step 2 → Step 3: OTP Verification ---

  it("transitions to password step after valid OTP", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    // Step 1: enter email
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument()
    })

    // Step 2: enter OTP (type into individual digit inputs)
    const digitInputs = screen.getAllByRole("textbox")
    for (let i = 0; i < 6; i++) {
      await user.type(digitInputs[i], String(i + 1))
    }

    await waitFor(() => {
      expect(screen.getByText("Set new password")).toBeInTheDocument()
    })
  })

  it("shows error for invalid OTP code", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({
      error: { message: "Invalid OTP token" },
    })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument()
    })

    const digitInputs = screen.getAllByRole("textbox")
    for (let i = 0; i < 6; i++) {
      await user.type(digitInputs[i], "9")
    }

    await waitFor(() => {
      expect(screen.getByText("Invalid code. Please try again.")).toBeInTheDocument()
    })
  })

  it("shows expired error for expired OTP", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({
      error: { message: "Token has expired" },
    })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))

    await waitFor(() => {
      expect(screen.getByText("Check your email")).toBeInTheDocument()
    })

    const digitInputs = screen.getAllByRole("textbox")
    for (let i = 0; i < 6; i++) {
      await user.type(digitInputs[i], "0")
    }

    await waitFor(() => {
      expect(screen.getByText("Code expired. Please request a new one.")).toBeInTheDocument()
    })
  })

  // --- Step 3: Password — Interaction tests ---

  it("validates passwords match before submitting", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    // Navigate to password step
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))
    await waitFor(() => expect(screen.getByText("Check your email")).toBeInTheDocument())

    const digitInputs = screen.getAllByRole("textbox")
    for (let i = 0; i < 6; i++) {
      await user.type(digitInputs[i], String(i + 1))
    }

    await waitFor(() => expect(screen.getByText("Set new password")).toBeInTheDocument())

    // Enter mismatched passwords
    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "DifferentPass1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
  })

  it("shows success state after successful password update", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    // Navigate to password step
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))
    await waitFor(() => expect(screen.getByText("Check your email")).toBeInTheDocument())

    const digitInputs = screen.getAllByRole("textbox")
    for (let i = 0; i < 6; i++) {
      await user.type(digitInputs[i], String(i + 1))
    }

    await waitFor(() => expect(screen.getByText("Set new password")).toBeInTheDocument())

    // Enter matching passwords
    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "NewPassword1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Password updated!")).toBeInTheDocument()
    })
  })

  // --- Integration tests ---

  it("calls resetPasswordForEmail with correct email (no redirectTo)", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@example.com")
    })
  })

  it("calls verifyOtp with recovery type and correct args", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))
    await waitFor(() => expect(screen.getByText("Check your email")).toBeInTheDocument())

    const digitInputs = screen.getAllByRole("textbox")
    for (let i = 0; i < 6; i++) {
      await user.type(digitInputs[i], String(i + 1))
    }

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        token: "123456",
        type: "recovery",
      })
    })
  })

  it("calls updateUser with the new password after OTP verification", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))
    await waitFor(() => expect(screen.getByText("Check your email")).toBeInTheDocument())

    const digitInputs = screen.getAllByRole("textbox")
    for (let i = 0; i < 6; i++) {
      await user.type(digitInputs[i], String(i + 1))
    }
    await waitFor(() => expect(screen.getByText("Set new password")).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText("Create a new password"), "SecurePass123!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "SecurePass123!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "SecurePass123!" })
    })
  })

  it("shows rate limit error message", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "For security purposes, you can only request this after 60 seconds rate limit" },
    })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))

    await waitFor(() => {
      expect(screen.getByText("Please wait before requesting another code.")).toBeInTheDocument()
    })
  })

  it("shows generic error message for other Supabase errors", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found" },
    })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument()
    })
  })

  it("shows Supabase error when updateUser fails", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    mockVerifyOtp.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({
      error: { message: "Password should be at least 6 characters" },
    })

    render(<ForgotPasswordPage />)
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.click(screen.getByRole("button", { name: "Send Code" }))
    await waitFor(() => expect(screen.getByText("Check your email")).toBeInTheDocument())

    const digitInputs = screen.getAllByRole("textbox")
    for (let i = 0; i < 6; i++) {
      await user.type(digitInputs[i], String(i + 1))
    }
    await waitFor(() => expect(screen.getByText("Set new password")).toBeInTheDocument())

    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPass123!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "NewPass123!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Password should be at least 6 characters")).toBeInTheDocument()
    })
  })
})
