import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockSignIn = vi.fn()
const mockSupabase = {
  auth: {
    signInWithPassword: mockSignIn,
  },
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void transition; void whileHover; void whileTap;
      return <div {...rest}>{children}</div>
    },
  },
}))

import LoginPage from "@/app/(auth)/login/page"

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignIn.mockResolvedValue({ data: {}, error: null })
  })

  it("renders the Hayah heading", () => {
    render(<LoginPage />)
    expect(screen.getByText("Hayah")).toBeInTheDocument()
  })

  it("renders the Arabic subtitle", () => {
    render(<LoginPage />)
    expect(screen.getByText("حياة")).toBeInTheDocument()
  })

  it("renders email and password inputs", () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument()
  })

  it("renders the Sign In button", () => {
    render(<LoginPage />)
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument()
  })

  it("shows validation error for invalid email on blur", async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText("Email")
    await user.type(emailInput, "notanemail")
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email")).toBeInTheDocument()
    })
  })

  it("shows validation error for empty password on blur", async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const passwordInput = screen.getByPlaceholderText("Password")
    await user.click(passwordInput)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText("Password is required")).toBeInTheDocument()
    })
  })

  it("calls signInWithPassword on valid submit", async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText("Email"), "test@example.com")
    await user.type(screen.getByPlaceholderText("Password"), "password123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      })
    })
  })

  it("redirects to / on successful sign in", async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText("Email"), "test@example.com")
    await user.type(screen.getByPlaceholderText("Password"), "password123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/")
    })
  })

  it("shows error message on failed sign in", async () => {
    mockSignIn.mockResolvedValueOnce({ data: null, error: { message: "Invalid credentials" } })
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText("Email"), "wrong@example.com")
    await user.type(screen.getByPlaceholderText("Password"), "wrongpass")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument()
    })
  })

  it("shows network error on exception", async () => {
    mockSignIn.mockRejectedValueOnce(new Error("Network error"))
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText("Email"), "test@example.com")
    await user.type(screen.getByPlaceholderText("Password"), "password123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Check your connection.")).toBeInTheDocument()
    })
  })

  it("shows loading state during submit", async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})) // never resolves
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText("Email"), "test@example.com")
    await user.type(screen.getByPlaceholderText("Password"), "password123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeInTheDocument()
    })
  })

  it("disables button during submit", async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText("Email"), "test@example.com")
    await user.type(screen.getByPlaceholderText("Password"), "password123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled()
    })
  })

  it("email input has correct autocomplete attribute", () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("autocomplete", "email")
  })
})
