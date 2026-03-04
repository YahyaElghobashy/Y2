import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ── Mocks ──

const mockSendNotification = vi.fn()

let mockNotificationsReturn = {
  notifications: [],
  dailyLimit: null,
  canSend: true,
  remainingSends: 2,
  isLoading: false,
  error: null as string | null,
  sendNotification: mockSendNotification,
  purchaseBonusSend: vi.fn(),
  refreshLimits: vi.fn(),
}

vi.mock("@/lib/hooks/use-notifications", () => ({
  useNotifications: () => mockNotificationsReturn,
}))

import { CustomPingComposer } from "@/components/ping/CustomPingComposer"

describe("CustomPingComposer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotificationsReturn = {
      ...mockNotificationsReturn,
      canSend: true,
      remainingSends: 2,
    }
    mockSendNotification.mockResolvedValue(undefined)
  })

  it("renders input and send button", () => {
    render(<CustomPingComposer />)
    expect(screen.getByTestId("custom-ping-input")).toBeInTheDocument()
    expect(screen.getByTestId("custom-ping-send")).toBeInTheDocument()
  })

  it("sends ping with message on button click", async () => {
    render(<CustomPingComposer />)
    fireEvent.change(screen.getByTestId("custom-ping-input"), { target: { value: "Hello partner!" } })
    fireEvent.click(screen.getByTestId("custom-ping-send"))

    await waitFor(() => {
      expect(mockSendNotification).toHaveBeenCalledWith("Ping", "Hello partner!")
    })
  })

  it("clears input after successful send", async () => {
    render(<CustomPingComposer />)
    const input = screen.getByTestId("custom-ping-input") as HTMLInputElement
    fireEvent.change(input, { target: { value: "Test message" } })
    fireEvent.click(screen.getByTestId("custom-ping-send"))

    await waitFor(() => {
      expect(input.value).toBe("")
    })
  })

  it("sends on Enter key press", async () => {
    render(<CustomPingComposer />)
    const input = screen.getByTestId("custom-ping-input")
    fireEvent.change(input, { target: { value: "Enter test" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(mockSendNotification).toHaveBeenCalledWith("Ping", "Enter test")
    })
  })

  it("does not send empty message", () => {
    render(<CustomPingComposer />)
    fireEvent.click(screen.getByTestId("custom-ping-send"))
    expect(mockSendNotification).not.toHaveBeenCalled()
  })

  it("disables input when canSend is false", () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, canSend: false }
    render(<CustomPingComposer />)
    expect(screen.getByTestId("custom-ping-input")).toBeDisabled()
  })

  it("shows lock icon when canSend is false", () => {
    mockNotificationsReturn = { ...mockNotificationsReturn, canSend: false }
    render(<CustomPingComposer />)
    expect(screen.getByLabelText("Send limit reached")).toBeInTheDocument()
  })

  it("shows character count at 150+ characters", () => {
    render(<CustomPingComposer />)
    const longText = "a".repeat(155)
    fireEvent.change(screen.getByTestId("custom-ping-input"), { target: { value: longText } })
    expect(screen.getByTestId("custom-ping-count")).toHaveTextContent("155/200")
  })
})
