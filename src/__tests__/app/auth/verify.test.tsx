import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// --- Mocks ---
const { state } = vi.hoisted(() => ({ state: { email: "test@example.com" as string | null } }))

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (k: string) => (k === "email" ? state.email : null) }),
}))

const mockResend = vi.fn()
const mockSupabase = { auth: { resend: mockResend } }
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

// Cache mocked motion components per tag so re-renders don't remount the subtree.
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

import VerifyPage from "@/app/(auth)/verify/page"

const EXPECTED_REDIRECT = "http://localhost:3000/auth/callback?next=/"

// Render, burn the 60s resend cooldown via fake timers, then return to real
// timers so userEvent / waitFor work without a fake-timer deadlock.
async function renderPastCooldown() {
  vi.useFakeTimers()
  render(<VerifyPage />)
  await act(async () => {
    vi.advanceTimersByTime(60_000)
  })
  vi.useRealTimers()
  return userEvent.setup()
}

describe("Verify Page (email-confirmation link)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.email = "test@example.com"
    mockResend.mockResolvedValue({ data: {}, error: null })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Unit — render ──
  it("shows the 'check your email' copy and the recipient address", () => {
    render(<VerifyPage />)
    expect(screen.getByText("Check your email")).toBeInTheDocument()
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
  })

  it("does NOT render the 6-digit OTP flow anymore", () => {
    render(<VerifyPage />)
    expect(screen.queryByText("Verify your email")).not.toBeInTheDocument()
    expect(screen.queryByText(/6-digit code/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Verify" })).not.toBeInTheDocument()
    // No single-char OTP inputs
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("starts the resend button on a 60s cooldown (disabled)", () => {
    render(<VerifyPage />)
    const btn = screen.getByRole("button", { name: /Resend link in 60s/i })
    expect(btn).toBeDisabled()
  })

  // ── Unit — guard ──
  it("shows a guard when no email is provided", () => {
    state.email = null
    render(<VerifyPage />)
    expect(screen.getByText("No email provided.")).toBeInTheDocument()
  })

  // ── Interaction + Integration — resend ──
  it("resends signup confirmation with the PKCE emailRedirectTo after cooldown", async () => {
    const user = await renderPastCooldown()

    const btn = screen.getByRole("button", { name: "Resend Link" })
    expect(btn).toBeEnabled()
    await user.click(btn)

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledTimes(1)
    })
    const arg = mockResend.mock.calls[0][0]
    expect(arg.type).toBe("signup")
    expect(arg.email).toBe("test@example.com")
    expect(arg.options.emailRedirectTo).toBe(EXPECTED_REDIRECT)
  })

  it("shows a confirmation message after a successful resend", async () => {
    const user = await renderPastCooldown()
    await user.click(screen.getByRole("button", { name: "Resend Link" }))

    await waitFor(() => {
      expect(screen.getByText("A new link is on its way.")).toBeInTheDocument()
    })
  })

  it("shows an error when resend fails", async () => {
    mockResend.mockResolvedValueOnce({ data: null, error: { message: "rate limited" } })
    const user = await renderPastCooldown()
    await user.click(screen.getByRole("button", { name: "Resend Link" }))

    await waitFor(() => {
      expect(screen.getByText("rate limited")).toBeInTheDocument()
    })
  })
})
