import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} {...rest}>{children}</div>
      )
    ),
    button: React.forwardRef(
      ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => (
        <button ref={ref} {...rest}>{children}</button>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { MonthlyLetterComposer } from "@/components/rituals/MonthlyLetterComposer"

describe("MonthlyLetterComposer", () => {
  const mockOnClose = vi.fn()
  const mockOnSend = vi.fn().mockResolvedValue(undefined)
  const mockOnUploadPhoto = vi.fn().mockResolvedValue("https://photo.url/img.jpg")

  const defaultProps = {
    open: true,
    partnerName: "Yara",
    onClose: mockOnClose,
    onSend: mockOnSend,
    onUploadPhoto: mockOnUploadPhoto,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders composer when open", () => {
      render(<MonthlyLetterComposer {...defaultProps} />)
      expect(screen.getByTestId("letter-composer")).toBeInTheDocument()
    })

    it("does not render when closed", () => {
      render(<MonthlyLetterComposer {...defaultProps} open={false} />)
      expect(screen.queryByTestId("letter-composer")).not.toBeInTheDocument()
    })

    it("shows partner greeting", () => {
      render(<MonthlyLetterComposer {...defaultProps} />)
      expect(screen.getByTestId("letter-greeting")).toHaveTextContent("Dear Yara,")
    })

    it("shows title", () => {
      render(<MonthlyLetterComposer {...defaultProps} />)
      expect(screen.getByTestId("composer-title")).toHaveTextContent("Monthly Letter")
    })

    it("send button disabled when empty", () => {
      render(<MonthlyLetterComposer {...defaultProps} />)
      expect(screen.getByTestId("send-button")).toBeDisabled()
    })

    it("shows character count", () => {
      render(<MonthlyLetterComposer {...defaultProps} />)
      expect(screen.getByTestId("char-count")).toHaveTextContent("0")
    })

    it("shows add photo button", () => {
      render(<MonthlyLetterComposer {...defaultProps} />)
      expect(screen.getByTestId("add-photo-button")).toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("enables send button when content typed", async () => {
      const user = userEvent.setup()
      render(<MonthlyLetterComposer {...defaultProps} />)

      await user.type(screen.getByTestId("letter-textarea"), "I love you")
      expect(screen.getByTestId("send-button")).not.toBeDisabled()
    })

    it("updates character count on type", async () => {
      const user = userEvent.setup()
      render(<MonthlyLetterComposer {...defaultProps} />)

      await user.type(screen.getByTestId("letter-textarea"), "Hello")
      expect(screen.getByTestId("char-count")).toHaveTextContent("5")
    })

    it("calls onSend with content on send", async () => {
      const user = userEvent.setup()
      render(<MonthlyLetterComposer {...defaultProps} />)

      await user.type(screen.getByTestId("letter-textarea"), "My letter content")
      await user.click(screen.getByTestId("send-button"))

      await waitFor(() => {
        expect(mockOnSend).toHaveBeenCalledWith("My letter content", undefined)
      })
    })

    it("calls onClose on X button", async () => {
      const user = userEvent.setup()
      render(<MonthlyLetterComposer {...defaultProps} />)

      await user.click(screen.getByTestId("close-button"))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it("does not send when only whitespace", async () => {
      const user = userEvent.setup()
      render(<MonthlyLetterComposer {...defaultProps} />)

      await user.type(screen.getByTestId("letter-textarea"), "   ")
      expect(screen.getByTestId("send-button")).toBeDisabled()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("has accessible dialog role", () => {
      render(<MonthlyLetterComposer {...defaultProps} />)
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Write monthly letter")
    })

    it("has textarea for content", () => {
      render(<MonthlyLetterComposer {...defaultProps} />)
      const textarea = screen.getByTestId("letter-textarea")
      expect(textarea.tagName.toLowerCase()).toBe("textarea")
      expect(textarea).toHaveAttribute("placeholder", "Write from the heart...")
    })

    it("has file input for photo", () => {
      render(<MonthlyLetterComposer {...defaultProps} />)
      expect(screen.getByTestId("photo-input")).toHaveAttribute("type", "file")
      expect(screen.getByTestId("photo-input")).toHaveAttribute("accept", "image/*")
    })
  })
})
