import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockSendNotification = vi.fn()

let mockNotificationsReturn = {
  notifications: [],
  dailyLimit: null,
  canSend: true,
  remainingSends: 2,
  isLoading: false,
  error: null as string | null,
  sendNotification: mockSendNotification,
  refreshLimits: vi.fn(),
}

vi.mock("@/lib/hooks/use-notifications", () => ({
  useNotifications: () => mockNotificationsReturn,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com" },
    profile: { id: "u1", display_name: "Yahya", email: "test@test.com", avatar_url: null, partner_id: "u2", role: "admin", created_at: "", updated_at: "" },
    partner: { id: "u2", display_name: "Yara", email: "yara@test.com", avatar_url: null, partner_id: "u1", role: "user", created_at: "", updated_at: "" },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div ref={ref} {...rest}>{children}</div>
    }),
    form: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLFormElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, onSubmit, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <form ref={ref} onSubmit={onSubmit as React.FormEventHandler} {...rest}>{children}</form>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { NotificationBuilder } from "@/components/relationship/NotificationBuilder"

describe("NotificationBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendNotification.mockResolvedValue(undefined)
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      canSend: true,
      remainingSends: 2,
      sendNotification: mockSendNotification,
    }
  })

  it("renders the notification builder form", () => {
    render(<NotificationBuilder />)
    expect(screen.getByTestId("notification-builder")).toBeInTheDocument()
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument()
    expect(screen.getByTestId("notification-title-input")).toBeInTheDocument()
    expect(screen.getByTestId("notification-body-input")).toBeInTheDocument()
  })

  it("shows preview with partner name", () => {
    render(<NotificationBuilder />)
    expect(screen.getByTestId("notification-preview")).toBeInTheDocument()
    expect(screen.getByText(/To Yara/)).toBeInTheDocument()
  })

  it("shows send limit indicator", () => {
    render(<NotificationBuilder />)
    expect(screen.getByTestId("send-limit-indicator")).toBeInTheDocument()
  })

  it("disables send when canSend is false", () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, canSend: false, remainingSends: 0 }
    render(<NotificationBuilder />)
    expect(screen.getByTestId("notification-send-button")).toBeDisabled()
  })

  it("calls sendNotification with form values on submit", async () => {
    render(<NotificationBuilder />)

    fireEvent.change(screen.getByTestId("notification-title-input"), { target: { value: "Hello" } })
    fireEvent.change(screen.getByTestId("notification-body-input"), { target: { value: "I love you" } })
    fireEvent.click(screen.getByTestId("notification-send-button"))

    await waitFor(() => {
      expect(mockSendNotification).toHaveBeenCalledWith("Hello", "I love you", undefined)
    })
  })

  it("validates empty title shows error", async () => {
    render(<NotificationBuilder />)

    fireEvent.change(screen.getByTestId("notification-body-input"), { target: { value: "Hello" } })
    fireEvent.click(screen.getByTestId("notification-send-button"))

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument()
    })
  })

  it("shows sent state after successful send", async () => {
    render(<NotificationBuilder />)

    fireEvent.change(screen.getByTestId("notification-title-input"), { target: { value: "Hey" } })
    fireEvent.change(screen.getByTestId("notification-body-input"), { target: { value: "Miss you" } })
    fireEvent.click(screen.getByTestId("notification-send-button"))

    await waitFor(() => {
      expect(screen.getByTestId("notification-sent")).toBeInTheDocument()
    })
  })
})
