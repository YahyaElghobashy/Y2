import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLDivElement>
      ) => {
        const { initial, animate, exit, transition, whileHover, whileTap, variants, ...rest } = props
        void initial; void animate; void exit; void transition; void whileHover; void whileTap; void variants
        return <div ref={ref} {...rest}>{children}</div>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CreateCouponStep4 } from "@/components/coupons/CreateCouponStep4"
import type { CouponFormData } from "@/components/coupons/CreateCouponStep4"

const baseData: CouponFormData = {
  title: "Movie Night",
  description: "Pick any movie you want",
  emoji: "🎬",
  category: "fun",
  hasExpiry: false,
  isSurprise: false,
}

describe("CreateCouponStep4", () => {
  const mockOnSend = vi.fn<() => Promise<void>>()
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSend.mockResolvedValue(undefined)
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderStep4 = (data: CouponFormData = baseData) =>
    render(
      <CreateCouponStep4
        data={data}
        onSend={mockOnSend}
        onBack={mockOnBack}
      />
    )

  // ─── Unit Tests ───────────────────────────────────────────────────

  describe("Unit", () => {
    it("renders the preview heading", () => {
      renderStep4()
      expect(screen.getByText("Looking good!")).toBeInTheDocument()
    })

    it("renders the emoji in the preview card", () => {
      renderStep4()
      expect(screen.getByText("🎬")).toBeInTheDocument()
    })

    it("renders the coupon title in the preview card", () => {
      renderStep4()
      expect(screen.getByText("Movie Night")).toBeInTheDocument()
    })

    it("renders the coupon description in the preview card", () => {
      renderStep4()
      expect(screen.getByText("Pick any movie you want")).toBeInTheDocument()
    })

    it("renders the category badge with correct text", () => {
      renderStep4()
      expect(screen.getByText("fun")).toBeInTheDocument()
    })

    it("renders category badge for each category variant", () => {
      const categories = ["romantic", "practical", "fun", "food", "general"] as const
      for (const category of categories) {
        const { unmount } = renderStep4({ ...baseData, category })
        expect(screen.getByText(category)).toBeInTheDocument()
        unmount()
      }
    })

    it("renders the surprise badge when isSurprise is true", () => {
      renderStep4({ ...baseData, isSurprise: true })
      expect(screen.getByTestId("surprise-badge")).toBeInTheDocument()
      expect(screen.getByTestId("surprise-badge")).toHaveTextContent("Surprise")
    })

    it("does not render surprise badge when isSurprise is false", () => {
      renderStep4({ ...baseData, isSurprise: false })
      expect(screen.queryByTestId("surprise-badge")).not.toBeInTheDocument()
    })

    it("renders the expiry date when hasExpiry is true and expiryDate is set", () => {
      renderStep4({ ...baseData, hasExpiry: true, expiryDate: "2026-12-31" })
      expect(screen.getByText("Expires 2026-12-31")).toBeInTheDocument()
    })

    it("does not render expiry info when hasExpiry is false", () => {
      renderStep4({ ...baseData, hasExpiry: false, expiryDate: "2026-12-31" })
      expect(screen.queryByText(/Expires/)).not.toBeInTheDocument()
    })

    it("does not render expiry info when hasExpiry is true but expiryDate is missing", () => {
      renderStep4({ ...baseData, hasExpiry: true })
      expect(screen.queryByText(/Expires/)).not.toBeInTheDocument()
    })

    it("renders image preview when imagePreview is provided", () => {
      renderStep4({ ...baseData, imagePreview: "blob:http://localhost/img" })
      const img = screen.getByAltText("Preview")
      expect(img).toHaveAttribute("src", "blob:http://localhost/img")
    })

    it("does not render image preview when imagePreview is not provided", () => {
      renderStep4()
      expect(screen.queryByAltText("Preview")).not.toBeInTheDocument()
    })

    it("does not render description when it is not provided", () => {
      renderStep4({ ...baseData, description: undefined })
      expect(screen.queryByText("Pick any movie you want")).not.toBeInTheDocument()
    })

    it("calls onBack when Back button is clicked", async () => {
      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const backBtn = screen.getByTestId("back-button")
      await user.click(backBtn)
      expect(mockOnBack).toHaveBeenCalledTimes(1)
    })

    it("renders preview card with all data fields simultaneously", () => {
      renderStep4({
        ...baseData,
        isSurprise: true,
        hasExpiry: true,
        expiryDate: "2026-06-15",
        imagePreview: "blob:http://localhost/full-preview",
      })

      expect(screen.getByText("🎬")).toBeInTheDocument()
      expect(screen.getByText("Movie Night")).toBeInTheDocument()
      expect(screen.getByText("Pick any movie you want")).toBeInTheDocument()
      expect(screen.getByText("fun")).toBeInTheDocument()
      expect(screen.getByTestId("surprise-badge")).toBeInTheDocument()
      expect(screen.getByText("Expires 2026-06-15")).toBeInTheDocument()
      expect(screen.getByAltText("Preview")).toHaveAttribute("src", "blob:http://localhost/full-preview")
    })
  })

  // ─── Interaction Tests ────────────────────────────────────────────

  describe("Interaction", () => {
    it("Send button triggers onSend after animation delay", async () => {
      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const sendBtn = screen.getByTestId("send-button")

      await user.click(sendBtn)

      // onSend is called inside a 300ms setTimeout
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledTimes(1)
      })
    })

    it("Send button shows 'Sending...' text during send", async () => {
      // Make onSend hang so we can check loading state
      mockOnSend.mockReturnValue(new Promise(() => {}))
      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const sendBtn = screen.getByTestId("send-button")

      expect(sendBtn).toHaveTextContent("Send")

      await user.click(sendBtn)

      // After click, isSending becomes true immediately
      expect(screen.getByTestId("send-button")).toHaveTextContent("Sending...")
    })

    it("Send button is disabled during send", async () => {
      mockOnSend.mockReturnValue(new Promise(() => {}))
      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const sendBtn = screen.getByTestId("send-button")

      expect(sendBtn).not.toBeDisabled()

      await user.click(sendBtn)

      expect(screen.getByTestId("send-button")).toBeDisabled()
    })

    it("Back button is hidden during send", async () => {
      mockOnSend.mockReturnValue(new Promise(() => {}))
      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      expect(screen.getByTestId("back-button")).toBeInTheDocument()

      await user.click(screen.getByTestId("send-button"))

      expect(screen.queryByTestId("back-button")).not.toBeInTheDocument()
    })

    it("shows send animation (fly-away) after clicking Send", async () => {
      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      // Preview card should be visible before send
      expect(screen.getByTestId("preview-card")).toBeInTheDocument()

      await user.click(screen.getByTestId("send-button"))

      // After clicking send, flyAway is true so send-animation replaces preview-card
      expect(screen.getByTestId("send-animation")).toBeInTheDocument()
      expect(screen.queryByTestId("preview-card")).not.toBeInTheDocument()
    })

    it("Send button shows Send icon and text before sending", () => {
      renderStep4()
      const sendBtn = screen.getByTestId("send-button")
      expect(sendBtn).toHaveTextContent("Send")
    })
  })

  // ─── Integration Tests ────────────────────────────────────────────

  describe("Integration", () => {
    it("completes async onSend flow: click send -> animation -> onSend resolves", async () => {
      let resolveOnSend: () => void
      mockOnSend.mockImplementation(
        () => new Promise<void>((resolve) => { resolveOnSend = resolve })
      )

      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      await user.click(screen.getByTestId("send-button"))

      // Should be in sending state
      expect(screen.getByTestId("send-button")).toHaveTextContent("Sending...")
      expect(screen.getByTestId("send-button")).toBeDisabled()

      // Advance past the 300ms setTimeout
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledTimes(1)
      })

      // Resolve the send
      await act(async () => {
        resolveOnSend!()
      })

      // After resolve, component keeps sending state (parent handles navigation)
      expect(screen.getByTestId("send-button")).toBeDisabled()
    })

    it("recovers from onSend error: resets isSending and flyAway", async () => {
      mockOnSend.mockRejectedValue(new Error("Network error"))
      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      await user.click(screen.getByTestId("send-button"))

      // Advance past 300ms setTimeout to trigger onSend
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // After rejection, state should reset
      await waitFor(() => {
        expect(screen.getByTestId("send-button")).not.toBeDisabled()
      })
      expect(screen.getByTestId("send-button")).toHaveTextContent("Send")
      // Preview card should be back (flyAway reset to false)
      expect(screen.getByTestId("preview-card")).toBeInTheDocument()
      expect(screen.queryByTestId("send-animation")).not.toBeInTheDocument()
      // Back button should be visible again
      expect(screen.getByTestId("back-button")).toBeInTheDocument()
    })

    it("cannot double-click send because button is disabled after first click", async () => {
      mockOnSend.mockReturnValue(new Promise(() => {}))
      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      const sendBtn = screen.getByTestId("send-button")
      await user.click(sendBtn)

      expect(screen.getByTestId("send-button")).toBeDisabled()

      // Advance timers for the first call
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // onSend should only be called once despite potential double clicks
      expect(mockOnSend).toHaveBeenCalledTimes(1)
    })

    it("falls back to general category style for unknown categories", () => {
      // @ts-expect-error testing unknown category fallback
      renderStep4({ ...baseData, category: "unknown_category" })
      // Should render without crashing, using general fallback
      expect(screen.getByText("unknown_category")).toBeInTheDocument()
    })

    it("onSend is called with no arguments (parent provides data via closure)", async () => {
      renderStep4()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      await user.click(screen.getByTestId("send-button"))

      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledTimes(1)
      })
      // onSend takes no args
      expect(mockOnSend).toHaveBeenCalledWith()
    })
  })
})
