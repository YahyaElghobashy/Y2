import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockSignInWithPassword = vi.fn()
const mockUpdateUser = vi.fn()

const mockSupabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    updateUser: mockUpdateUser,
  },
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@example.com" },
    profile: { id: "user-1", display_name: "Test User" },
    partner: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
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

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm"

describe("ChangePasswordForm", () => {
  const user = userEvent.setup()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Unit tests ---

  it("renders all three password fields", () => {
    render(<ChangePasswordForm onClose={mockOnClose} />)
    expect(screen.getByPlaceholderText("Enter current password")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Create a new password")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Repeat your new password")).toBeInTheDocument()
  })

  it("renders Update Password and Cancel buttons", () => {
    render(<ChangePasswordForm onClose={mockOnClose} />)
    expect(screen.getByRole("button", { name: "Update Password" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("shows validation error for empty current password", async () => {
    render(<ChangePasswordForm onClose={mockOnClose} />)
    const currentInput = screen.getByPlaceholderText("Enter current password")
    await user.click(currentInput)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText("Current password is required")).toBeInTheDocument()
    })
  })

  it("shows validation error for short new password", async () => {
    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.type(screen.getByPlaceholderText("Create a new password"), "short")
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument()
    })
  })

  it("shows validation error when passwords don't match", async () => {
    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.type(screen.getByPlaceholderText("Enter current password"), "OldPassword1!")
    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "Different1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
  })

  it("shows validation error when new password matches current", async () => {
    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.type(screen.getByPlaceholderText("Enter current password"), "SamePass123!")
    await user.type(screen.getByPlaceholderText("Create a new password"), "SamePass123!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "SamePass123!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("New password must be different from current password")).toBeInTheDocument()
    })
  })

  // --- Interaction tests ---

  it("calls onClose when Cancel is clicked", async () => {
    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it("calls onClose when X button is clicked", async () => {
    render(<ChangePasswordForm onClose={mockOnClose} />)
    // X button is the first button inside the header
    const closeButton = screen.getByText("Change Password").parentElement?.querySelector("button")
    expect(closeButton).toBeTruthy()
    await user.click(closeButton!)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it("shows success state after successful password change", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.type(screen.getByPlaceholderText("Enter current password"), "OldPassword1!")
    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "NewPassword1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Password updated!")).toBeInTheDocument()
    })
  })

  it("shows error when current password is incorrect", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    })

    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.type(screen.getByPlaceholderText("Enter current password"), "WrongPass1!")
    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "NewPassword1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Current password is incorrect")).toBeInTheDocument()
    })
  })

  // --- Integration tests ---

  it("verifies current password via signInWithPassword with correct args", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.type(screen.getByPlaceholderText("Enter current password"), "OldPassword1!")
    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "NewPassword1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "OldPassword1!",
      })
    })
  })

  it("calls updateUser with the new password after verification", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({ error: null })

    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.type(screen.getByPlaceholderText("Enter current password"), "OldPassword1!")
    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "NewPassword1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "NewPassword1!" })
    })
  })

  it("does NOT call updateUser when current password verification fails", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    })

    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.type(screen.getByPlaceholderText("Enter current password"), "WrongPass1!")
    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "NewPassword1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Current password is incorrect")).toBeInTheDocument()
    })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it("shows Supabase error when updateUser fails", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({
      error: { message: "Password has been used before" },
    })

    render(<ChangePasswordForm onClose={mockOnClose} />)
    await user.type(screen.getByPlaceholderText("Enter current password"), "OldPassword1!")
    await user.type(screen.getByPlaceholderText("Create a new password"), "NewPassword1!")
    await user.type(screen.getByPlaceholderText("Repeat your new password"), "NewPassword1!")
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() => {
      expect(screen.getByText("Password has been used before")).toBeInTheDocument()
    })
  })
})
