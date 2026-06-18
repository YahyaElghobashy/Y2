import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockSignUp = vi.fn()
const mockSupabase = { auth: { signUp: mockSignUp } }
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

// Cache mocked motion components per tag so re-renders (e.g. password strength
// state updates) don't remount the subtree and drop keystrokes.
vi.mock("framer-motion", () => {
  const cache: Record<string, React.ComponentType<Record<string, unknown>>> = {}
  return {
    motion: new Proxy(
      {},
      {
        get: (_t, tag: string) => {
          if (!cache[tag]) {
            cache[tag] = React.forwardRef(
              (
                {
                  children,
                  initial,
                  animate,
                  exit,
                  transition,
                  whileHover,
                  whileTap,
                  whileInView,
                  variants,
                  custom,
                  layoutId,
                  layout,
                  onAnimationComplete,
                  onAnimationStart,
                  ...dom
                }: Record<string, unknown> & { children?: React.ReactNode },
                ref: React.Ref<HTMLElement>
              ) => React.createElement(tag, { ...dom, ref }, children)
            ) as unknown as React.ComponentType<Record<string, unknown>>
          }
          return cache[tag]
        },
      }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  }
})

import SignupPage from "@/app/(auth)/signup/page"

const EXPECTED_REDIRECT = "http://localhost:3000/auth/callback?next=/"

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("What should we call you?"), "Yahya")
  await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
  await user.type(screen.getByPlaceholderText("Create a password"), "password123")
  await user.type(screen.getByPlaceholderText("Repeat your password"), "password123")
  await user.click(screen.getByRole("button", { name: "Create Account" }))
}

describe("Signup Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignUp.mockResolvedValue({ data: {}, error: null })
  })

  // ── Unit — render ──
  it("renders all four fields and submit button", () => {
    render(<SignupPage />)
    expect(screen.getByPlaceholderText("What should we call you?")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Create a password")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Repeat your password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument()
  })

  it("shows validation error when passwords don't match", async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    await user.type(screen.getByPlaceholderText("What should we call you?"), "Yahya")
    await user.type(screen.getByPlaceholderText("you@example.com"), "test@example.com")
    await user.type(screen.getByPlaceholderText("Create a password"), "password123")
    await user.type(screen.getByPlaceholderText("Repeat your password"), "different456")
    await user.click(screen.getByRole("button", { name: "Create Account" }))

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  // ── Interaction + Integration — signUp contract ──
  it("calls signUp with email, password and display_name", async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    await fillValidForm(user)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1)
    })
    const arg = mockSignUp.mock.calls[0][0]
    expect(arg.email).toBe("test@example.com")
    expect(arg.password).toBe("password123")
    expect(arg.options.data).toEqual({ display_name: "Yahya" })
  })

  it("passes emailRedirectTo pointing at /auth/callback (PKCE link target)", async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    await fillValidForm(user)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled()
    })
    expect(mockSignUp.mock.calls[0][0].options.emailRedirectTo).toBe(EXPECTED_REDIRECT)
  })

  it("redirects to /verify with the email after successful signup", async () => {
    const user = userEvent.setup()
    render(<SignupPage />)
    await fillValidForm(user)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/verify?email=test%40example.com")
    })
  })

  // ── Unit — error paths ──
  it("shows server error and does not redirect on signUp error", async () => {
    mockSignUp.mockResolvedValueOnce({ data: null, error: { message: "User already registered" } })
    const user = userEvent.setup()
    render(<SignupPage />)
    await fillValidForm(user)

    await waitFor(() => {
      expect(screen.getByText("User already registered")).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("shows network error on exception", async () => {
    mockSignUp.mockRejectedValueOnce(new Error("Network error"))
    const user = userEvent.setup()
    render(<SignupPage />)
    await fillValidForm(user)

    await waitFor(() => {
      expect(
        screen.getByText("Something went wrong. Check your connection.")
      ).toBeInTheDocument()
    })
  })
})
