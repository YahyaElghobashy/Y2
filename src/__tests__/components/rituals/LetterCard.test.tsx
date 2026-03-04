import React from "react"
import { render, screen } from "@testing-library/react"
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

vi.mock("date-fns", () => ({
  format: (date: Date, fmt: string) => {
    if (fmt === "MMMM yyyy") {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      return `${months[date.getMonth()]} ${date.getFullYear()}`
    }
    return date.toISOString()
  },
}))

import { LetterCard } from "@/components/rituals/LetterCard"

describe("LetterCard", () => {
  const defaultProps = {
    content: "You mean the world to me.\nEvery day is better with you.",
    date: "2026-03-01T10:00:00Z",
    authorName: "Yahya",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders card", () => {
      render(<LetterCard {...defaultProps} />)
      expect(screen.getByTestId("letter-card")).toBeInTheDocument()
    })

    it("shows formatted date", () => {
      render(<LetterCard {...defaultProps} />)
      expect(screen.getByTestId("letter-date")).toHaveTextContent("March 2026")
    })

    it("shows first line preview", () => {
      render(<LetterCard {...defaultProps} />)
      expect(screen.getByTestId("letter-preview")).toHaveTextContent("You mean the world to me.")
    })

    it("truncates long first line", () => {
      render(
        <LetterCard
          {...defaultProps}
          content="This is a very long first line that exceeds sixty characters and should be truncated with an ellipsis at the end"
        />
      )
      const preview = screen.getByTestId("letter-preview").textContent ?? ""
      expect(preview).toContain("...")
      expect(preview.length).toBeLessThanOrEqual(70)
    })

    it("shows author name", () => {
      render(<LetterCard {...defaultProps} />)
      expect(screen.getByTestId("letter-author")).toHaveTextContent("— Yahya")
    })

    it("has accessible aria-label", () => {
      render(<LetterCard {...defaultProps} />)
      expect(screen.getByTestId("letter-card")).toHaveAttribute("aria-label", "Letter from Yahya, March 2026")
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("opens expanded view on click", async () => {
      const user = userEvent.setup()
      render(<LetterCard {...defaultProps} />)

      await user.click(screen.getByTestId("letter-card"))
      expect(screen.getByTestId("letter-expanded")).toBeInTheDocument()
    })

    it("shows full content in expanded view", async () => {
      const user = userEvent.setup()
      render(<LetterCard {...defaultProps} />)

      await user.click(screen.getByTestId("letter-card"))
      const expanded = screen.getByTestId("expanded-content")
      expect(expanded.textContent).toContain("You mean the world to me.")
      expect(expanded.textContent).toContain("Every day is better with you.")
    })

    it("closes expanded view on close button", async () => {
      const user = userEvent.setup()
      render(<LetterCard {...defaultProps} />)

      await user.click(screen.getByTestId("letter-card"))
      expect(screen.getByTestId("letter-expanded")).toBeInTheDocument()

      await user.click(screen.getByTestId("close-expanded"))
      expect(screen.queryByTestId("letter-expanded")).not.toBeInTheDocument()
    })

    it("closes expanded view on backdrop click", async () => {
      const user = userEvent.setup()
      render(<LetterCard {...defaultProps} />)

      await user.click(screen.getByTestId("letter-card"))
      await user.click(screen.getByTestId("letter-backdrop"))
      expect(screen.queryByTestId("letter-expanded")).not.toBeInTheDocument()
    })

    it("shows photo in expanded view when provided", async () => {
      const user = userEvent.setup()
      render(<LetterCard {...defaultProps} photoUrl="https://img.com/photo.jpg" />)

      await user.click(screen.getByTestId("letter-card"))
      expect(screen.getByTestId("expanded-photo")).toHaveAttribute("src", "https://img.com/photo.jpg")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("expanded view has dialog role", async () => {
      const user = userEvent.setup()
      render(<LetterCard {...defaultProps} />)

      await user.click(screen.getByTestId("letter-card"))
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Letter detail")
    })

    it("shows date in expanded view", async () => {
      const user = userEvent.setup()
      render(<LetterCard {...defaultProps} />)

      await user.click(screen.getByTestId("letter-card"))
      expect(screen.getByTestId("expanded-date")).toHaveTextContent("March 2026")
    })

    it("does not show photo when not provided", async () => {
      const user = userEvent.setup()
      render(<LetterCard {...defaultProps} />)

      await user.click(screen.getByTestId("letter-card"))
      expect(screen.queryByTestId("expanded-photo")).not.toBeInTheDocument()
    })
  })
})
