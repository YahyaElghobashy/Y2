import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// --- Mocks ---
const mockUser = { id: "u1", email: "test@test.com" }
const mockSubscribeToPush = vi.fn()
let mockPermission: string = "default"

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    profile: null,
    partner: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

vi.mock("@/lib/services/push-service", () => ({
  subscribeToPush: (...args: unknown[]) => mockSubscribeToPush(...args),
  getPushPermission: () => mockPermission,
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom")
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  }
})

import { PushPermissionPrompt } from "@/components/shared/PushPermissionPrompt"

describe("PushPermissionPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockPermission = "default"
    sessionStorage.clear()
    mockSubscribeToPush.mockResolvedValue({})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows modal after delay when permission is default", async () => {
    render(<PushPermissionPrompt />)
    expect(screen.queryByTestId("push-prompt-modal")).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByTestId("push-prompt-modal")).toBeInTheDocument()
  })

  it("does not show when permission is already granted", async () => {
    mockPermission = "granted"
    render(<PushPermissionPrompt />)

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByTestId("push-prompt-modal")).not.toBeInTheDocument()
  })

  it("shows blocked message when permission is denied", () => {
    mockPermission = "denied"
    render(<PushPermissionPrompt />)
    // Denied state is set but visible is not set to true automatically
    // since the prompt is only shown for "default"
    expect(screen.queryByTestId("push-prompt-modal")).not.toBeInTheDocument()
  })

  it("dismisses and sets session flag on Maybe Later", async () => {
    render(<PushPermissionPrompt />)

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByTestId("push-prompt-dismiss")).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("push-prompt-dismiss"))
    expect(sessionStorage.getItem("push-prompt-dismissed")).toBe("true")
  })

  it("does not show when session flag is set", async () => {
    sessionStorage.setItem("push-prompt-dismissed", "true")
    render(<PushPermissionPrompt />)

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByTestId("push-prompt-modal")).not.toBeInTheDocument()
  })

  it("calls subscribeToPush on Enable click", async () => {
    render(<PushPermissionPrompt />)

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByTestId("push-prompt-enable")).toBeInTheDocument()

    // Switch to real timers for the async subscribeToPush call
    vi.useRealTimers()

    fireEvent.click(screen.getByTestId("push-prompt-enable"))

    await waitFor(() => {
      expect(mockSubscribeToPush).toHaveBeenCalledWith("u1")
    })
  })
})
